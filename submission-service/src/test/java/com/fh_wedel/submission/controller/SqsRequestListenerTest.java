package com.fh_wedel.submission.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.submission.model.Submission;
import com.fh_wedel.submission.model.SubmissionConfiguration;
import com.fh_wedel.submission.model.SubmissionStatus;
import com.fh_wedel.submission.repository.SubmissionRepository;
import com.fh_wedel.submission.service.ConfigurationServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SqsRequestListenerTest {

    @Mock
    private SubmissionRepository repository;

    @Mock
    private ConfigurationServiceClient configurationServiceClient;

    @Mock
    private com.fh_wedel.submission.service.SubmissionService submissionService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private SqsRequestListener sqsRequestListener;

    @BeforeEach
    void setUp() {
        sqsRequestListener = new SqsRequestListener(repository, objectMapper, configurationServiceClient, submissionService);
    }

    @Test
    @DisplayName("Should create a new submission in status 'WAITING_FOR_SUBMISSION' when it does not exist")
    void handleMessage_newSubmission_createsRecord() {
        String submissionId = "sub-123";
        String message = String.format("{\"submissionId\":\"%s\",\"status\":\"MATCHED\"}", submissionId);

        when(repository.findSubmissionById(submissionId)).thenReturn(null);

        SubmissionConfiguration config = new SubmissionConfiguration(submissionId, "Test Title", List.of("author-uuid"));
        when(configurationServiceClient.getConfiguration(submissionId)).thenReturn(config);

        sqsRequestListener.handleMessage(message);

        ArgumentCaptor<Submission> captor = ArgumentCaptor.forClass(Submission.class);
        verify(repository).saveSubmission(captor.capture());

        Submission saved = captor.getValue();
        assertThat(saved.getSubmissionId()).isEqualTo(submissionId);
        assertThat(saved.getAuthorIds()).containsExactly("author-uuid");
        assertThat(saved.getStatus()).isEqualTo(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
    }

    @Test
    @DisplayName("Should create a new submission using authorIds list from SQS message directly without calling configuration service")
    void handleMessage_newSubmissionWithAuthor_createsRecordWithoutConfig() {
        String submissionId = "sub-123";
        String authorId = "author-555";
        String message = String.format("{\"submissionId\":\"%s\",\"authorIds\":[\"%s\"],\"status\":\"MATCHED\"}", submissionId, authorId);

        when(repository.findSubmissionById(submissionId)).thenReturn(null);

        sqsRequestListener.handleMessage(message);

        ArgumentCaptor<Submission> captor = ArgumentCaptor.forClass(Submission.class);
        verify(repository).saveSubmission(captor.capture());

        Submission saved = captor.getValue();
        assertThat(saved.getSubmissionId()).isEqualTo(submissionId);
        assertThat(saved.getAuthorIds()).containsExactly(authorId);
        assertThat(saved.getStatus()).isEqualTo(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());

        verifyNoInteractions(configurationServiceClient);
    }

    @Test
    @DisplayName("Should update an existing submission status to 'WAITING_FOR_SUBMISSION'")
    void handleMessage_existingSubmission_updatesStatus() {
        String submissionId = "sub-456";
        String message = String.format("{\"submissionId\":\"%s\",\"status\":\"MATCHED\"}", submissionId);

        Submission existing = new Submission(submissionId, submissionId, List.of("author-uuid"));
        existing.setStatus(SubmissionStatus.DRAFT.getDbValue());

        when(repository.findSubmissionById(submissionId)).thenReturn(existing);

        sqsRequestListener.handleMessage(message);

        verify(repository).saveSubmission(existing);
        assertThat(existing.getStatus()).isEqualTo(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
        verifyNoInteractions(configurationServiceClient);
    }

    @Test
    @DisplayName("Should apply the event status when it is not MATCHED")
    void handleMessage_statusNotMatched_updatesStatus() {
        String submissionId = "sub-789";
        String message = String.format("{\"submissionId\":\"%s\",\"status\":\"IN_REVIEW\"}", submissionId);

        Submission existing = new Submission(submissionId, submissionId, List.of("author-uuid"));
        existing.setStatus(SubmissionStatus.SUBMITTED.getDbValue());

        when(repository.findSubmissionById(submissionId)).thenReturn(existing);

        sqsRequestListener.handleMessage(message);

        verify(repository).saveSubmission(existing);
        assertThat(existing.getStatus()).isEqualTo("IN_REVIEW");
        verifyNoInteractions(configurationServiceClient);
    }

    @Test
    @DisplayName("Should ignore event if submissionId is blank")
    void handleMessage_blankSubmissionId_ignored() {
        String message = "{\"submissionId\":\"\",\"status\":\"MATCHED\"}";

        sqsRequestListener.handleMessage(message);

        verifyNoInteractions(repository);
        verifyNoInteractions(configurationServiceClient);
    }
}
