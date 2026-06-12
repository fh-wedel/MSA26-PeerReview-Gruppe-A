package com.fh_wedel.response.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SqsResultListenerTest {

    @Mock
    private ResultService resultService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @InjectMocks
    private SqsResultListener listener;

    @Test
    void shouldParseEventAndSaveResult() {
        when(resultService.save(any())).thenAnswer(i -> i.getArgument(0));

        String json = """
                {
                    "submissionId": "sub-123",
                    "reviewerId": "rev-456",
                    "authorId": "auth-789",
                    "finalGrade": "1.7",
                    "reviewComments": "Good work",
                    "documentS3Key": "reviews/sub-123/final.pdf",
                    "completedAt": "2026-06-11T14:30:00Z"
                }
                """;

        listener.receiveMessage(json);

        ArgumentCaptor<ReviewResult> captor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(resultService).save(captor.capture());

        ReviewResult saved = captor.getValue();
        assertThat(saved.getSubmissionId()).isEqualTo("sub-123");
        assertThat(saved.getReviewerId()).isEqualTo("rev-456");
        assertThat(saved.getAuthorId()).isEqualTo("auth-789");
        assertThat(saved.getFinalGrade()).isEqualTo("1.7");
        assertThat(saved.getDocumentS3Key()).isEqualTo("reviews/sub-123/final.pdf");
    }
}
