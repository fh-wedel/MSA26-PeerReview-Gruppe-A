package com.fh_wedel.response.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionReviewsApi;
import com.fh_wedel.configuration.client.model.ReviewQuestionDto;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.repository.ReviewResultRepository;
import com.fh_wedel.response.service.BedrockProxyClientService;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiReviewSqsListenerTest {

    @Mock
    private ReviewResultRepository repository;
    @Mock
    private BedrockProxyClientService bedrockProxyClientService;
    @Mock
    private SubmissionReviewsApi submissionReviewsApi;
    @Mock
    private ResultService resultService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("marks AI review as completed on valid proxy response")
    void receiveAiReviewTask_completesOnValidPayload() throws Exception {
        UUID reviewId = UUID.randomUUID();
        ReviewResult placeholder = ReviewResult.builder()
                .id(reviewId)
                .submissionId("sub-1")
                .reviewerId("AI-Reviewer")
                .isAiGenerated(true)
                .aiStatus("REQUESTED")
                .createdAt(Instant.now())
                .build();

        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(placeholder));
        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-1")).thenReturn(List.of(
                new ReviewQuestionDto().id("q1").text("Originality").required(true),
                new ReviewQuestionDto().id("q2").text("Structure").required(false)
        ));
        when(bedrockProxyClientService.generateReview(any(), any(), any(), any())).thenReturn("""
                {
                  "finalGrade": "1.7",
                  "reviewComments": "Solid work.",
                  "answers": [
                    {"questionId": "q1", "answer": "8"},
                    {"questionId": "q2", "answer": "Good structure"}
                  ]
                }
                """);

        AiReviewSqsListener listener = new AiReviewSqsListener(
                repository,
                bedrockProxyClientService,
                submissionReviewsApi,
                resultService,
                objectMapper,
                "http://submission.internal.services:8081"
        );

        listener.receiveAiReviewTask("""
                {"submissionId":"sub-1","reviewResultId":"%s","documentS3Key":"docs/sub-1.pdf"}
                """.formatted(reviewId));

        ArgumentCaptor<ReviewResult> savedCaptor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(resultService).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getAiStatus()).isEqualTo("COMPLETED");
        assertThat(savedCaptor.getValue().getAnswers()).hasSize(2);
    }

    @Test
    @DisplayName("marks AI review as failed on invalid proxy response")
    void receiveAiReviewTask_failsOnInvalidPayload() throws Exception {
        UUID reviewId = UUID.randomUUID();
        ReviewResult placeholder = ReviewResult.builder()
                .id(reviewId)
                .submissionId("sub-1")
                .reviewerId("AI-Reviewer")
                .isAiGenerated(true)
                .aiStatus("REQUESTED")
                .createdAt(Instant.now())
                .build();

        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(placeholder));
        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-1")).thenReturn(List.of(
                new ReviewQuestionDto().id("q-required").text("Required").required(true)
        ));
        when(bedrockProxyClientService.generateReview(any(), any(), any(), any())).thenReturn("""
                {
                  "finalGrade": "2.0",
                  "reviewComments": "Missing required answer.",
                  "answers": []
                }
                """);

        AiReviewSqsListener listener = new AiReviewSqsListener(
                repository,
                bedrockProxyClientService,
                submissionReviewsApi,
                resultService,
                objectMapper,
                "http://submission.internal.services:8081"
        );

        listener.receiveAiReviewTask("""
                {"submissionId":"sub-1","reviewResultId":"%s","documentS3Key":"docs/sub-1.pdf"}
                """.formatted(reviewId));

        ArgumentCaptor<ReviewResult> failedCaptor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(repository, org.mockito.Mockito.atLeast(2)).save(failedCaptor.capture());
        assertThat(failedCaptor.getAllValues().getLast().getAiStatus()).isEqualTo("FAILED");
        verify(resultService, never()).save(any());
    }
}
