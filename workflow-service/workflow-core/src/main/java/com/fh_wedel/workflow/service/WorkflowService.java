package com.fh_wedel.workflow.service;

import com.fh_wedel.configuration.client.api.DefaultApi;
import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.model.api.WorkflowPluginDto;
import com.fh_wedel.workflow.model.api.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.WorkflowPluginRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowPluginRegistry registry;
    private final DefaultApi configurationApi;

    public List<WorkflowPluginDto> listPlugins() {
        return registry.getAll().stream()
            .map(this::toDto)
            .toList();
    }

    public WorkflowPluginDto getPlugin(String name) {
        return registry.getByName(name)
            .map(this::toDto)
            .orElseThrow(() -> new NoSuchElementException("Workflow plugin not found: " + name));
    }

    public WorkflowRulesDto getPluginRules(String name) {
        return registry.getByName(name)
            .map(this::toRulesDto)
            .orElseThrow(() -> new NoSuchElementException("Workflow plugin not found: " + name));
    }

    public WorkflowRulesDto getRulesForSubmission(String submissionId) {
        try {
            com.fh_wedel.configuration.client.model.ModelConfiguration config = configurationApi.submissionIdGet(submissionId);
            String workflowName = config.getReviewProcessType();
            return getPluginRules(workflowName);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to fetch configuration for submission: " + submissionId, e);
        }
    }

    private WorkflowPluginDto toDto(ReviewWorkflowPlugin plugin) {
        WorkflowPluginDto dto = new WorkflowPluginDto();
        dto.setName(plugin.getName());
        dto.setTitle(plugin.getTitle());
        dto.setDescription(plugin.getDescription());
        dto.setRules(toRulesDto(plugin));
        return dto;
    }

    private WorkflowRulesDto toRulesDto(ReviewWorkflowPlugin plugin) {
        WorkflowRulesDto dto = new WorkflowRulesDto();
        dto.setAuthorAnonymous(plugin.isAuthorAnonymous());
        dto.setReviewerAnonymous(plugin.isReviewerAnonymous());
        dto.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());
        return dto;
    }
}
