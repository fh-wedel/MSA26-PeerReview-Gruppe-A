package com.fh_wedel.matching.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private SqsTemplate sqsTemplate;

    private MatchingService matchingService;

    @Test
    void getServiceStatus_ReturnsExpectedStatus() {
        matchingService = new MatchingService(sqsTemplate, "my-queue");
        String status = matchingService.getServiceStatus();
        assertEquals("Template Service is up and running!", status);
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsValid_SendsMessage() {
        matchingService = new MatchingService(sqsTemplate, "my-queue");
        matchingService.respondToSqsQueue("test-message");
        verify(sqsTemplate, times(1)).send("my-queue", "test-message");
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsNull_DoesNotSendMessage() {
        matchingService = new MatchingService(sqsTemplate, null);
        matchingService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsBlank_DoesNotSendMessage() {
        matchingService = new MatchingService(sqsTemplate, "   ");
        matchingService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }
}

