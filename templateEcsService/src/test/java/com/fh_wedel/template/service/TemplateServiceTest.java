package com.fh_wedel.template.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TemplateServiceTest {

    @Mock
    private SqsTemplate sqsTemplate;

    private TemplateService templateService;

    @Test
    void getServiceStatus_ReturnsExpectedStatus() {
        templateService = new TemplateService(sqsTemplate, "my-queue");
        String status = templateService.getServiceStatus();
        assertEquals("Template Service is up and running!", status);
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsValid_SendsMessage() {
        templateService = new TemplateService(sqsTemplate, "my-queue");
        templateService.respondToSqsQueue("test-message");
        verify(sqsTemplate, times(1)).send("my-queue", "test-message");
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsNull_DoesNotSendMessage() {
        templateService = new TemplateService(sqsTemplate, null);
        templateService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }

    @Test
    void respondToSqsQueue_WhenQueueNameIsBlank_DoesNotSendMessage() {
        templateService = new TemplateService(sqsTemplate, "   ");
        templateService.respondToSqsQueue("test-message");
        verify(sqsTemplate, never()).send(anyString(), anyString());
    }
}

