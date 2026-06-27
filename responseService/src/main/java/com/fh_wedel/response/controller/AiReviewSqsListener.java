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
import com.fh_wedel.response.service.BedrockProxyClientService;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Slf4j
@ConditionalOnProperty(name = "cloud.aws.sqs.enabled", havingValue = "true", matchIfMissing = true)
public class AiReviewSqsListener {

    private final ReviewResultRepository repository;
    private final BedrockProxyClientService bedrockProxyClientService;
    private final SubmissionReviewsApi submissionReviewsApi;
    private final ResultService resultService;
    private final ObjectMapper objectMapper;
    private final String submissionServiceUrl;

    public AiReviewSqsListener(ReviewResultRepository repository,
                               BedrockProxyClientService bedrockProxyClientService,
                               SubmissionReviewsApi submissionReviewsApi,
                               ResultService resultService,
                               ObjectMapper objectMapper,
                               @Value("${aws.submission-service.url}") String submissionServiceUrl) {
        this.repository = repository;
        this.bedrockProxyClientService = bedrockProxyClientService;
        this.submissionReviewsApi = submissionReviewsApi;
        this.resultService = resultService;
        this.objectMapper = objectMapper;
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
            log.error("ReviewResult {} not found for AI review processing", reviewId);
            return;
        }

