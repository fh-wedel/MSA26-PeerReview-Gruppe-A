package com.fh_wedel.communication.service;

import com.fh_wedel.configuration.client.api.SubmissionRulesApi;
import com.fh_wedel.configuration.client.model.ReviewRulesDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfigurationServiceClientTest {

    @Mock
    private SubmissionRulesApi configurationRulesApi;

    @InjectMocks
    private ConfigurationServiceClient client;

    @Test
    void testGetSubmissionRules_Success() throws Exception {
        ReviewRulesDto mockRes = new ReviewRulesDto();
        when(configurationRulesApi.getRulesForSubmission("sub1")).thenReturn(mockRes);

        ReviewRulesDto result = client.getSubmissionRules("sub1");

        assertNotNull(result);
        assertEquals(mockRes, result);
    }

    @Test
    void testGetSubmissionRules_Exception() throws Exception {
        when(configurationRulesApi.getRulesForSubmission(anyString())).thenThrow(new RuntimeException("Api error"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.getSubmissionRules("sub1"));
        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Failed to fetch configuration rules"));
    }
}
