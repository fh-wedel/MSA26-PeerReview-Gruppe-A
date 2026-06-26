package com.fh_wedel.response.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.AiReviewTask;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.repository.ReviewResultRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
public class AiReviewOrchestrator {

    private final ReviewResultRepository repository;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String aiReviewQueueName;

    public AiReviewOrchestrator(ReviewResultRepository repository,
                                SqsTemplate sqsTemplate,
                                ObjectMapper objectMapper,
                                @Value("${aws.sqs.ai-review.queue-name:}") String aiReviewQueueName) {
        this.repository = repository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.aiReviewQueueName = aiReviewQueueName;
    }

    /**
     * Requests an AI Review for a given submission.
     * Throws an exception if an AI review already exists (even if processing).
     */
    public ReviewResult requestReview(String submissionId, String documentS3Key) {
        if (aiReviewQueueName == null || aiReviewQueueName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI Review queue is not configured.");
        }

        List<ReviewResult> existingResults = repository.findBySubmissionId(submissionId);
        boolean aiReviewExists = existingResults.stream().anyMatch(ReviewResult::isAiGenerated);

        if (aiReviewExists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An AI review has already been requested or completed for this submission.");
        }

        log.info("Requesting AI Review for submission: {}", submissionId);

        ReviewResult result = new ReviewResult();
        result.setSubmissionId(submissionId);
        result.setReviewerId("AI-Reviewer");
        result.setAiGenerated(true);
        result.setAiStatus("REQUESTED");
        result.setCreatedAt(Instant.now());
        // Do not set completedAt yet

        ReviewResult saved = repository.save(result);

        AiReviewTask task = new AiReviewTask(submissionId, saved.getId().toString(), documentS3Key);
        try {
            sqsTemplate.send(aiReviewQueueName, objectMapper.writeValueAsString(task));
            log.info("Sent AiReviewTask to queue {} for submission {}", aiReviewQueueName, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AiReviewTask for submission {}", submissionId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to initiate AI review processing.");
        }

        return saved;
    }
}
