package com.fh_wedel.communication.config;

import com.fh_wedel.matching.client.ApiClient;
import com.fh_wedel.matching.client.api.MatchesApi;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.http.HttpRequest;
import java.util.function.Consumer;

@Configuration
public class ServiceClientsConfig {

    @Value("${aws.matching.service.url:http://matching.internal.services:8081}")
    private String matchingServiceUrl;

    @Value("${aws.workflow.service.url:http://workflow.internal.services:8081}")
    private String workflowServiceUrl;

    private Consumer<HttpRequest.Builder> createAuthInterceptor() {
        return builder -> {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                String username = request.getHeader("x-auth-username");
                if (username != null) builder.header("x-auth-username", username);
                
                String groups = request.getHeader("x-auth-groups");
                if (groups != null) builder.header("x-auth-groups", groups);
                
                String principalId = request.getHeader("x-auth-principal-id");
                if (principalId != null) builder.header("x-auth-principal-id", principalId);
                
                String auth = request.getHeader("Authorization");
                if (auth != null) builder.header("Authorization", auth);
            }
        };
    }

    @Bean
    public ApiClient matchingApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.updateBaseUri(matchingServiceUrl + "/api/matching");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public MatchesApi matchingMatchesApi(ApiClient matchingApiClient) {
        return new MatchesApi(matchingApiClient);
    }

    @Bean
    public com.fh_wedel.workflow.client.ApiClient workflowApiClient() {
        com.fh_wedel.workflow.client.ApiClient apiClient = new com.fh_wedel.workflow.client.ApiClient();
        apiClient.updateBaseUri(workflowServiceUrl + "/api/workflow");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public com.fh_wedel.workflow.client.api.WorkflowRulesApi workflowRulesApi(com.fh_wedel.workflow.client.ApiClient workflowApiClient) {
        return new com.fh_wedel.workflow.client.api.WorkflowRulesApi(workflowApiClient);
    }
}
