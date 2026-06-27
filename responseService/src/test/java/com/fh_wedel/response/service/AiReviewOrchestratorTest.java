package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.repository.ReviewResultRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiReviewOrchestratorTest {

    @Mock
    private ReviewResultRepository repository;
    @Mock
    private SqsTemplate sqsTemplate;

    private AiReviewOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        orchestrator = new AiReviewOrchestrator(repository, sqsTemplate, new ObjectMapper(), "response-ai-review-queue");
    }

    @Test
    @DisplayName("rejects duplicate AI request when AI review already exists")
    void requestReview_rejectsDuplicateAi() {
        ReviewResult existingAi = ReviewResult.builder()
                .submissionId("sub-1")
                .reviewerId("AI-Reviewer")
                .isAiGenerated(true)
                .build();
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(existingAi));

        assertThatThrownBy(() -> orchestrator.requestReview("sub-1", "docs/sub-1.pdf"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).saveIfAbsent(any());
    }

    @Test
    @DisplayName("returns conflict when conditional write detects concurrent AI placeholder creation")
    void requestReview_conflictOnConditionalWrite() {
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of());
        when(repository.saveIfAbsent(any())).thenThrow(ConditionalCheckFailedException.builder().message("exists").build());

        assertThatThrownBy(() -> orchestrator.requestReview("sub-1", "docs/sub-1.pdf"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("creates placeholder and sends AI review task")
    void requestReview_sendsQueueTask() {
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of());
        when(repository.saveIfAbsent(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewResult saved = orchestrator.requestReview("sub-1", "docs/sub-1.pdf");

        assertThat(saved.isAiGenerated()).isTrue();
        assertThat(saved.getAiStatus()).isEqualTo("REQUESTED");
        assertThat(saved.getReviewerId()).isEqualTo("AI-Reviewer");

        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(anyString(), payloadCaptor.capture());
        assertThat(payloadCaptor.getValue()).contains("\"submissionId\":\"sub-1\"");
        assertThat(payloadCaptor.getValue()).contains("\"documentS3Key\":\"docs/sub-1.pdf\"");
    }
}
