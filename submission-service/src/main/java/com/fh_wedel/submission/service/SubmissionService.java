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
import java.util.UUID;

@Service
@Slf4j
public class SubmissionService {

    private final SubmissionRepository repository;
    private final S3Service s3Service;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String responseQueueName;

    public SubmissionService(SubmissionRepository repository,
                             S3Service s3Service,
                             SqsTemplate sqsTemplate,
                             ObjectMapper objectMapper,
                             @Value("${aws.sqs.response.queue-name}") String responseQueueName) {
        this.repository = repository;
        this.s3Service = s3Service;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.responseQueueName = responseQueueName;
    }

    public Submission createSubmission(String configurationId, String authorId, String title) {
        String submissionId = UUID.randomUUID().toString();
        log.info("Creating submission: id={}, configId={}, authorId={}", submissionId, configurationId, authorId);

        Submission submission = new Submission(submissionId, configurationId, authorId, title);
        repository.saveSubmission(submission);
        return submission;
    }

    public Submission getSubmission(String submissionId) {
        return repository.findSubmissionById(submissionId);
    }

    public List<Submission> getSubmissionsByAuthor(String authorId) {
        return repository.findSubmissionsByAuthor(authorId);
    }

    public Submission updateSubmission(String submissionId, String authorId, UpdateSubmissionRequest request) {
        Submission submission = repository.findSubmissionById(submissionId);
        if (submission == null) {
            return null;
        }

        if (!submission.getAuthorId().equals(authorId)) {
            throw new IllegalStateException("Not the owner of this submission");
        }

        if (!SubmissionStatus.DRAFT.name().equals(submission.getStatus())) {
            throw new IllegalStateException("Can only update submissions in DRAFT status");
        }

        if (request.getTitle() != null) {
            submission.setTitle(request.getTitle());
        }
        submission.setUpdatedAt(Instant.now());
        repository.saveSubmission(submission);
        return submission;
    }

    public PresignedUrlResponse generatePresignedUploadUrl(String submissionId, String authorId,
                                                           String fileName, String contentType) {
        Submission submission = repository.findSubmissionById(submissionId);
        if (submission == null) {
            throw new IllegalStateException("Submission not found");
        }

        if (!submission.getAuthorId().equals(authorId)) {
            throw new IllegalStateException("Not the owner of this submission");
        }

        if (!SubmissionStatus.DRAFT.name().equals(submission.getStatus())) {
            throw new IllegalStateException("Can only upload documents for submissions in DRAFT status");
        }

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

        if (!submission.getAuthorId().equals(authorId)) {
            throw new IllegalStateException("Not the owner of this submission");
        }

        if (!SubmissionStatus.DRAFT.name().equals(submission.getStatus())) {
            throw new IllegalStateException("Can only submit submissions in DRAFT status");
        }

        List<DocumentRecord> documents = repository.findDocuments(submissionId);
        if (documents.isEmpty()) {
            throw new IllegalStateException("Cannot submit without at least one document");
        }

        submission.setStatus(SubmissionStatus.SUBMITTED.name());
        submission.setSubmittedAt(Instant.now());
        submission.setUpdatedAt(Instant.now());
        repository.saveSubmission(submission);

        sendSubmissionReadyEvent(submission);
        log.info("Submission {} submitted by author {}", submissionId, authorId);
        return submission;
    }

    public List<DocumentRecord> getDocuments(String submissionId) {
        return repository.findDocuments(submissionId);
    }

    public String getServiceStatus() {
        return "Submission Service is up and running!";
    }

    private void sendSubmissionReadyEvent(Submission submission) {
        if (responseQueueName == null || responseQueueName.isBlank()) {
            log.warn("No response queue name defined. Skipping sending event for submission {}", submission.getSubmissionId());
            return;
        }

        SubmissionReadyEvent event = new SubmissionReadyEvent(
                submission.getSubmissionId(),
                submission.getAuthorId(),
                submission.getConfigurationId()
        );

        try {
            String messageBody = objectMapper.writeValueAsString(event);
            sqsTemplate.send(responseQueueName, messageBody);
            log.info("Sent SubmissionReadyEvent to queue '{}' for submission {}", responseQueueName, submission.getSubmissionId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize SubmissionReadyEvent for submission {}", submission.getSubmissionId(), e);
        }
    }
}
