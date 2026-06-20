package com.fh_wedel.response.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.DefaultApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import com.fh_wedel.response.model.GradingCriterion;
import com.fh_wedel.response.model.NotificationEvent;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import com.fh_wedel.workflow.client.api.WorkflowReviewsApi;
import com.fh_wedel.workflow.client.model.ReviewQuestionDto;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Slf4j
public class ResultService {

    private final ReviewResultRepository repository;
    private final DocumentStorageService documentStorageService;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String notificationQueueName;
    private final WorkflowReviewsApi workflowReviewsApi;
    private final MatchesApi matchesApi;
    private final DefaultApi configurationApi;

    public ResultService(ReviewResultRepository repository,
                         DocumentStorageService documentStorageService,
                         SqsTemplate sqsTemplate,
                         ObjectMapper objectMapper,
                         @Value("${aws.sqs.notification.queue-name}") String notificationQueueName,
                         WorkflowReviewsApi workflowReviewsApi,
                         MatchesApi matchesApi,
                         DefaultApi configurationApi) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.notificationQueueName = notificationQueueName;
        this.workflowReviewsApi = workflowReviewsApi;
        this.matchesApi = matchesApi;
        this.configurationApi = configurationApi;
    }

    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        enrichFromNeighbouringServices(result);
        ReviewResult saved = repository.save(result);
        sendResultAvailableNotification(saved);
        return saved;
    }

    /**
     * Enriches the result with data owned by neighbouring services, fetched over
     * REST: the grading schema (workflow), the examiner (matching), and the
     * review deadline / end date (configuration). Each call is best-effort — a
     * failure is logged and the result is stored without that field rather than
     * losing the whole result.
     */
    private void enrichFromNeighbouringServices(ReviewResult result) {
        String submissionId = result.getSubmissionId();

        // Grading schema (what the submission was reviewed by) — workflow service.
        try {
            List<ReviewQuestionDto> form = workflowReviewsApi.getFeedbackFormForSubmission(submissionId);
            if (form != null) {
                result.setGradingSchema(form.stream().map(this::toGradingCriterion).toList());
            }
        } catch (Exception e) {
            log.warn("Could not fetch grading schema for submission {}: {}", submissionId, e.getMessage());
        }

        // Examiners — matching service (a submission may have several examiners).
        try {
            SubmissionMatchResponse matches = matchesApi.getMatchesBySubmission(submissionId);
            if (matches != null && matches.getMatches() != null && !matches.getMatches().isEmpty()) {
                result.setExaminerUsernames(matches.getMatches().stream()
                        .map(m -> m.getExaminerUsername() != null ? m.getExaminerUsername() : m.getExaminerId())
                        .filter(Objects::nonNull)
                        .toList());
            }
        } catch (Exception e) {
            log.warn("Could not fetch examiners for submission {}: {}", submissionId, e.getMessage());
        }

        // Review deadline / end date — configuration service.
        try {
            ModelConfiguration config = configurationApi.submissionIdGet(submissionId);
            if (config != null && config.getReviewDeadline() != null) {
                result.setReviewDeadline(config.getReviewDeadline().toInstant());
            }
        } catch (Exception e) {
            log.warn("Could not fetch review deadline for submission {}: {}", submissionId, e.getMessage());
        }
    }

    private GradingCriterion toGradingCriterion(ReviewQuestionDto q) {
        return GradingCriterion.builder()
                .id(q.getId())
                .text(q.getText())
                .type(q.getType() != null ? q.getType().getValue() : null)
                .maxPoints(q.getMaxPoints())
                .required(q.getRequired())
                .options(q.getOptions())
                .build();
    }

    private void sendResultAvailableNotification(ReviewResult result) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping result-available notification for {}",
                    result.getSubmissionId());
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "REVIEW_RESULT_AVAILABLE",
                List.of("IN_APP"),
                result.getAuthorId(),
                "Review Result Available",
                "A review result is available for submission " + result.getSubmissionId() + ".",
                Map.of("submissionId", result.getSubmissionId()));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent result-available notification to '{}' for submission {}",
                    result.getAuthorId(), result.getSubmissionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize result-available notification for {}", result.getSubmissionId(), e);
        }
    }

    public List<ReviewResultDto> findByAuthor(String authorId) {
        return repository.findByAuthorId(authorId).stream()
                .map(ReviewResultDto::from)
                .toList();
    }

    public ReviewResultDto findBySubmission(String submissionId) {
        return repository.findBySubmissionId(submissionId)
                .map(ReviewResultDto::from)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));
    }

    public String getDocumentDownloadUrl(String submissionId) {
        var result = repository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result found for submission: " + submissionId));

        if (result.getDocumentS3Key() == null || result.getDocumentS3Key().isBlank()) {
            throw new IllegalArgumentException("No document attached to submission: " + submissionId);
        }

        return documentStorageService.generatePresignedDownloadUrl(result.getDocumentS3Key());
    }
}
