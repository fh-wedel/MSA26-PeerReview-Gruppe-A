package com.fh_wedel.submission.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.repository.SubmissionRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class SubmissionService {

    private final SubmissionRepository repository;
    private final S3Service s3Service;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final ConfigurationServiceClient configurationServiceClient;
    private final String notificationQueueName;

    public SubmissionService(SubmissionRepository repository,
                             S3Service s3Service,
                             SqsTemplate sqsTemplate,
                             ObjectMapper objectMapper,
                             ConfigurationServiceClient configurationServiceClient,
                             @Value("${aws.sqs.notification.queue-name:}") String notificationQueueName) {
        this.repository = repository;
        this.s3Service = s3Service;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.configurationServiceClient = configurationServiceClient;
        this.notificationQueueName = notificationQueueName;
    }

    public Submission createSubmission(String configurationId, List<String> authorIds) {
        String submissionId = configurationId;
        log.info("Creating/upserting submission: id={}, configId={}, authorIds={}", submissionId, configurationId, authorIds);

        // Upsert: if the submission was already created (e.g. by the SQS matching listener
        // arriving before this eager UI call), preserve its current status. Otherwise create a fresh DRAFT record.
        Submission existing = repository.findSubmissionById(submissionId);
        if (existing != null) {
            log.info("Submission {} already exists with status '{}'.", submissionId, existing.getStatus());
            existing.setUpdatedAt(Instant.now());
            // Merge authorIds if the existing record has none (created by SQS without authorIds)
            if ((existing.getAuthorIds() == null || existing.getAuthorIds().isEmpty()) && !authorIds.isEmpty()) {
                existing.setAuthorIds(authorIds);
            }
            repository.saveSubmission(existing);
            return existing;
        }

        Submission submission = new Submission(submissionId, configurationId, authorIds);
        repository.saveSubmission(submission);
        return submission;
    }

    public Submission getSubmission(String submissionId) {
        return repository.findSubmissionById(submissionId);
    }

    public List<Submission> getSubmissionsByAuthor(String authorId) {
        return repository.findSubmissionsByAuthor(authorId);
    }

    public PresignedUrlResponse generatePresignedUploadUrl(String submissionId, String authorId,
                                                           String fileName, String contentType) {
        Submission submission = repository.findSubmissionById(submissionId);
        if (submission == null) {
            throw new IllegalStateException("Submission not found");
        }

        validateOwnership(submission, authorId);
        validateEditableStatus(submission, "upload documents for");
        validatePdfUpload(contentType, fileName);

        String documentId = UUID.randomUUID().toString();
        String s3Key = String.format("submissions/%s/%s/%s", submissionId, documentId, fileName);

        String uploadUrl = s3Service.generatePresignedPutUrl(s3Key, contentType);

        DocumentRecord document = new DocumentRecord(submissionId, documentId, fileName, s3Key, contentType);
        repository.saveDocument(document);

        log.info("Generated presigned URL for submission={}, document={}", submissionId, documentId);
        return new PresignedUrlResponse(uploadUrl, documentId, s3Key);
    }

    public Submission submitSubmission(String submissionId, String authorId) {
        Submission submission = repository.findSubmissionById(submissionId);
        if (submission == null) {
            return null;
        }

        validateOwnership(submission, authorId);
        validateEditableStatus(submission, "submit");

        SubmissionConfiguration config = configurationServiceClient.getConfiguration(submission.getConfigurationId());
        if (config == null) {
            throw new IllegalStateException("Submission configuration not found");
        }

        if (config.getSubmissionDeadline() != null && Instant.now().isAfter(config.getSubmissionDeadline())) {
            throw new IllegalStateException("Submission deadline has passed");
        }

        List<DocumentRecord> documents = repository.findDocuments(submissionId);
        if (documents.isEmpty()) {
            throw new IllegalStateException("Cannot submit without at least one document");
        }

        submission.setStatus(SubmissionStatus.SUBMITTED.getDbValue());
        submission.setSubmittedAt(Instant.now());
        submission.setUpdatedAt(Instant.now());
        repository.saveSubmission(submission);

        sendSubmissionNotification(submission);
        log.info("Submission {} submitted by author {}", submissionId, authorId);
        return submission;
    }

    public List<DocumentRecord> getDocuments(String submissionId) {
        return repository.findDocuments(submissionId);
    }

    public String getPresignedDownloadUrl(String submissionId, String documentId) {
        DocumentRecord document = repository.findDocument(submissionId, documentId);
        if (document == null) {
            throw new IllegalStateException("Document not found");
        }
        return s3Service.generatePresignedGetUrl(document.getS3Key());
    }

    private void sendSubmissionNotification(Submission submission) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping submitted notification for {}", submission.getSubmissionId());
            return;
        }
        List<String> authorIds = submission.getAuthorIds();
        if (authorIds == null || authorIds.isEmpty()) return;
        for (String authorId : authorIds) {
            sendNotificationForAuthor(authorId, submission.getSubmissionId());
        }
    }

    public void sendReviewCompletedNotification(Submission submission) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping result-available notification for {}", submission.getSubmissionId());
            return;
        }
        List<String> authorIds = submission.getAuthorIds();
        if (authorIds == null || authorIds.isEmpty()) return;
        for (String authorId : authorIds) {
            sendResultNotificationForAuthor(authorId, submission.getSubmissionId());
        }
    }

    private void validateOwnership(Submission submission, String authorId) {
        if (submission.getAuthorIds() == null || !submission.getAuthorIds().contains(authorId)) {
            throw new IllegalStateException("Not the owner of this submission");
        }
    }

    private void validateEditableStatus(Submission submission, String operationName) {
        boolean isDraft = SubmissionStatus.DRAFT.getDbValue().equals(submission.getStatus());
        boolean isWaiting = SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue().equals(submission.getStatus());
        if (!isDraft && !isWaiting) {
            throw new IllegalStateException("Can only " + operationName + " submissions in DRAFT or WAITING_FOR_SUBMISSION status");
        }
    }

    private void validatePdfUpload(String contentType, String fileName) {
        if (contentType == null || !"application/pdf".equalsIgnoreCase(contentType)) {
            throw new IllegalArgumentException("Only PDF uploads are allowed. Unsupported content type: " + contentType);
        }
        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF uploads are allowed. File name must end with .pdf");
        }
    }

    private void sendNotificationForAuthor(String authorId, String submissionId) {
        NotificationEvent event = new NotificationEvent(
                "SUBMISSION_SUBMITTED",
                List.of("IN_APP"),
                authorId,
                "Submission Submitted",
                "Your submission was successfully submitted and is now under review.",
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent submitted notification to '{}' for submission {}", authorId, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize submitted notification for {}", submissionId, e);
        }
    }

    private void sendResultNotificationForAuthor(String authorId, String submissionId) {
        NotificationEvent event = new NotificationEvent(
                "REVIEW_RESULT_AVAILABLE",
                List.of("IN_APP"),
                authorId,
                "Review Result Available",
                "A review result is available for submission " + submissionId + ".",
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent result-available notification to '{}' for submission {}", authorId, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize result-available notification for {}", submissionId, e);
        }
    }
}
