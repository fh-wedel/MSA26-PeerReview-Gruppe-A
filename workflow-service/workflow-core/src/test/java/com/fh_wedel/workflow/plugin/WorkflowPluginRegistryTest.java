package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowPluginRegistryTest {

    private WorkflowPluginRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new WorkflowPluginRegistry();
    }

    @Test
    void discoversTestPluginViaSpi() {
        assertNotNull(registry);
        assertTrue(registry.exists("test-plugin"), "Registry should discover 'test-plugin' via ServiceLoader");
    }

    @Test
    void getByNameReturnsPlugin() {
        Optional<ReviewWorkflowPlugin> pluginOpt = registry.getByName("test-plugin");
        assertTrue(pluginOpt.isPresent());
        
        ReviewWorkflowPlugin plugin = pluginOpt.get();
        assertEquals("test-plugin", plugin.getName());
        assertEquals("Test Plugin", plugin.getTitle());
        assertEquals("A test plugin for unit testing", plugin.getDescription());
        assertTrue(plugin.isAuthorAnonymous());
        assertFalse(plugin.isReviewerAnonymous());
        assertFalse(plugin.isAuthorReviewerChatAllowed());
    }

    @Test
    void getByNameReturnsEmptyForUnknown() {
        Optional<ReviewWorkflowPlugin> pluginOpt = registry.getByName("nonexistent");
        assertFalse(pluginOpt.isPresent());
    }

    @Test
    void existsReturnsTrueForKnownPlugin() {
        assertTrue(registry.exists("test-plugin"));
    }

    @Test
    void existsReturnsFalseForUnknownPlugin() {
        assertFalse(registry.exists("nonexistent"));
    }

    @Test
    void getAllReturnsAllPlugins() {
        Collection<ReviewWorkflowPlugin> allPlugins = registry.getAll();
        assertNotNull(allPlugins);
        assertFalse(allPlugins.isEmpty());
        boolean hasTestPlugin = allPlugins.stream()
                .anyMatch(p -> "test-plugin".equals(p.getName()));
        assertTrue(hasTestPlugin, "All plugins list should contain 'test-plugin'");
    }
}