        try {
            result.setAiStatus("PROCESSING");
            repository.save(result);
            log.info("Starting AI review processing for submission {}", submissionId);

            List<ReviewQuestionDto> form = submissionReviewsApi.getFeedbackFormForSubmission(submissionId);
            if (form == null || form.isEmpty()) {
                throw new IllegalStateException("No grading schema found for submission.");
            }
            String schemaJson = objectMapper.writeValueAsString(form);
            String documentS3Key = resolveDocumentS3Key(task, submissionId);

            String generatedReviewJson = bedrockProxyClientService.generateReview(
                    submissionId,
                    reviewId.toString(),
                    schemaJson,
                    documentS3Key
            );

            Map<String, Object> parsedReview = objectMapper.readValue(generatedReviewJson, new TypeReference<Map<String, Object>>() {
            });
            List<ReviewAnswer> mappedAnswers = mapAndValidateAnswers(parsedReview, form);
            String reviewComments = requireString(parsedReview, "reviewComments");
            String finalGrade = parsedReview.get("finalGrade") instanceof String grade ? grade : null;

            result.setFinalGrade(finalGrade);
            result.setReviewComments(reviewComments);
            result.setAnswers(mappedAnswers);
            result.setGradingSchema(applyGradingSchema(form, mappedAnswers));
            result.setAiStatus("COMPLETED");
            result.setCompletedAt(Instant.now());

            resultService.save(result);
            log.info("Successfully completed AI review for submission {}", submissionId);
        } catch (Exception e) {
            log.error("AI review failed for submission {}", submissionId, e);
            result.setAiStatus("FAILED");
            repository.save(result);
        }
    }

    private String resolveDocumentS3Key(AiReviewTask task, String submissionId) throws Exception {
        if (task.getDocumentS3Key() != null && !task.getDocumentS3Key().isBlank()) {
            return task.getDocumentS3Key();
        }

        log.info("No S3 key in task, fetching document metadata from submission service for {}", submissionId);
        RestTemplate authRestTemplate = new RestTemplate();
        authRestTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().set("x-auth-username", "system-response-service");
            request.getHeaders().set("x-auth-groups", "Admin");
            return execution.execute(request, body);
        });

        String documentListUrl = submissionServiceUrl + "/api/submission/submissions/" + submissionId + "/documents";
        String docJson = authRestTemplate.getForObject(documentListUrl, String.class);
        List<Map<String, Object>> documents = objectMapper.readValue(docJson, new TypeReference<List<Map<String, Object>>>() {
        });
        if (documents == null || documents.isEmpty()) {
            throw new IllegalStateException("No documents found for submission.");
        }

        Object keyValue = documents.get(0).get("s3Key");
        if (!(keyValue instanceof String key) || key.isBlank()) {
            throw new IllegalStateException("Document metadata does not contain a valid s3Key.");
        }
        return key;
    }

    private List<ReviewAnswer> mapAndValidateAnswers(Map<String, Object> parsedReview, List<ReviewQuestionDto> form) {
        Object rawAnswers = parsedReview.get("answers");
        List<?> answersList;
        if (rawAnswers instanceof List<?> list) {
            answersList = list;
        } else if (rawAnswers instanceof Map<?, ?> answerMap) {
            answersList = answerMap.entrySet().stream()
                    .map(entry -> Map.of(
                            "questionId", String.valueOf(entry.getKey()),
                            "answer", entry.getValue() != null ? String.valueOf(entry.getValue()) : ""
                    ))
                    .toList();
        } else {
            throw new IllegalStateException("AI response does not contain a supported answers structure.");
        }
        if (answersList.isEmpty()) {
            throw new IllegalStateException("AI response does not contain a non-empty answers array.");
        }

        Set<String> validQuestionIds = form.stream()
                .map(ReviewQuestionDto::getId)
                .collect(Collectors.toSet());
        Set<String> requiredQuestionIds = form.stream()
                .filter(q -> Boolean.TRUE.equals(q.getRequired()))
                .map(ReviewQuestionDto::getId)
                .collect(Collectors.toSet());

        List<ReviewAnswer> mappedAnswers = answersList.stream().map(entry -> {
            if (!(entry instanceof Map<?, ?> answerMap)) {
                throw new IllegalStateException("AI response contains malformed answer entries.");
            }

            Object questionIdRaw = answerMap.get("questionId");
            if (!(questionIdRaw instanceof String) || ((String) questionIdRaw).isBlank()) {
                questionIdRaw = answerMap.get("question_id");
            }
            if (!(questionIdRaw instanceof String) || ((String) questionIdRaw).isBlank()) {
                questionIdRaw = answerMap.get("id");
            }

            Object answerRaw = answerMap.get("answer");
            if (answerRaw == null) {
                answerRaw = answerMap.get("value");
            }
            if (answerRaw == null) {
                answerRaw = answerMap.get("grade");
            }
            if (answerRaw == null) {
                answerRaw = answerMap.get("score");
            }
            if (answerRaw == null) {
                answerRaw = answerMap.get("comment");
            }

            if (!(questionIdRaw instanceof String questionId) || questionId.isBlank()) {
                throw new IllegalStateException("AI response contains an answer without questionId.");
            }
            if (!validQuestionIds.contains(questionId)) {
                throw new IllegalStateException("AI response contains unknown questionId: " + questionId);
            }
            String answerText = answerRaw instanceof String s ? s : (answerRaw != null ? String.valueOf(answerRaw) : null);
            if (answerText == null || answerText.isBlank()) {
                throw new IllegalStateException("AI response contains an empty answer for questionId: " + questionId);
            }

            return ReviewAnswer.builder()
                    .questionId(questionId)
                    .answer(answerText)
                    .build();
        }).toList();

        Set<String> answeredIds = mappedAnswers.stream()
                .map(ReviewAnswer::getQuestionId)
                .collect(Collectors.toSet());
        if (!answeredIds.containsAll(requiredQuestionIds)) {
            throw new IllegalStateException("AI response is missing required answers.");
        }

        return mappedAnswers;
    }

    private List<GradingCriterion> applyGradingSchema(List<ReviewQuestionDto> form, List<ReviewAnswer> answers) {
        return form.stream().map(q -> {
            GradingCriterion criterion = GradingCriterion.builder()
                    .id(q.getId())
                    .text(q.getText())
                    .type(q.getType() != null ? q.getType().getValue() : null)
                    .maxPoints(q.getMaxPoints())
                    .required(q.getRequired())
                    .options(q.getOptions())
                    .build();
            answers.stream()
                    .filter(a -> a.getQuestionId().equals(q.getId()))
                    .findFirst()
                    .ifPresent(a -> criterion.setAnswer(a.getAnswer()));
            return criterion;
        }).toList();
    }

    private String requireString(Map<String, Object> parsedReview, String fieldName) {
        Object value = parsedReview.get(fieldName);
        if (!(value instanceof String stringValue) || stringValue.isBlank()) {
            throw new IllegalStateException("AI response field '" + fieldName + "' is missing or empty.");
        }
        return stringValue;
    }
}
