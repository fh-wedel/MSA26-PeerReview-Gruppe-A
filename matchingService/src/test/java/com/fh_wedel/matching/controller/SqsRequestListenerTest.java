package com.fh_wedel.matching.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.matching.model.events.MatchingRequestEvent;
import com.fh_wedel.matching.service.MatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SqsRequestListenerTest {

    @Mock
    private MatchingService matchingService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SqsRequestListener sqsRequestListener;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void receiveMessage_Success() throws Exception {
        String message = "{\"submissionId\":\"sub-1\"}";
        MatchingRequestEvent event = new MatchingRequestEvent();
        event.setSubmissionId("sub-1");
        event.setSubmitterIds(List.of("author-1"));
        event.setNumberOfExaminers(2);

        when(objectMapper.readValue(message, MatchingRequestEvent.class)).thenReturn(event);

        sqsRequestListener.receiveMessage(message);

        verify(matchingService, times(1)).processMatchingRequest(event);
    }

    @Test
    void receiveMessage_DeserializationError() throws Exception {
        String message = "invalid-json";

        when(objectMapper.readValue(message, MatchingRequestEvent.class))
                .thenThrow(new JsonProcessingException("error") {});

        sqsRequestListener.receiveMessage(message);

        verify(matchingService, never()).processMatchingRequest(any());
    }

    @Test
    void receiveMessage_ServiceException() throws Exception {
        String message = "{\"submissionId\":\"sub-1\"}";
        MatchingRequestEvent event = new MatchingRequestEvent();
        
        when(objectMapper.readValue(message, MatchingRequestEvent.class)).thenReturn(event);
        doThrow(new RuntimeException("service error")).when(matchingService).processMatchingRequest(event);

        sqsRequestListener.receiveMessage(message);

        verify(matchingService, times(1)).processMatchingRequest(event);
    }
}
