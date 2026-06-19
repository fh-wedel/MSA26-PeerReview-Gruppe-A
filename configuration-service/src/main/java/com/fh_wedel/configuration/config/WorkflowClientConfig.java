package com.fh_wedel.configuration.config;

import com.fh_wedel.workflow.client.ApiClient;
import com.fh_wedel.workflow.client.api.WorkflowPluginsApi;
import com.fh_wedel.workflow.client.api.WorkflowRulesApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WorkflowClientConfig {

    @Value("${workflow.service.url:http://workflow-service.internal.services:8080}")
    private String workflowServiceUrl;

    @Bean
    public ApiClient workflowApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.updateBaseUri(workflowServiceUrl + "/api/workflow");
        return apiClient;
    }

    @Bean
    public WorkflowRulesApi workflowRulesApi(ApiClient workflowApiClient) {
        return new WorkflowRulesApi(workflowApiClient);
    }

    @Bean
    public WorkflowPluginsApi workflowPluginsApi(ApiClient workflowApiClient) {
        return new WorkflowPluginsApi(workflowApiClient);
    }
}
