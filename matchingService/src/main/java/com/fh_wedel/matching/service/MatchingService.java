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
import com.fh_wedel.user.client.model.UserProfile;
import com.fh_wedel.user.client.api.GroupsApi;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import com.fh_wedel.matching.model.events.NotificationEvent;

/**
 * Core business logic for matching submissions with reviewers.
 * <p>
 * Workflow:
 * <ol>
 * <li>Receive a matching request (from SQS or triggered programmatically)</li>
 * <li>Fetch all users in the Cognito 'Reviewer' group</li>
 * <li>Exclude the submitter from the pool (self-review prevention)</li>
 * <li>Randomly select the requested number of reviewers</li>
 * <li>Persist match records + status in DynamoDB</li>
 * <li>On success: send a confirmation SQS event to the Submission Service</li>
 * <li>On failure (insufficient reviewers): persist FAILED status, no SQS
 * event</li>
 * </ol>
 */
@Service
@Slf4j
public class MatchingService {

    private final GroupsApi groupsApi;
    private final MatchRepository matchRepository;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String responseQueueName;
    private final String notificationQueueName;

    public MatchingService(GroupsApi groupsApi,
            MatchRepository matchRepository,
            SqsTemplate sqsTemplate,
            ObjectMapper objectMapper,
            @Value("${aws.sqs.next.request.queue-name}") String responseQueueName,
            @Value("${aws.sqs.notification.queue-name}") String notificationQueueName) {
        this.groupsApi = groupsApi;
        this.matchRepository = matchRepository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.responseQueueName = responseQueueName;
        this.notificationQueueName = notificationQueueName;
    }

    /**
     * Processes a matching request: assigns reviewers to a submission.
     *
     * @param event the matching request event containing submissionId, submitterId,
     *              numberOfExaminers
     */
    public void processMatchingRequest(MatchingRequestEvent event) {
        String submissionId = event.getSubmissionId();
        List<String> submitterIds = event.getSubmitterIds();
        int numberOfExaminers = event.getNumberOfExaminers();

        String requiredTopic = event.getTopicTag();

        log.info("Processing matching request: submissionId={}, submitterIds={}, numberOfExaminers={}, topicTag={}",
                submissionId, submitterIds, numberOfExaminers, requiredTopic);

        List<String> customReviewerIds = event.getCustomReviewerIds();
        boolean bypassMatching = customReviewerIds != null && !customReviewerIds.isEmpty();

        // 1. Fetch all reviewers from User Service (only if we need to match)
        List<UserProfile> allReviewers = java.util.Collections.emptyList();
        if (!bypassMatching) {
            try {
                var response = groupsApi.listGroupMembers("Reviewer");
                if (response != null && response.getUsers() != null) {
                    allReviewers = response.getUsers();
                }
            } catch (Exception e) {
                log.error("Failed to list reviewers via GroupsApi", e);
            }
        }

        // 2. Filter out the submitters, inactive reviewers, and those without the required topic tag
        List<UserProfile> eligibleReviewers = java.util.Collections.emptyList();
        
        if (!bypassMatching) {
            eligibleReviewers = allReviewers.stream()
                    .filter(user -> {
                        String sub = user.getSub();
                        if (sub == null || submitterIds.contains(sub)) {
                            return false;
                        }

                        Map<String, String> customAttrs = user.getCustomAttributes();
                        if (customAttrs == null) {
                            return false;
                        }

                        String isActiveStr = customAttrs.get("isActive");
                        boolean isActive = Boolean.parseBoolean(isActiveStr);
                        if (!isActive) {
                            return false;
                        }

                        String topicTagsStr = customAttrs.get("topicTags");
                        if (topicTagsStr == null || requiredTopic == null) {
                            return false;
                        }

                        String cleanTopicTags = topicTagsStr.replace("[", "").replace("]", "").replace("\"", "");
                        String cleanRequired = requiredTopic.replace("[", "").replace("]", "").replace("\"", "").trim();

                        List<String> tags = java.util.Arrays.asList(cleanTopicTags.split("\\s*,\\s*"));
                        return tags.stream().anyMatch(t -> t.trim().equalsIgnoreCase(cleanRequired));
                    })
                    .toList();

            log.info("Found {} total reviewers, {} eligible (after excluding submitters {})",
                    allReviewers.size(), eligibleReviewers.size(), submitterIds);

            // 3. Check if we have enough eligible reviewers
            if (eligibleReviewers.size() < numberOfExaminers) {
                handleInsufficientReviewers(submissionId, submitterIds, numberOfExaminers, eligibleReviewers.size(), allReviewers.size());
                return; // No SQS event on failure
            }
        }

        // 4. Randomly select the required number of reviewers (or use custom reviewers if provided)
        List<UserProfile> selectedReviewers = new ArrayList<>();
        
        if (customReviewerIds != null && !customReviewerIds.isEmpty()) {
            selectedReviewers = buildCustomReviewers(customReviewerIds);
            numberOfExaminers = customReviewerIds.size();
        } else {
            selectedReviewers = selectRandomReviewers(eligibleReviewers, numberOfExaminers);
        }

        // 5. Create match records
        List<MatchRecord> matchRecords = new ArrayList<>();
        for (UserProfile reviewer : selectedReviewers) {
            String examinerId = reviewer.getSub();
            matchRecords.add(new MatchRecord(submissionId, examinerId));
            log.info("Selected reviewer: sub={}, username={}", examinerId, reviewer.getUsername());
        }

        // 6. Persist match records + status in DynamoDB (batch write)
        SubmissionStatusRecord successStatus = new SubmissionStatusRecord(
                submissionId, submitterIds, MatchStatus.MATCHED, numberOfExaminers, null);
        matchRepository.saveMatchBatch(matchRecords, successStatus);

        log.info("Successfully matched submission {} with {} reviewers", submissionId, numberOfExaminers);

        // 7. Send success event to SQS
        sendSuccessEvent(submissionId, submitterIds);

        sendNotificationsForMatches(matchRecords, submissionId);
    }

