package com.fh_wedel.workflow.service;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.model.WorkflowPluginDto;
import com.fh_wedel.workflow.model.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.WorkflowPluginRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowPluginRegistry registry;

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

    private WorkflowPluginDto toDto(ReviewWorkflowPlugin plugin) {
        return new WorkflowPluginDto(
            plugin.getName(),
            plugin.getDescription(),
            toRulesDto(plugin)
        );
    }

    private WorkflowRulesDto toRulesDto(ReviewWorkflowPlugin plugin) {
        return new WorkflowRulesDto(
            plugin.isAuthorAnonymous(),
            plugin.isReviewerAnonymous(),
            plugin.isReviewerToReviewerAnonymous(),
            plugin.isAuthorReviewerChatAllowed(),
            plugin.isReviewerToReviewerChatAllowed()
        );
    }
}
