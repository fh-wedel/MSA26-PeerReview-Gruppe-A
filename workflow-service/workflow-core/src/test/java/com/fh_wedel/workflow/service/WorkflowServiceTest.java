package com.fh_wedel.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.DefaultApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.workflow.api.ReviewTypePlugin;
import com.fh_wedel.workflow.exception.DownstreamServiceException;
import com.fh_wedel.workflow.exception.ReviewAlreadySubmittedException;
import com.fh_wedel.workflow.model.ReviewSession;
import com.fh_wedel.workflow.model.SubmittedReview;
import com.fh_wedel.workflow.model.api.ReviewTypeDto;
import com.fh_wedel.workflow.model.api.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.ReviewTypeRegistry;
import com.fh_wedel.workflow.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private ReviewTypeRegistry typeRegistry;
    @Mock
    private com.fh_wedel.workflow.plugin.ReviewTemplateRegistry templateRegistry;

    @Mock
    private DefaultApi configurationApi;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private WorkflowService service;

    private ReviewTypePlugin createMockPlugin(String name) {
        ReviewTypePlugin plugin = mock(ReviewTypePlugin.class);
        lenient().when(plugin.getName()).thenReturn(name);
        lenient().when(plugin.getDescription()).thenReturn(name + " description");
        lenient().when(plugin.getTitle()).thenReturn(name + " title");
        lenient().when(plugin.isAuthorAnonymous()).thenReturn(true);
        lenient().when(plugin.isReviewerAnonymous()).thenReturn(false);
        lenient().when(plugin.isAuthorReviewerChatAllowed()).thenReturn(false);
        return plugin;
    }

    @Test
    void listPluginsReturnsAllPlugins() {
        ReviewTypePlugin mock1 = createMockPlugin("plugin-1");
        ReviewTypePlugin mock2 = createMockPlugin("plugin-2");
        when(typeRegistry.getAll()).thenReturn(List.of(mock1, mock2));

        List<ReviewTypeDto> result = service.listReviewTypes();

        assertEquals(2, result.size());
        assertEquals("plugin-1", result.get(0).getName());
        assertEquals("plugin-2", result.get(1).getName());
        verify(typeRegistry).getAll();
    }

    @Test
    void getPluginReturnsDto() {
        ReviewTypePlugin mockPlugin = createMockPlugin("plugin-1");
        when(typeRegistry.getByName("plugin-1")).thenReturn(Optional.of(mockPlugin));

        ReviewTypeDto result = service.getReviewType("plugin-1");

        assertNotNull(result);
        assertEquals("plugin-1", result.getName());
        assertEquals("plugin-1 description", result.getDescription());
        assertTrue(result.getRules().getAuthorAnonymous());
        assertFalse(result.getRules().getReviewerAnonymous());
        verify(typeRegistry).getByName("plugin-1");
    }

    @Test
    void getPluginThrowsForUnknown() {
        when(typeRegistry.getByName("unknown")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> service.getReviewType("unknown"));
        verify(typeRegistry).getByName("unknown");
    }

    @Test
    void getPluginRulesReturnsCorrectValues() {
        ReviewTypePlugin mockPlugin = createMockPlugin("plugin-1");
        when(typeRegistry.getByName("plugin-1")).thenReturn(Optional.of(mockPlugin));

        WorkflowRulesDto result = service.getReviewTypeRules("plugin-1");

        assertNotNull(result);
        assertTrue(result.getAuthorAnonymous());
        assertFalse(result.getReviewerAnonymous());
        assertFalse(result.getAuthorReviewerChatAllowed());
        verify(typeRegistry).getByName("plugin-1");
    }

    @Test
    void getPluginRulesThrowsForUnknown() {
        when(typeRegistry.getByName("unknown")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> service.getReviewTypeRules("unknown"));
        verify(typeRegistry).getByName("unknown");
    }

    @Test
    void getRulesForSubmissionCallsConfigurationServiceAndReturnsRules() throws Exception {
        ModelConfiguration mockConfig = new ModelConfiguration();
        mockConfig.setReviewProcessType("SINGLE_BLIND");
        mockConfig.setReviewTemplateType("INDIVIDUAL_WORK");
        when(configurationApi.submissionIdGet("sub-123")).thenReturn(mockConfig);

        ReviewTypePlugin mockPlugin = createMockPlugin("SINGLE_BLIND");
        when(typeRegistry.getByName("SINGLE_BLIND")).thenReturn(Optional.of(mockPlugin));

        WorkflowRulesDto result = service.getRulesForSubmission("sub-123");

        assertNotNull(result);
        assertTrue(result.getAuthorAnonymous());
        assertFalse(result.getReviewerAnonymous());
        verify(configurationApi).submissionIdGet("sub-123");
        verify(typeRegistry).getByName("SINGLE_BLIND");
    }

    @Test
    void getRulesForSubmissionThrowsWhenConfigurationFails() throws Exception {
        when(configurationApi.submissionIdGet("sub-123")).thenThrow(new RuntimeException("API down"));

        assertThrows(DownstreamServiceException.class, () -> service.getRulesForSubmission("sub-123"));
        verify(configurationApi).submissionIdGet("sub-123");
    }

    @Test
    void getRulesForSubmissionThrowsNoSuchElementExceptionOn404() throws Exception {
        com.fh_wedel.configuration.client.ApiException apiException =
                new com.fh_wedel.configuration.client.ApiException(404, "Not Found");
        when(configurationApi.submissionIdGet("sub-123")).thenThrow(apiException);

        assertThrows(NoSuchElementException.class, () -> service.getRulesForSubmission("sub-123"));
        verify(configurationApi).submissionIdGet("sub-123");
    }

    @Test
    void initializeReviewSessionSavesSession() {
        service.initializeReviewSession("sub-123", "SINGLE_BLIND", List.of("rev-1"));
        verify(reviewRepository).saveSession(any(ReviewSession.class));
    }

    @Test
    void submitReviewThrowsIfSessionNotFound() {
        when(reviewRepository.getSession("sub-123")).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> service.submitReview("sub-123", "rev-1", List.of()));
    }

    @Test
    void submitReviewThrowsIfAlreadySubmitted() {
        ReviewSession session = new ReviewSession("sub-123", "SINGLE_BLIND", List.of("rev-1"));
        when(reviewRepository.getSession("sub-123")).thenReturn(session);
        when(reviewRepository.getReview("sub-123", "rev-1")).thenReturn(new SubmittedReview());

        assertThrows(ReviewAlreadySubmittedException.class, () -> service.submitReview("sub-123", "rev-1", List.of()));
    }

    @Test
    void submitReviewSavesReviewAndUpdatesCount() throws Exception {
        ReviewSession session = new ReviewSession("sub-123", "SINGLE_BLIND", List.of("rev-1", "rev-2"));
        when(reviewRepository.getSession("sub-123")).thenReturn(session);
        when(reviewRepository.getReview("sub-123", "rev-1")).thenReturn(null);

        com.fh_wedel.workflow.api.ReviewTemplatePlugin mockTemplate = mock(com.fh_wedel.workflow.api.ReviewTemplatePlugin.class);
        com.fh_wedel.workflow.api.model.ReviewGrade grade = new com.fh_wedel.workflow.api.model.ReviewGrade(10, 20, 50.0, "Summary");
        when(mockTemplate.calculateGrade(any())).thenReturn(grade);
        when(templateRegistry.getByName("SINGLE_BLIND")).thenReturn(Optional.of(mockTemplate));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(reviewRepository.incrementReceivedReviewCount("sub-123")).thenReturn(1);

        com.fh_wedel.workflow.api.model.ReviewGrade result = service.submitReview("sub-123", "rev-1", List.of());

        assertNotNull(result);
        assertEquals(10, result.totalPoints());
        verify(reviewRepository).saveReview(any(SubmittedReview.class));
        verify(reviewRepository).incrementReceivedReviewCount("sub-123");
    }

    @Test
    void submitReviewSavesReviewAndMarksComplete() throws Exception {
        ReviewSession session = new ReviewSession("sub-123", "SINGLE_BLIND", List.of("rev-1"));
        when(reviewRepository.getSession("sub-123")).thenReturn(session);
        when(reviewRepository.getReview("sub-123", "rev-1")).thenReturn(null);

        com.fh_wedel.workflow.api.ReviewTemplatePlugin mockTemplate = mock(com.fh_wedel.workflow.api.ReviewTemplatePlugin.class);
        com.fh_wedel.workflow.api.model.ReviewGrade grade = new com.fh_wedel.workflow.api.model.ReviewGrade(10, 20, 50.0, "Summary");
        when(mockTemplate.calculateGrade(any())).thenReturn(grade);
        when(templateRegistry.getByName("SINGLE_BLIND")).thenReturn(Optional.of(mockTemplate));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(reviewRepository.incrementReceivedReviewCount("sub-123")).thenReturn(1);

        com.fh_wedel.workflow.api.model.ReviewGrade result = service.submitReview("sub-123", "rev-1", List.of());

        assertNotNull(result);
        verify(reviewRepository).saveReview(any(SubmittedReview.class));
        verify(reviewRepository).incrementReceivedReviewCount("sub-123");
        verify(reviewRepository).markSessionComplete("sub-123");
    }

    @Test
    void getFeedbackFormForSubmissionThrowsNoSuchElementExceptionOn404() throws Exception {
        com.fh_wedel.configuration.client.ApiException apiException =
                new com.fh_wedel.configuration.client.ApiException(404, "Not Found");
        when(configurationApi.submissionIdGet("sub-123")).thenThrow(apiException);

        assertThrows(NoSuchElementException.class, () -> service.getFeedbackFormForSubmission("sub-123"));
    }
}
