package com.fh_wedel.communication.service;

import com.fh_wedel.workflow.client.api.WorkflowRulesApi;
import com.fh_wedel.workflow.client.model.WorkflowRulesDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class WorkflowServiceClient {

    private final WorkflowRulesApi workflowRulesApi;

    public WorkflowServiceClient(WorkflowRulesApi workflowRulesApi) {
        this.workflowRulesApi = workflowRulesApi;
    }

    public WorkflowRulesDto getWorkflowRules(String submissionId) {
        log.info("Calling Workflow Service to get rules for submission: {}", submissionId);
        try {
            return workflowRulesApi.getRulesForSubmission(submissionId);
        } catch (Exception e) {
            log.error("Failed to fetch workflow rules for {}: {}", submissionId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to fetch workflow rules: " + e.getMessage());
        }
    }
}
