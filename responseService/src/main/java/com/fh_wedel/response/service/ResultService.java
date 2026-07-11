package com.fh_wedel.response.service;

import org.springframework.http.HttpStatus;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionsApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.ExaminerMatchResponse;
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

    private void enrichFromNeighbouringServices(ReviewResult result) {
        String submissionId = result.getSubmissionId();
        enrichGradingSchema(result, submissionId);
        enrichExaminers(result, submissionId);
        enrichReviewDeadline(result, submissionId);
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
        String authorId = fetchAuthorIdFromConfig(request.getSubmissionId());
        if (authorId != null) {
            result.setAuthorId(authorId);
        }

        ReviewResult saved = save(result);
        // Also publish ReviewCompletedEvent
        sendReviewCompletedEvent(saved);
        sendReviewSubmittedNotification(authorId, request.getSubmissionId());
        return saved;
    }

    private void sendReviewCompletedEvent(ReviewResult result) {
        log.info("Review completed for submission {}", result.getSubmissionId());
    }

    private void sendReviewSubmittedNotification(String authorId, String submissionId) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            return;
        }
        com.fh_wedel.response.model.NotificationEvent event = new com.fh_wedel.response.model.NotificationEvent(
                "REVIEW_SUBMITTED",
                List.of("IN_APP"),
                authorId,
                "Review Submitted",
                "An examiner has submitted their review for your submission.",
                java.util.Map.of("submissionId", submissionId)
        );
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.error("Failed to serialize REVIEW_SUBMITTED notification", e);
        }
    }

    private List<GradingCriterion> fetchGradingFormAndBuildCriteria(String submissionId, com.fh_wedel.response.model.SubmitReviewRequest request) {
        try {
            // Simplified logic: Using existing API instead of configurationServiceClient placeholder
            List<ReviewQuestionDto> form = submissionReviewsApi.getFeedbackFormForSubmission(submissionId);
            if (form != null) {
                return form.stream()
                        .map(q -> {
                            GradingCriterion c = toGradingCriterion(q);
                            return c;
                        })
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch grading form template for submission {}", submissionId, e);
        }
        return List.of();
    }

    private String fetchAuthorIdFromConfig(String submissionId) {
        try {
            ModelConfiguration config = submissionsApi.submissionsSubmissionIdGet(submissionId);
            if (config != null && config.getAuthorIds() != null && !config.getAuthorIds().isEmpty()) {
                return config.getAuthorIds().get(0);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch author ID for submission {}", submissionId, e);
        }
        return null;
    }

    private void enrichGradingSchema(ReviewResult result, String submissionId) {
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
    }

    private void enrichExaminers(ReviewResult result, String submissionId) {
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
    }

    private void enrichReviewDeadline(ReviewResult result, String submissionId) {
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

    public boolean isAssignedReviewer(String submissionId, String callerSub, String callerUsername) {
        if (callerSub == null) return false;
        boolean assignedBySubmissionLookup = false;
        try {
            SubmissionMatchResponse matches = matchesApi.getMatchesBySubmission(submissionId);
            assignedBySubmissionLookup = matches != null && matches.getMatches() != null &&
                    matches.getMatches().stream().anyMatch(m -> callerSub.equals(m.getExaminerId()));
            if (assignedBySubmissionLookup) {
                return true;
            }
        } catch (Exception e) {
            log.warn("Could not check examiners for submission {}: {}", submissionId, e.getMessage());
        }

        if (callerUsername == null || callerUsername.isBlank()) {
            return false;
        }

        try {
            ExaminerMatchResponse examinerMatches = matchesApi.getMatchesByExaminer(callerUsername);
            return examinerMatches != null && examinerMatches.getAssignments() != null &&
                    examinerMatches.getAssignments().stream().anyMatch(a -> submissionId.equals(a.getSubmissionId()));
        } catch (Exception e) {
            // Fallback may fail for non-reviewer callers (e.g., Authors). Keep this at debug level.
            log.debug("Could not fallback-check examiner assignments for username {} and submission {}: {}",
                    callerUsername, submissionId, e.getMessage());
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