    private void handleInsufficientReviewers(String submissionId, List<String> submitterIds, int required, int eligibleSize, int totalSize) {
        String reason = String.format(
                "Not enough eligible reviewers. Required: %d, available: %d (total: %d, excluded submitters: %s)",
                required, eligibleSize, totalSize, submitterIds);

        log.warn("Matching FAILED for submission {}: {}", submissionId, reason);

        SubmissionStatusRecord failedStatus = new SubmissionStatusRecord(
                submissionId, submitterIds, MatchStatus.FAILED, required, reason);
        matchRepository.saveStatus(failedStatus);

        for (String sId : submitterIds) {
            sendInAppNotification(sId, "Matching Failed",
                    "Matching failed for your submission: " + reason, submissionId);
        }
    }

    private List<UserProfile> buildCustomReviewers(List<String> customReviewerIds) {
        log.info("Bypassing random matching because custom reviewers were provided: {}", customReviewerIds);
        List<UserProfile> selectedReviewers = new ArrayList<>();
        for (String customId : customReviewerIds) {
            UserProfile dummyProfile = new UserProfile();
            dummyProfile.setSub(customId);
            dummyProfile.setUsername("CustomReviewer");
            selectedReviewers.add(dummyProfile);
        }
        return selectedReviewers;
    }

    private void sendNotificationsForMatches(List<MatchRecord> matchRecords, String submissionId) {
        for (MatchRecord match : matchRecords) {
            sendInAppNotification(match.getExaminerId(),
                    "Review Assigned",
                    "You have been assigned to review submission " + submissionId,
                    submissionId);
        }
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
     * Sends an IN_APP NotificationEvent to the notification request queue.
     * Skips silently when no notification queue is configured (e.g. local dev).
     */
    private void sendInAppNotification(String recipientSub, String subject, String body, String submissionId) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping in-app notification for {}", recipientSub);
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "MATCHING",
                List.of("IN_APP"),
                recipientSub,
                subject,
                body,
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent in-app notification to '{}' for submission {}", recipientSub, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize in-app notification for {}", recipientSub, e);
        }
    }

    /**
     * Sends a success SQS event to the Submission Service response queue.
     */
    private void sendSuccessEvent(String submissionId, List<String> authorIds) {
        if (responseQueueName == null || responseQueueName.isBlank()) {
            log.warn("No SQS response queue defined. Skipping sending success event for submission {}", submissionId);
            return;
        }

        MatchingResponseEvent responseEvent = new MatchingResponseEvent();
        responseEvent.setSubmissionId(submissionId);
        responseEvent.setAuthorIds(authorIds);
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
