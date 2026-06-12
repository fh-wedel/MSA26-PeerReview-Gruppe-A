package com.fh_wedel.response.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.NotificationEvent;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ResultService {

    private final ReviewResultRepository repository;
    private final DocumentStorageService documentStorageService;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String notificationQueueName;

    public ResultService(ReviewResultRepository repository,
                         DocumentStorageService documentStorageService,
                         SqsTemplate sqsTemplate,
                         ObjectMapper objectMapper,
                         @Value("${aws.sqs.notification.queue-name}") String notificationQueueName) {
        this.repository = repository;
        this.documentStorageService = documentStorageService;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.notificationQueueName = notificationQueueName;
    }

    public ReviewResult save(ReviewResult result) {
        log.info("Saving review result for submission: {}", result.getSubmissionId());
        ReviewResult saved = repository.save(result);
        sendResultAvailableNotification(saved);
        return saved;
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
