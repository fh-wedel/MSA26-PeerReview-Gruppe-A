package com.fh_wedel.workflow.controller;

import com.fh_wedel.workflow.model.api.WorkflowPluginDto;
import com.fh_wedel.workflow.model.api.WorkflowRulesDto;
import com.fh_wedel.workflow.service.WorkflowService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkflowController.class)
class WorkflowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkflowService workflowService;

    private WorkflowRulesDto createRules() {
        WorkflowRulesDto rules = new WorkflowRulesDto();
        rules.setAuthorAnonymous(true);
        rules.setReviewerAnonymous(false);
        rules.setReviewerToReviewerAnonymous(true);
        rules.setAuthorReviewerChatAllowed(false);
        rules.setReviewerToReviewerChatAllowed(true);
        return rules;
    }

    private WorkflowPluginDto createPlugin(String name, String title, String description, WorkflowRulesDto rules) {
        WorkflowPluginDto plugin = new WorkflowPluginDto();
        plugin.setName(name);
        plugin.setTitle(title);
        plugin.setDescription(description);
        plugin.setRules(rules);
        return plugin;
    }

    @Test
    void listPluginsReturns200() throws Exception {
        WorkflowRulesDto rules = createRules();
        WorkflowPluginDto plugin1 = createPlugin("plugin-1", "Plugin 1", "description 1", rules);
        WorkflowPluginDto plugin2 = createPlugin("plugin-2", "Plugin 2", "description 2", rules);
        
        when(workflowService.listPlugins()).thenReturn(List.of(plugin1, plugin2));

        mockMvc.perform(get("/api/workflow/plugins"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("plugin-1"))
                .andExpect(jsonPath("$[1].name").value("plugin-2"));

        verify(workflowService).listPlugins();
    }

    @Test
    void getPluginReturns200() throws Exception {
        WorkflowRulesDto rules = createRules();
        WorkflowPluginDto plugin = createPlugin("plugin-1", "Plugin 1", "description 1", rules);

        when(workflowService.getPlugin("plugin-1")).thenReturn(plugin);

        mockMvc.perform(get("/api/workflow/plugins/plugin-1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("plugin-1"))
                .andExpect(jsonPath("$.description").value("description 1"))
                .andExpect(jsonPath("$.rules.authorAnonymous").value(true));

        verify(workflowService).getPlugin("plugin-1");
    }

    @Test
    void getPluginReturns404ForUnknown() throws Exception {
        when(workflowService.getPlugin("unknown")).thenThrow(new NoSuchElementException("Not found"));

        mockMvc.perform(get("/api/workflow/plugins/unknown"))
                .andExpect(status().isNotFound());

        verify(workflowService).getPlugin("unknown");
    }

    @Test
    void getPluginRulesReturns200() throws Exception {
        WorkflowRulesDto rules = createRules();

        when(workflowService.getPluginRules("plugin-1")).thenReturn(rules);

        mockMvc.perform(get("/api/workflow/plugins/plugin-1/rules"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.authorAnonymous").value(true))
                .andExpect(jsonPath("$.reviewerAnonymous").value(false));

        verify(workflowService).getPluginRules("plugin-1");
    }

    @Test
    void getPluginRulesReturns404ForUnknown() throws Exception {
        when(workflowService.getPluginRules("unknown")).thenThrow(new NoSuchElementException("Not found"));

        mockMvc.perform(get("/api/workflow/plugins/unknown/rules"))
                .andExpect(status().isNotFound());

        verify(workflowService).getPluginRules("unknown");
    }

    @Test
    void getRulesForSubmissionReturns200() throws Exception {
        WorkflowRulesDto rules = createRules();

        when(workflowService.getRulesForSubmission("sub-123")).thenReturn(rules);

        mockMvc.perform(get("/api/workflow/submissions/sub-123/rules"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.authorAnonymous").value(true))
                .andExpect(jsonPath("$.reviewerAnonymous").value(false));

        verify(workflowService).getRulesForSubmission("sub-123");
    }
}
