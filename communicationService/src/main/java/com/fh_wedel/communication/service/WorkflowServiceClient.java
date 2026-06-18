package com.fh_wedel.communication.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkflowServiceClient {

    private static final Logger log = LoggerFactory.getLogger(WorkflowServiceClient.class);
    private final RestClient restClient;

    public WorkflowServiceClient(@Value("${aws.workflow-service.url:http://workflow.internal.services:8081}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public static class WorkflowRulesDto {
        public boolean authorAnonymous;
        public boolean reviewerAnonymous;
        public boolean authorReviewerChatAllowed;
    }

    public WorkflowRulesDto getWorkflowRules(String submissionId, String authHeader) {
        log.info("Calling Workflow Service to get rules for submission: {}", submissionId);
        try {
            return restClient.get()
                    .uri("/api/workflow/submissions/{submissionId}/rules", submissionId)
                    .header("Authorization", authHeader)
                    .retrieve()
                    .body(WorkflowRulesDto.class);
        } catch (Exception e) {
            log.error("Failed to fetch workflow rules for {}: {}", submissionId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to fetch workflow rules: " + e.getMessage());
        }
    }
}
