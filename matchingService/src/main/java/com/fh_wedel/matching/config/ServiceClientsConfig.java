package com.fh_wedel.matching.config;

import com.fh_wedel.user.client.ApiClient;
import com.fh_wedel.user.client.api.UsersApi;
import com.fh_wedel.user.client.api.GroupsApi;
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

    @Value("${aws.user-service.url:http://user.internal.services:8081}")
    private String userServiceUrl;

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
    public ApiClient userApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.updateBaseUri(userServiceUrl + "/api/users");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public UsersApi usersApi(ApiClient userApiClient) {
        return new UsersApi(userApiClient);
    }

    @Bean
    public GroupsApi groupsApi(ApiClient userApiClient) {
        return new GroupsApi(userApiClient);
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
