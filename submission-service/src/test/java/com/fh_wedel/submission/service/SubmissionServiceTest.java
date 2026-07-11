package com.fh_wedel.submission.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.repository.SubmissionRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionRepository repository;

    @Mock
    private S3Service s3Service;

    @Mock
    private SqsTemplate sqsTemplate;

    @Mock
    private ConfigurationServiceClient configurationServiceClient;

    private ObjectMapper objectMapper = new ObjectMapper();

    private String notificationQueueName = "test-notification-queue";

    private SubmissionService submissionService;

    @BeforeEach
    void setUp() {
        submissionService = new SubmissionService(repository, s3Service, sqsTemplate, objectMapper, configurationServiceClient, notificationQueueName);
    }

    @Test
    @DisplayName("Should successfully create a submission draft")
    void createSubmission_success() {
        Submission submission = submissionService.createSubmission("config-1", List.of("author-1"));

        assertThat(submission).isNotNull();
        assertThat(submission.getSubmissionId()).isNotNull();
        assertThat(submission.getStatus()).isEqualTo(SubmissionStatus.DRAFT.getDbValue());
        verify(repository).saveSubmission(submission);
    }

    @Test
    @DisplayName("Should successfully generate presigned upload URL for PDF and allowed status")
    void generatePresignedUploadUrl_pdf_success() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);
        when(s3Service.generatePresignedPutUrl(anyString(), eq("application/pdf"))).thenReturn("http://s3.url");

        PresignedUrlResponse response = submissionService.generatePresignedUploadUrl(
                "sub-1", "author-1", "paper.pdf", "application/pdf");

        assertThat(response).isNotNull();
        assertThat(response.getUploadUrl()).isEqualTo("http://s3.url");
        verify(repository).saveDocument(any(DocumentRecord.class));
    }

    @Test
    @DisplayName("Should fail generating presigned URL if file is not PDF")
    void generatePresignedUploadUrl_notPdf_throwsException() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        assertThatThrownBy(() -> submissionService.generatePresignedUploadUrl(
                "sub-1", "author-1", "paper.txt", "text/plain"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF uploads are allowed");

        assertThatThrownBy(() -> submissionService.generatePresignedUploadUrl(
                "sub-1", "author-1", "paper.pdf", "text/plain"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF uploads are allowed");

        assertThatThrownBy(() -> submissionService.generatePresignedUploadUrl(
                "sub-1", "author-1", "paper.txt", "application/pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only PDF uploads are allowed");
    }

    @Test
    @DisplayName("Should fail generating presigned URL if status is not allowed")
    void generatePresignedUploadUrl_wrongStatus_throwsException() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("SUBMITTED");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        assertThatThrownBy(() -> submissionService.generatePresignedUploadUrl(
                "sub-1", "author-1", "paper.pdf", "application/pdf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Can only upload documents for submissions in DRAFT or WAITING_FOR_SUBMISSION status");
    }

    @Test
    @DisplayName("Should successfully submit when at least one document exists and status is WAITING_FOR_SUBMISSION")
    void submitSubmission_success() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        SubmissionConfiguration config = new SubmissionConfiguration(
                "config-1", "Test Title", List.of("author-1"), Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200));
        when(configurationServiceClient.getConfiguration("config-1")).thenReturn(config);

        DocumentRecord doc = new DocumentRecord("sub-1", "doc-1", "paper.pdf", "key", "application/pdf");
        when(repository.findDocuments("sub-1")).thenReturn(List.of(doc));

        Submission result = submissionService.submitSubmission("sub-1", "author-1");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED.getDbValue());
        verify(repository).saveSubmission(submission);

    }

    @Test
    @DisplayName("Should fail submission if no documents are attached")
    void submitSubmission_noDocuments_throwsException() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        SubmissionConfiguration config = new SubmissionConfiguration(
                "config-1", "Test Title", List.of("author-1"), Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200));
        when(configurationServiceClient.getConfiguration("config-1")).thenReturn(config);

        when(repository.findDocuments("sub-1")).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> submissionService.submitSubmission("sub-1", "author-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot submit without at least one document");
    }

    @Test
    @DisplayName("Should fail submission if configuration is not found")
    void submitSubmission_configurationNotFound_throwsException() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);
        when(configurationServiceClient.getConfiguration("config-1")).thenReturn(null);

        assertThatThrownBy(() -> submissionService.submitSubmission("sub-1", "author-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Submission configuration not found");
    }

    @Test
    @DisplayName("Should fail submission if the submission deadline has passed")
    void submitSubmission_deadlinePassed_throwsException() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        SubmissionConfiguration config = new SubmissionConfiguration(
                "config-1", "Test Title", List.of("author-1"), Instant.now().minusSeconds(10), Instant.now().plusSeconds(7200));
        when(configurationServiceClient.getConfiguration("config-1")).thenReturn(config);

        assertThatThrownBy(() -> submissionService.submitSubmission("sub-1", "author-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Submission deadline has passed");
    }

    @Test
    @DisplayName("Should successfully submit when deadline is null")
    void submitSubmission_noDeadline_success() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        submission.setStatus("WAITING_FOR_SUBMISSION");
        when(repository.findSubmissionById("sub-1")).thenReturn(submission);

        SubmissionConfiguration config = new SubmissionConfiguration(
                "config-1", "Test Title", List.of("author-1"), null, null);
        when(configurationServiceClient.getConfiguration("config-1")).thenReturn(config);

        DocumentRecord doc = new DocumentRecord("sub-1", "doc-1", "paper.pdf", "key", "application/pdf");
        when(repository.findDocuments("sub-1")).thenReturn(List.of(doc));

        Submission result = submissionService.submitSubmission("sub-1", "author-1");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED.getDbValue());
    }

    @Test
    @DisplayName("Should successfully generate presigned download URL for document")
    void getPresignedDownloadUrl_success() {
        DocumentRecord doc = new DocumentRecord("sub-1", "doc-1", "paper.pdf", "submissions/sub-1/doc-1/paper.pdf", "application/pdf");
        when(repository.findDocument("sub-1", "doc-1")).thenReturn(doc);
        when(s3Service.generatePresignedGetUrl("submissions/sub-1/doc-1/paper.pdf")).thenReturn("http://s3.download.url");

        String downloadUrl = submissionService.getPresignedDownloadUrl("sub-1", "doc-1");

        assertThat(downloadUrl).isEqualTo("http://s3.download.url");
    }

    @Test
    @DisplayName("Should fail to generate download URL if document is not found")
    void getPresignedDownloadUrl_notFound_throwsException() {
        when(repository.findDocument("sub-1", "doc-1")).thenReturn(null);

        assertThatThrownBy(() -> submissionService.getPresignedDownloadUrl("sub-1", "doc-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Document not found");
    }

    @Test
    @DisplayName("Should send review completed notification for all authors")
    void sendReviewCompletedNotification_success() {
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1", "author-2"));
        
        submissionService.sendReviewCompletedNotification(submission);

        org.mockito.ArgumentCaptor<String> payloadCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate, org.mockito.Mockito.times(2)).send(eq(notificationQueueName), payloadCaptor.capture());
        
        List<String> payloads = payloadCaptor.getAllValues();
        assertThat(payloads).anyMatch(p -> p.contains("author-1"));
        assertThat(payloads).anyMatch(p -> p.contains("author-2"));
    }

    @Test
    @DisplayName("Should skip sending review completed notification if queue name is missing")
    void sendReviewCompletedNotification_noQueueName_skips() {
        SubmissionService serviceWithoutQueue = new SubmissionService(
                repository, s3Service, sqsTemplate, objectMapper, configurationServiceClient, "");
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        
        serviceWithoutQueue.sendReviewCompletedNotification(submission);

        verify(sqsTemplate, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("Should skip sending review completed notification if queue name is null")
    void sendReviewCompletedNotification_nullQueueName_skips() {
        SubmissionService serviceWithoutQueue = new SubmissionService(
                repository, s3Service, sqsTemplate, objectMapper, configurationServiceClient, null);
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        
        serviceWithoutQueue.sendReviewCompletedNotification(submission);

        verify(sqsTemplate, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("Should skip sending review completed notification if author list is null")
    void sendReviewCompletedNotification_nullAuthors_skips() {
        Submission submission = new Submission("sub-1", "config-1", null);
        
        submissionService.sendReviewCompletedNotification(submission);

        verify(sqsTemplate, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("Should skip sending review completed notification if author list is empty")
    void sendReviewCompletedNotification_emptyAuthors_skips() {
        Submission submission = new Submission("sub-1", "config-1", Collections.emptyList());
        
        submissionService.sendReviewCompletedNotification(submission);

        verify(sqsTemplate, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("Should handle JsonProcessingException gracefully when sending review completed notification")
    void sendReviewCompletedNotification_jsonException() throws Exception {
        ObjectMapper mockMapper = org.mockito.Mockito.mock(ObjectMapper.class);
        org.mockito.Mockito.when(mockMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("Test error") {});
        
        SubmissionService serviceWithMockMapper = new SubmissionService(
                repository, s3Service, sqsTemplate, mockMapper, configurationServiceClient, notificationQueueName);
        Submission submission = new Submission("sub-1", "config-1", List.of("author-1"));
        
        serviceWithMockMapper.sendReviewCompletedNotification(submission);

        verify(sqsTemplate, org.mockito.Mockito.never()).send(anyString(), anyString());
    }
}

