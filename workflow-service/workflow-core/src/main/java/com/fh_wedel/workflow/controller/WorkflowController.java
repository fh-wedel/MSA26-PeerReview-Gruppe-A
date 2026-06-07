package com.fh_wedel.workflow.controller;

import com.fh_wedel.workflow.api.WorkflowPluginsApi;
import com.fh_wedel.workflow.api.WorkflowRulesApi;
import com.fh_wedel.workflow.model.api.WorkflowPluginDto;
import com.fh_wedel.workflow.model.api.WorkflowRulesDto;
import com.fh_wedel.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@org.springframework.web.bind.annotation.RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController implements WorkflowPluginsApi, WorkflowRulesApi {

    private final WorkflowService workflowService;

    @Override
    public ResponseEntity<List<WorkflowPluginDto>> listPlugins() {
        return ResponseEntity.ok(workflowService.listPlugins());
    }

    @Override
    public ResponseEntity<WorkflowPluginDto> getPlugin(String pluginName) {
        return ResponseEntity.ok(workflowService.getPlugin(pluginName));
    }

    @Override
    public ResponseEntity<WorkflowRulesDto> getPluginRules(String pluginName) {
        return ResponseEntity.ok(workflowService.getPluginRules(pluginName));
    }

    @Override
    public ResponseEntity<WorkflowRulesDto> getRulesForSubmission(String submissionId) {
        return ResponseEntity.ok(workflowService.getRulesForSubmission(submissionId));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.notFound().build();
    }
}
