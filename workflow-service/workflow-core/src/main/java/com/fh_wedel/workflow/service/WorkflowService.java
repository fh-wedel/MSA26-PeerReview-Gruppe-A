package com.fh_wedel.workflow.service;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.model.WorkflowPluginDto;
import com.fh_wedel.workflow.model.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.WorkflowPluginRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowPluginRegistry registry;
    private final Random random = new Random();

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
        // TODO: Call configuration service via REST to get the workflow type for this submission.
        // Since the configuration service does not exist yet, we return a random workflow type.
        String[] workflows = {"open-review", "single-blind", "double-blind"};
        String randomWorkflow = workflows[random.nextInt(workflows.length)];
        return getPluginRules(randomWorkflow);
    }

    private WorkflowPluginDto toDto(ReviewWorkflowPlugin plugin) {
        return new WorkflowPluginDto(
            plugin.getName(),
            plugin.getTitle(),
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
