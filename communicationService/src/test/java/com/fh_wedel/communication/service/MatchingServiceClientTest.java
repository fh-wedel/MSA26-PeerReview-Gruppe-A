package com.fh_wedel.communication.service;

import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceClientTest {

    @Mock
    private MatchesApi matchesApi;

    @InjectMocks
    private MatchingServiceClient client;

    @Test
    void testGetSubmissionMatch_Success() throws Exception {
        SubmissionMatchResponse mockRes = new SubmissionMatchResponse();
        when(matchesApi.getMatchesBySubmission("sub1")).thenReturn(mockRes);

        SubmissionMatchResponse result = client.getSubmissionMatch("sub1");

        assertNotNull(result);
        assertEquals(mockRes, result);
    }

    @Test
    void testGetSubmissionMatch_Exception() throws Exception {
        when(matchesApi.getMatchesBySubmission(anyString())).thenThrow(new RuntimeException("Api error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> client.getSubmissionMatch("sub1"));
        assertTrue(ex.getMessage().contains("Failed to fetch submission match"));
    }
}
