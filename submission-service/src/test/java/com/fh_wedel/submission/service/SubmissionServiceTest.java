package com.fh_wedel.submission.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SqsTemplate sqsTemplate;

    private SubmissionService submissionService;

    @Test
    void getServiceStatus_ReturnsExpectedStatus() {
        submissionService = new SubmissionService(sqsTemplate, "my-queue");
        String status = submissionService.getServiceStatus();
        assertEquals("Submission Service is up and running!", status);
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsValid_SendsMessage() {
        submissionService = new SubmissionService(sqsTemplate, "my-queue");
        submissionService.respondToSqsQueue("test-message");
        verify(sqsTemplate, times(1)).send("my-queue", "test-message");
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsNull_DoesNotSendMessage() {
        submissionService = new SubmissionService(sqsTemplate, null);
        submissionService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsBlank_DoesNotSendMessage() {
        submissionService = new SubmissionService(sqsTemplate, "   ");
        submissionService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }
}
