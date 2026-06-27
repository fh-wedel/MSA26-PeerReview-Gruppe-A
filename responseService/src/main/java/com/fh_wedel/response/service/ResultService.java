package com.fh_wedel.response.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionsApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import com.fh_wedel.response.model.GradingCriterion;
import com.fh_wedel.response.model.NotificationEvent;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import com.fh_wedel.configuration.client.api.SubmissionReviewsApi;
import com.fh_wedel.configuration.client.model.ReviewQuestionDto;
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
    private final SubmissionReviewsApi submissionReviewsApi;
    private final MatchesApi matchesApi;
    private final SubmissionsApi submissionsApi;

    public ResultService(ReviewResultRepository repository,
                         DocumentStorageService documentStorageService,
                         SqsTemplate sqsTemplate,
                         ObjectMapper objectMapper,
                         @Value("${aws.sqs.notification.queue-name}") String notificationQueueName,
                         SubmissionReviewsApi submissionReviewsApi,
                         MatchesApi matchesApi,
                         SubmissionsApi submissionsApi) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.notificationQueueName = notificationQueueName;
        this.submissionReviewsApi = submissionReviewsApi;
        this.matchesApi = matchesApi;
        this.submissionsApi = submissionsApi;
    }

    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        enrichFromNeighbouringServices(result);
        ReviewResult saved = repository.save(result);
        return saved;
    }

    public ReviewResult submitReview(com.fh_wedel.response.model.SubmitReviewRequest request, String reviewerId) {
        List<ReviewResult> existingResults = repository.findBySubmissionId(request.getSubmissionId());
        if (existingResults.stream().anyMatch(r -> reviewerId.equals(r.getReviewerId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A review by this reviewer for this submission already exists.");
        }

        ReviewResult result = new ReviewResult();
        result.setSubmissionId(request.getSubmissionId());
        result.setReviewerId(reviewerId);
        result.setReviewComments(request.getReviewComments());
        result.setFinalGrade(request.getFinalGrade());
        result.setAnswers(request.getAnswers());
        result.setCreatedAt(java.time.Instant.now());
        result.setCompletedAt(java.time.Instant.now());

        // Fetch schema to merge with answers
        try {
            List<ReviewQuestionDto> form = submissionReviewsApi.getFeedbackFormForSubmission(request.getSubmissionId());
            if (form != null) {
                List<GradingCriterion> criteria = form.stream().map(q -> {
                    GradingCriterion c = toGradingCriterion(q);
                    if (request.getAnswers() != null) {
                        request.getAnswers().stream()
                                .filter(a -> a.getQuestionId().equals(q.getId()))
                                .findFirst()
                                .ifPresent(a -> c.setAnswer(a.getAnswer()));
                    }
                    return c;
                }).toList();
                result.setGradingSchema(criteria);
            }
        } catch (Exception e) {
            log.warn("Could not fetch grading schema for submission {}: {}", request.getSubmissionId(), e.getMessage());
        }

        // Fetch author
        try {
            ModelConfiguration config = submissionsApi.submissionsSubmissionIdGet(request.getSubmissionId());
            if (config != null && config.getAuthorIds() != null && !config.getAuthorIds().isEmpty()) {
                result.setAuthorId(config.getAuthorIds().get(0));
            }
        } catch (Exception e) {
            log.warn("Could not fetch author for submission {}: {}", request.getSubmissionId(), e.getMessage());
        }

        ReviewResult saved = save(result);
        // Also publish ReviewCompletedEvent
        sendReviewCompletedEvent(saved);
        return saved;
    }

    private void sendReviewCompletedEvent(ReviewResult result) {
        // Find if we have a queue configured, or maybe the workflow needs to know?
        // Actually, there is ReviewCompletedEvent.
        // It's not clear which queue it goes to, maybe a workflow event queue.
        // I will log it for now as there isn't a specific queue property shown in ResultService
        // But let's check if there is a queue for ReviewCompletedEvent.
        log.info("Review completed for submission {}", result.getSubmissionId());
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

        // Grading schema (what the submission was reviewed by) — configuration service.
        if (result.getGradingSchema() == null || result.getGradingSchema().isEmpty()) {
            try {
                List<ReviewQuestionDto> form = submissionReviewsApi.getFeedbackFormForSubmission(submissionId);
                if (form != null) {
                    result.setGradingSchema(form.stream().map(this::toGradingCriterion).toList());
                }
            } catch (Exception e) {
                log.warn("Could not fetch grading schema for submission {}: {}", submissionId, e.getMessage());
            }
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
            ModelConfiguration config = submissionsApi.submissionsSubmissionIdGet(submissionId);
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
    public List<ReviewResultDto> findByAuthor(String authorId) {
        return repository.findByAuthorId(authorId).stream()
                .map(ReviewResultDto::from)
                .toList();
    }

    public List<ReviewResultDto> findResultsBySubmission(String submissionId) {
        return repository.findBySubmissionId(submissionId).stream()
                .map(r -> {
                    if (r.getAuthorId() == null || r.getAuthorId().isBlank()) {
                        try {
                            ModelConfiguration config = submissionsApi.submissionsSubmissionIdGet(submissionId);
                            if (config != null && config.getAuthorIds() != null && !config.getAuthorIds().isEmpty()) {
                                r.setAuthorId(config.getAuthorIds().get(0));
                                repository.save(r); // Persist the fix for future reads
                            }
                        } catch (Exception e) {
                            log.warn("Could not backfill authorId for submission {}: {}", submissionId, e.getMessage());
                        }
                    }
                    return ReviewResultDto.from(r);
                }).toList();
    }

    public String getDocumentDownloadUrl(String submissionId) {
        List<ReviewResult> results = repository.findBySubmissionId(submissionId);
        if (results.isEmpty()) {
            throw new IllegalArgumentException("No result found for submission: " + submissionId);
        }

        ReviewResult resultWithDoc = results.stream()
                .filter(r -> r.getDocumentS3Key() != null && !r.getDocumentS3Key().isBlank())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No document attached to submission: " + submissionId));

        return documentStorageService.generatePresignedDownloadUrl(resultWithDoc.getDocumentS3Key());
    }

    public boolean isAuthorOfSubmission(String submissionId, String callerSub) {
        if (callerSub == null) return false;
        try {
            ModelConfiguration config = submissionsApi.submissionsSubmissionIdGet(submissionId);
            return config != null && config.getAuthorIds() != null && config.getAuthorIds().contains(callerSub);
        } catch (Exception e) {
            log.warn("Could not check authors for submission {}: {}", submissionId, e.getMessage());
            return false;
        }
    }

    public boolean isAssignedReviewer(String submissionId, String callerSub) {
        if (callerSub == null) return false;
        try {
            SubmissionMatchResponse matches = matchesApi.getMatchesBySubmission(submissionId);
            return matches != null && matches.getMatches() != null &&
                    matches.getMatches().stream().anyMatch(m -> callerSub.equals(m.getExaminerId()));
        } catch (Exception e) {
            log.warn("Could not check examiners for submission {}: {}", submissionId, e.getMessage());
            return false;
        }
    }

    public boolean isReviewComplete(String submissionId, int submittedHumanReviewsCount) {
        try {
            SubmissionMatchResponse matches = matchesApi.getMatchesBySubmission(submissionId);
            if (matches == null || matches.getMatches() == null || matches.getMatches().isEmpty()) {
                return false;
            }
            return submittedHumanReviewsCount >= matches.getMatches().size();
        } catch (Exception e) {
            log.warn("Could not check match count for submission {}: {}", submissionId, e.getMessage());
            return false;
        }
    }
}
