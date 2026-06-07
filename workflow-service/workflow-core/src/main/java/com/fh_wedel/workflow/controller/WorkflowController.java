package com.fh_wedel.workflow.controller;

import com.fh_wedel.workflow.model.WorkflowPluginDto;
import com.fh_wedel.workflow.model.WorkflowRulesDto;
import com.fh_wedel.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping("/plugins")
    public ResponseEntity<List<WorkflowPluginDto>> listPlugins() {
        return ResponseEntity.ok(workflowService.listPlugins());
    }

    @GetMapping("/plugins/{pluginName}")
    public ResponseEntity<WorkflowPluginDto> getPlugin(@PathVariable String pluginName) {
        return ResponseEntity.ok(workflowService.getPlugin(pluginName));
    }

    @GetMapping("/plugins/{pluginName}/rules")
    public ResponseEntity<WorkflowRulesDto> getPluginRules(@PathVariable String pluginName) {
        return ResponseEntity.ok(workflowService.getPluginRules(pluginName));
    }

    @GetMapping("/submissions/{submissionId}/rules")
    public ResponseEntity<WorkflowRulesDto> getRulesForSubmission(@PathVariable String submissionId) {
        return ResponseEntity.ok(workflowService.getRulesForSubmission(submissionId));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.notFound().build();
    }
}
