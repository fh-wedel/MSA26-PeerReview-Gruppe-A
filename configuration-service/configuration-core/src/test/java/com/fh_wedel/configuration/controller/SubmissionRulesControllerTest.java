package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.ReviewTypePlugin;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.model.api.ReviewRulesDto;
import com.fh_wedel.configuration.service.ConfigurationService;
import com.fh_wedel.configuration.service.PluginService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionRulesControllerTest {

    @Mock
    private ConfigurationService configurationService;

    @Mock
    private PluginService pluginService;

    @InjectMocks
    private SubmissionRulesController controller;

    @Test
    void testGetRulesForSubmission_Success() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setReviewProcessType("process-a");
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        ReviewTypePlugin plugin = mock(ReviewTypePlugin.class);
        when(plugin.isAuthorAnonymous()).thenReturn(true);
        when(plugin.isReviewerAnonymous()).thenReturn(false);
        when(plugin.isAuthorReviewerChatAllowed()).thenReturn(true);

        when(pluginService.getReviewType("process-a")).thenReturn(Optional.of(plugin));

        ResponseEntity<ReviewRulesDto> response = controller.getRulesForSubmission("sub1");

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ReviewRulesDto rules = response.getBody();
        assertNotNull(rules);
        assertTrue(rules.getAuthorAnonymous());
        assertFalse(rules.getReviewerAnonymous());
        assertTrue(rules.getAuthorReviewerChatAllowed());
    }

    @Test
    void testGetRulesForSubmission_ConfigNotFound() {
        when(configurationService.getConfiguration("sub1")).thenReturn(null);

        ResponseEntity<ReviewRulesDto> response = controller.getRulesForSubmission("sub1");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetRulesForSubmission_PluginNotFound() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setReviewProcessType("process-a");
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        when(pluginService.getReviewType("process-a")).thenReturn(Optional.empty());

        ResponseEntity<ReviewRulesDto> response = controller.getRulesForSubmission("sub1");

        assertEquals(404, response.getStatusCode().value());
    }
}
