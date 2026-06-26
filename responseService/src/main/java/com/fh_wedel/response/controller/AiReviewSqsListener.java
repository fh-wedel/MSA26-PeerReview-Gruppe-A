package com.fh_wedel.response.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionReviewsApi;
import com.fh_wedel.configuration.client.model.ReviewQuestionDto;
import com.fh_wedel.response.model.AiReviewTask;
import com.fh_wedel.response.model.GradingCriterion;
import com.fh_wedel.response.model.ReviewAnswer;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.repository.ReviewResultRepository;
import com.fh_wedel.response.service.BedrockAiService;
import com.fh_wedel.response.service.ResultService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
@ConditionalOnProperty(name = "cloud.aws.sqs.enabled", havingValue = "true", matchIfMissing = true)
public class AiReviewSqsListener {

    private final ReviewResultRepository repository;
    private final BedrockAiService bedrockAiService;
    private final SubmissionReviewsApi submissionReviewsApi;
    private final ResultService resultService;
    private final ObjectMapper objectMapper;
    private final com.fh_wedel.response.service.DocumentStorageService documentStorageService;
    private final String submissionServiceUrl;

    public AiReviewSqsListener(ReviewResultRepository repository,
                               BedrockAiService bedrockAiService,
                               SubmissionReviewsApi submissionReviewsApi,
                               ResultService resultService,
                               ObjectMapper objectMapper,
                               com.fh_wedel.response.service.DocumentStorageService documentStorageService,
                               @Value("${aws.submission-service.url}") String submissionServiceUrl) {
        this.repository = repository;
        this.bedrockAiService = bedrockAiService;
        this.submissionReviewsApi = submissionReviewsApi;
        this.resultService = resultService;
        this.objectMapper = objectMapper;
        this.documentStorageService = documentStorageService;
        this.submissionServiceUrl = submissionServiceUrl;
    }

    @SqsListener("${aws.sqs.ai-review.queue-name}")
    public void receiveAiReviewTask(String message) {
        AiReviewTask task;
        try {
            task = objectMapper.readValue(message, AiReviewTask.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AiReviewTask message: {}", message, e);
            return;
        }

        String submissionId = task.getSubmissionId();
        UUID reviewId = UUID.fromString(task.getReviewResultId());

        List<ReviewResult> results = repository.findBySubmissionId(submissionId);
        ReviewResult result = results.stream().filter(r -> r.getId().equals(reviewId)).findFirst().orElse(null);
        
        if (result == null) {
            log.error("ReviewResult {} not found for AI Review processing", reviewId);
            return;
        }

        try {
            // Mark as PROCESSING
            result.setAiStatus("PROCESSING");
            repository.save(result);

            log.info("Starting AI Review processing for submission {}", submissionId);

            // 1. Fetch Grading Schema
            List<ReviewQuestionDto> form = submissionReviewsApi.getFeedbackFormForSubmission(submissionId);
            if (form == null || form.isEmpty()) {
                throw new IllegalStateException("No grading schema found for submission");
            }
            String schemaJson = objectMapper.writeValueAsString(form);

            // 2. Fetch PDF bytes
            // Prefer direct S3 access using the key embedded in the task (no auth needed).
            // Fall back to calling the submission service REST API with system-admin headers
            // for manually-triggered reviews where no S3 key was supplied.
            byte[] pdfBytes;
            if (task.getDocumentS3Key() != null && !task.getDocumentS3Key().isBlank()) {
                log.info("Fetching document bytes from S3 directly using key: {}", task.getDocumentS3Key());
                pdfBytes = documentStorageService.getDocumentBytes(task.getDocumentS3Key());
            } else {
                log.info("No S3 key in task — falling back to submission service REST API for submission {}", submissionId);
                // Build a RestTemplate with system-admin headers so the submission service ABAC passes
                org.springframework.web.client.RestTemplate authRestTemplate = new RestTemplate();
                authRestTemplate.getInterceptors().add((request, body, execution) -> {
                    request.getHeaders().set("x-auth-username", "system-response-service");
                    request.getHeaders().set("x-auth-groups", "Admin");
                    return execution.execute(request, body);
                });
                String docUrl = submissionServiceUrl + "/api/submission/submissions/" + submissionId + "/documents";
                String docJson = authRestTemplate.getForObject(docUrl, String.class);
                List<Map<String, Object>> documents = objectMapper.readValue(docJson, new TypeReference<List<Map<String, Object>>>() {});
                if (documents == null || documents.isEmpty()) {
                    throw new IllegalStateException("No documents found for submission");
                }
                String docId = (String) documents.get(0).get("documentId");
                String dlUrl = submissionServiceUrl + "/api/submission/submissions/" + submissionId + "/documents/" + docId + "/download";
                Map<String, String> dlMap = authRestTemplate.getForObject(dlUrl, Map.class);
                String downloadUrl = dlMap != null ? dlMap.get("uploadUrl") : null;
                if (downloadUrl == null) throw new IllegalStateException("Could not get presigned download URL");
                pdfBytes = new RestTemplate().getForObject(downloadUrl, byte[].class);
            }
            if (pdfBytes == null || pdfBytes.length == 0) {
                throw new IllegalStateException("Failed to obtain document bytes for submission " + submissionId);
            }

            // 4. Call Bedrock
            String generatedReviewJson = bedrockAiService.generateReview(schemaJson, pdfBytes);

            // 5. Parse output
            Map<String, Object> parsedReview = objectMapper.readValue(generatedReviewJson, new TypeReference<Map<String, Object>>() {});

            // Construct Answers
            List<Map<String, Object>> generatedAnswers = (List<Map<String, Object>>) parsedReview.get("answers");
            List<ReviewAnswer> mappedAnswers = null;
            if (generatedAnswers != null) {
                mappedAnswers = generatedAnswers.stream().map(ga -> {
                    ReviewAnswer ans = new ReviewAnswer();
                    ans.setQuestionId((String) ga.get("questionId"));
                    ans.setAnswer((String) ga.get("answer"));
                    return ans;
                }).toList();
            }

            result.setFinalGrade((String) parsedReview.get("finalGrade"));
            result.setReviewComments((String) parsedReview.get("reviewComments"));
            result.setAnswers(mappedAnswers);

            // Apply grading schema
            final List<ReviewAnswer> finalMappedAnswers = mappedAnswers;
            List<GradingCriterion> criteria = form.stream().map(q -> {
                GradingCriterion c = GradingCriterion.builder()
                        .id(q.getId())
                        .text(q.getText())
                        .type(q.getType() != null ? q.getType().getValue() : null)
                        .maxPoints(q.getMaxPoints())
                        .required(q.getRequired())
                        .options(q.getOptions())
                        .build();
                if (finalMappedAnswers != null) {
                    finalMappedAnswers.stream()
                            .filter(a -> a.getQuestionId().equals(q.getId()))
                            .findFirst()
                            .ifPresent(a -> c.setAnswer(a.getAnswer()));
                }
                return c;
            }).toList();
            result.setGradingSchema(criteria);

            // Mark as COMPLETED
            result.setAiStatus("COMPLETED");
            result.setCompletedAt(Instant.now());

            // Save and notify
            resultService.save(result);
            log.info("Successfully completed AI Review for submission {}", submissionId);

        } catch (Exception e) {
            log.error("AI Review failed for submission {}", submissionId, e);
            result.setAiStatus("FAILED");
            repository.save(result);
        }
    }
}
