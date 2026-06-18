package com.fh_wedel.matching.service;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.events.MatchingRequestEvent;
import com.fh_wedel.matching.model.events.MatchingResponseEvent;
import com.fh_wedel.matching.repository.MatchRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fh_wedel.matching.client.UserProfile;
import com.fh_wedel.matching.client.UserServiceClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Core business logic for matching submissions with reviewers.
 * <p>
 * Workflow:
 * <ol>
 *   <li>Receive a matching request (from SQS or triggered programmatically)</li>
 *   <li>Fetch all users in the Cognito 'Reviewer' group</li>
 *   <li>Exclude the submitter from the pool (self-review prevention)</li>
 *   <li>Randomly select the requested number of reviewers</li>
 *   <li>Persist match records + status in DynamoDB</li>
 *   <li>On success: send a confirmation SQS event to the Submission Service</li>
 *   <li>On failure (insufficient reviewers): persist FAILED status, no SQS event</li>
 * </ol>
 */
@Service
@Slf4j
public class MatchingService {

    private final UserServiceClient userServiceClient;
    private final MatchRepository matchRepository;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String responseQueueName;

    public MatchingService(UserServiceClient userServiceClient,
                           MatchRepository matchRepository,
                           SqsTemplate sqsTemplate,
                           ObjectMapper objectMapper,
                           @Value("${aws.sqs.next.request.queue-name}") String responseQueueName) {
        this.userServiceClient = userServiceClient;
        this.matchRepository = matchRepository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.responseQueueName = responseQueueName;
    }

    /**
     * Processes a matching request: assigns reviewers to a submission.
     *
     * @param event the matching request event containing submissionId, submitterId, numberOfExaminers
     */
    public void processMatchingRequest(MatchingRequestEvent event) {
        String submissionId = event.getSubmissionId();
        String submitterId = event.getSubmitterId();
        int numberOfExaminers = event.getNumberOfExaminers();

        log.info("Processing matching request: submissionId={}, submitterId={}, numberOfExaminers={}",
                submissionId, submitterId, numberOfExaminers);

        // 1. Fetch all reviewers from User Service
        List<UserProfile> allReviewers = userServiceClient.listReviewers();

        // 2. Filter out the submitter (self-review prevention)
        List<UserProfile> eligibleReviewers = allReviewers.stream()
                .filter(user -> {
                    String sub = user.getSub();
                    return sub != null && !sub.equals(submitterId);
                })
                .toList();

        log.info("Found {} total reviewers, {} eligible (after excluding submitter {})",
                allReviewers.size(), eligibleReviewers.size(), submitterId);

        // 3. Check if we have enough eligible reviewers
        if (eligibleReviewers.size() < numberOfExaminers) {
            String reason = String.format(
                    "Not enough eligible reviewers. Required: %d, available: %d (total: %d, excluded submitter: %s)",
                    numberOfExaminers, eligibleReviewers.size(), allReviewers.size(), submitterId);

            log.warn("Matching FAILED for submission {}: {}", submissionId, reason);

            SubmissionStatusRecord failedStatus = new SubmissionStatusRecord(
                    submissionId, submitterId, MatchStatus.FAILED, numberOfExaminers, reason);
            matchRepository.saveStatus(failedStatus);

            return; // No SQS event on failure
        }

        // 4. Randomly select the required number of reviewers
        List<UserProfile> selectedReviewers = selectRandomReviewers(eligibleReviewers, numberOfExaminers);

        // 5. Create match records
        List<MatchRecord> matchRecords = new ArrayList<>();
        for (UserProfile reviewer : selectedReviewers) {
            String examinerId = reviewer.getSub();
            matchRecords.add(new MatchRecord(submissionId, examinerId));
            log.info("Selected reviewer: sub={}, username={}", examinerId, reviewer.getUsername());
        }

        // 6. Persist match records + status in DynamoDB (batch write)
        SubmissionStatusRecord successStatus = new SubmissionStatusRecord(
                submissionId, submitterId, MatchStatus.MATCHED, numberOfExaminers, null);
        matchRepository.saveMatchBatch(matchRecords, successStatus);

        log.info("Successfully matched submission {} with {} reviewers", submissionId, numberOfExaminers);

        // 7. Send success event to SQS
        sendSuccessEvent(submissionId);
    }

    /**
     * Retrieves all match records for a submission, along with the status.
     */
    public SubmissionStatusRecord getStatusBySubmission(String submissionId) {
        return matchRepository.findStatusBySubmission(submissionId);
    }

    /**
     * Retrieves all match records for a submission.
     */
    public List<MatchRecord> getMatchesBySubmission(String submissionId) {
        return matchRepository.findMatchesBySubmission(submissionId);
    }

    /**
     * Retrieves all submissions assigned to a specific examiner.
     */
    public List<MatchRecord> getMatchesByExaminer(String examinerId) {
        return matchRepository.findMatchesByExaminer(examinerId);
    }

    /**
     * Returns a service health status string.
     */
    public String getServiceStatus() {
        return "Matching Service is up and running!";
    }

    /**
     * Selects a random subset of reviewers from the eligible pool.
     */
    List<UserProfile> selectRandomReviewers(List<UserProfile> eligible, int count) {
        List<UserProfile> shuffled = new ArrayList<>(eligible);
        Collections.shuffle(shuffled);
        return shuffled.subList(0, count);
    }

    /**
     * Sends a success SQS event to the Submission Service response queue.
     */
    private void sendSuccessEvent(String submissionId) {
        if (responseQueueName == null || responseQueueName.isBlank()) {
            log.warn("No SQS response queue defined. Skipping sending success event for submission {}", submissionId);
            return;
        }

        MatchingResponseEvent responseEvent = new MatchingResponseEvent();
        responseEvent.setSubmissionId(submissionId);
        responseEvent.setStatus(MatchingResponseEvent.Status.MATCHED);

        try {
            String messageBody = objectMapper.writeValueAsString(responseEvent);
            sqsTemplate.send(responseQueueName, messageBody);
            log.info("Sent success event to queue '{}' for submission {}", responseQueueName, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize success event for submission {}", submissionId, e);
        }
    }
}
