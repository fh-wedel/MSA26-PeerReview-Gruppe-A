package com.fh_wedel.workflow.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.workflow.model.ReviewSession;
import com.fh_wedel.workflow.model.SubmittedReview;
import com.fh_wedel.workflow.model.api.*;
import com.fh_wedel.workflow.service.WorkflowService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowControllerTest {

    @Mock
    private WorkflowService workflowService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HttpServletRequest requestContext;

    @InjectMocks
    private WorkflowController controller;

    private WorkflowRulesDto createRules() {
        WorkflowRulesDto rules = new WorkflowRulesDto();
        rules.setAuthorAnonymous(true);
        rules.setReviewerAnonymous(false);
        rules.setAuthorReviewerChatAllowed(false);
        rules.setDefaultNumberOfReviewers(2);
        rules.setDefaultNumberOfAuthors(1);
        return rules;
    }

    private WorkflowPluginDto createPlugin(String name, String title, String description, WorkflowRulesDto rules) {
        WorkflowPluginDto plugin = new WorkflowPluginDto();
        plugin.setName(name);
        plugin.setTitle(title);
        plugin.setDescription(description);
        plugin.setRules(rules);
        plugin.setDefaultNumberOfReviewers(2);
        plugin.setDefaultNumberOfAuthors(1);
        plugin.setFeedbackFormTemplate(Collections.emptyList());
        return plugin;
    }

    @Test
    void listPluginsReturns200() {
        WorkflowRulesDto rules = createRules();
        WorkflowPluginDto plugin1 = createPlugin("plugin-1", "Plugin 1", "description 1", rules);
        WorkflowPluginDto plugin2 = createPlugin("plugin-2", "Plugin 2", "description 2", rules);
        
        when(workflowService.listPlugins()).thenReturn(List.of(plugin1, plugin2));

        ResponseEntity<List<WorkflowPluginDto>> response = controller.listPlugins();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals("plugin-1", response.getBody().get(0).getName());
        verify(workflowService).listPlugins();
    }

    @Test
    void getPluginReturns200() {
        WorkflowRulesDto rules = createRules();
        WorkflowPluginDto plugin = createPlugin("plugin-1", "Plugin 1", "description 1", rules);

        when(workflowService.getPlugin("plugin-1")).thenReturn(plugin);

        ResponseEntity<WorkflowPluginDto> response = controller.getPlugin("plugin-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("plugin-1", response.getBody().getName());
        verify(workflowService).getPlugin("plugin-1");
    }

    @Test
    void getPluginThrowsForUnknown() {
        when(workflowService.getPlugin("unknown")).thenThrow(new NoSuchElementException("Not found"));

        assertThrows(NoSuchElementException.class, () -> controller.getPlugin("unknown"));
        verify(workflowService).getPlugin("unknown");
    }

    @Test
    void getPluginRulesReturns200() {
        WorkflowRulesDto rules = createRules();

        when(workflowService.getPluginRules("plugin-1")).thenReturn(rules);

        ResponseEntity<WorkflowRulesDto> response = controller.getPluginRules("plugin-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getAuthorAnonymous());
        verify(workflowService).getPluginRules("plugin-1");
    }

    @Test
    void getPluginRulesThrowsForUnknown() {
        when(workflowService.getPluginRules("unknown")).thenThrow(new NoSuchElementException("Not found"));

        assertThrows(NoSuchElementException.class, () -> controller.getPluginRules("unknown"));
        verify(workflowService).getPluginRules("unknown");
    }

    @Test
    void getRulesForSubmissionReturns200() {
        WorkflowRulesDto rules = createRules();

        when(workflowService.getRulesForSubmission("sub-123")).thenReturn(rules);

        ResponseEntity<WorkflowRulesDto> response = controller.getRulesForSubmission("sub-123");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getAuthorAnonymous());
        verify(workflowService).getRulesForSubmission("sub-123");
    }

    @Test
    void getFeedbackFormForSubmissionReturns200() {
        List<com.fh_wedel.workflow.api.model.ReviewQuestion> form = List.of(
                new com.fh_wedel.workflow.api.model.ReviewQuestion("q1", "text", com.fh_wedel.workflow.api.model.QuestionType.TEXT, 0, true, Collections.emptyList())
        );
        when(workflowService.getFeedbackFormForSubmission("sub-123")).thenReturn(form);

        ResponseEntity<List<ReviewQuestionDto>> response = controller.getFeedbackFormForSubmission("sub-123");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("q1", response.getBody().get(0).getId());
    }

    @Test
    void submitReviewReturns200() {
        when(requestContext.getHeader("x-auth-principal-id")).thenReturn("pool123|reviewer-123");

        com.fh_wedel.workflow.api.model.ReviewGrade grade = new com.fh_wedel.workflow.api.model.ReviewGrade(10, 20, 50.0, "Good");
        when(workflowService.submitReview(eq("sub-123"), eq("reviewer-123"), any())).thenReturn(grade);

        SubmitReviewRequest request = new SubmitReviewRequest();
        request.setResponses(new ArrayList<>());

        ResponseEntity<SubmitReviewResponseDto> response = controller.submitReview("sub-123", request);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(10, response.getBody().getTotalPoints());
        assertEquals(20, response.getBody().getMaxPossiblePoints());
    }

    @Test
    void submitReviewReturns401WhenNotAuthenticated() {
        when(requestContext.getHeader("x-auth-principal-id")).thenReturn(null);
        SubmitReviewRequest request = new SubmitReviewRequest();
        request.setResponses(new ArrayList<>());

        ResponseEntity<SubmitReviewResponseDto> response = controller.submitReview("sub-123", request);

        assertEquals(401, response.getStatusCode().value());
    }

    @Test
    void getReviewStatusReturns200() {
        ReviewSession session = new ReviewSession("sub-123", "DOUBLE_BLIND", List.of("rev-1"));
        session.setReceivedReviewCount(1);
        session.setComplete(true);
        when(workflowService.getReviewStatus("sub-123")).thenReturn(session);

        ResponseEntity<ReviewStatusDto> response = controller.getReviewStatus("sub-123");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("sub-123", response.getBody().getSubmissionId());
        assertTrue(response.getBody().getComplete());
    }

    @Test
    void getReviewStatusReturns404IfNotFound() {
        when(workflowService.getReviewStatus("sub-123")).thenReturn(null);

        ResponseEntity<ReviewStatusDto> response = controller.getReviewStatus("sub-123");

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void getReviewsForSubmissionReturns200() throws Exception {
        SubmittedReview review = new SubmittedReview("sub-123", "rev-1", "[]", 10, 20, 50.0, "Summary");
        when(workflowService.getReviewsForSubmission("sub-123")).thenReturn(List.of(review));
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(Collections.emptyList());

        ResponseEntity<List<SubmittedReviewDto>> response = controller.getReviewsForSubmission("sub-123");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("rev-1", response.getBody().get(0).getReviewerId());
    }
}
