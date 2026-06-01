package com.fh_wedel.workflow.service;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.model.WorkflowPluginDto;
import com.fh_wedel.workflow.model.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.WorkflowPluginRegistry;
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
    private WorkflowPluginRegistry registry;

    @InjectMocks
    private WorkflowService service;

    private ReviewWorkflowPlugin createMockPlugin(String name) {
        ReviewWorkflowPlugin plugin = mock(ReviewWorkflowPlugin.class);
        lenient().when(plugin.getName()).thenReturn(name);
        lenient().when(plugin.getDescription()).thenReturn(name + " description");
        lenient().when(plugin.getTitle()).thenReturn(name + " title");
        lenient().when(plugin.isAuthorAnonymous()).thenReturn(true);
        lenient().when(plugin.isReviewerAnonymous()).thenReturn(false);
        lenient().when(plugin.isReviewerToReviewerAnonymous()).thenReturn(true);
        lenient().when(plugin.isAuthorReviewerChatAllowed()).thenReturn(false);
        lenient().when(plugin.isReviewerToReviewerChatAllowed()).thenReturn(true);
        return plugin;
    }

    @Test
    void listPluginsReturnsAllPlugins() {
        ReviewWorkflowPlugin mock1 = createMockPlugin("plugin-1");
        ReviewWorkflowPlugin mock2 = createMockPlugin("plugin-2");
        when(registry.getAll()).thenReturn(List.of(mock1, mock2));

        List<WorkflowPluginDto> result = service.listPlugins();

        assertEquals(2, result.size());
        assertEquals("plugin-1", result.get(0).name());
        assertEquals("plugin-2", result.get(1).name());
        verify(registry).getAll();
    }

    @Test
    void getPluginReturnsDto() {
        ReviewWorkflowPlugin mockPlugin = createMockPlugin("plugin-1");
        when(registry.getByName("plugin-1")).thenReturn(Optional.of(mockPlugin));

        WorkflowPluginDto result = service.getPlugin("plugin-1");

        assertNotNull(result);
        assertEquals("plugin-1", result.name());
        assertEquals("plugin-1 description", result.description());
        assertTrue(result.rules().authorAnonymous());
        assertFalse(result.rules().reviewerAnonymous());
        verify(registry).getByName("plugin-1");
    }

    @Test
    void getPluginThrowsForUnknown() {
        when(registry.getByName("unknown")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> service.getPlugin("unknown"));
        verify(registry).getByName("unknown");
    }

    @Test
    void getPluginRulesReturnsCorrectValues() {
        ReviewWorkflowPlugin mockPlugin = createMockPlugin("plugin-1");
        when(registry.getByName("plugin-1")).thenReturn(Optional.of(mockPlugin));

        WorkflowRulesDto result = service.getPluginRules("plugin-1");

        assertNotNull(result);
        assertTrue(result.authorAnonymous());
        assertFalse(result.reviewerAnonymous());
        assertTrue(result.reviewerToReviewerAnonymous());
        assertFalse(result.authorReviewerChatAllowed());
        assertTrue(result.reviewerToReviewerChatAllowed());
        verify(registry).getByName("plugin-1");
    }

    @Test
    void getPluginRulesThrowsForUnknown() {
        when(registry.getByName("unknown")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> service.getPluginRules("unknown"));
        verify(registry).getByName("unknown");
    }
}
