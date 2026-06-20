package com.fh_wedel.matching.config;

import com.fh_wedel.user.client.ApiClient;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.api.UsersApi;
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

    @Value("${aws.configuration.service.url:http://configuration.internal.services:8080}")
    private String configurationServiceUrl;

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
            } else {
                // Background SQS task: act as a system admin
                builder.header("x-auth-username", "system-matching-service");
                builder.header("x-auth-groups", "Admin");
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
    public com.fh_wedel.configuration.client.ApiClient configurationApiClient() {
        com.fh_wedel.configuration.client.ApiClient apiClient = new com.fh_wedel.configuration.client.ApiClient();
        apiClient.updateBaseUri(configurationServiceUrl + "/api/configuration");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public com.fh_wedel.configuration.client.api.SubmissionRulesApi configurationRulesApi(com.fh_wedel.configuration.client.ApiClient configurationApiClient) {
        return new com.fh_wedel.configuration.client.api.SubmissionRulesApi(configurationApiClient);
    }
}
