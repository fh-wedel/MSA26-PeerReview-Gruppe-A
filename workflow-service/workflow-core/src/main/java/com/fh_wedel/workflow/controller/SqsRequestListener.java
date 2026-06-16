package com.fh_wedel.workflow.controller;

import com.fh_wedel.configuration.client.ApiException;
import com.fh_wedel.configuration.client.api.DefaultApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.workflow.model.SubmissionReadyEvent;
import com.fh_wedel.workflow.service.MatchingServiceClient;
import com.fh_wedel.workflow.service.WorkflowService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnExpression("!'${aws.sqs.workflow-request-queue-name:}'.isEmpty()")
public class SqsRequestListener {

    private final WorkflowService workflowService;
    private final MatchingServiceClient matchingServiceClient;
    private final DefaultApi configurationApi;

    @SqsListener("${aws.sqs.workflow-request-queue-name}")
    public void handleSubmissionReadyEvent(SubmissionReadyEvent event) throws ApiException {
        log.info("Received SubmissionReadyEvent for submission: {}", event.getSubmissionId());

        try {
            // 1. Fetch config to get the plugin name
            ModelConfiguration config = configurationApi.submissionIdGet(event.getSubmissionId());
            if (config == null) {
                log.error("Could not find configuration for submission: {}", event.getSubmissionId());
                return;
            }
            String pluginName = config.getReviewProcessType();

            // 2. Fetch matched reviewers from Matching Service
            List<String> reviewerIds = matchingServiceClient.getMatchedReviewers(event.getSubmissionId());
            if (reviewerIds == null || reviewerIds.isEmpty()) {
                log.warn("No matched reviewers found for submission: {}", event.getSubmissionId());
                // Still initialize session, just with 0 reviewers, or wait for another event?
                // The architecture implies we setup the session with whoever matched.
            }

            // 3. Initialize review session
            workflowService.initializeReviewSession(event.getSubmissionId(), pluginName, reviewerIds);

            log.info("Successfully initialized review session for submission: {}", event.getSubmissionId());
        } catch (Exception e) {
            log.error("Failed to process SubmissionReadyEvent for submission: {}", event.getSubmissionId(), e);
            throw e; // rethrow to retry or go to DLQ
        }
    }
}
