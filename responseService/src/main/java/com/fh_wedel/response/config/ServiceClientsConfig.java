package com.fh_wedel.response.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.http.HttpRequest;
import java.util.function.Consumer;

/**
 * Wires the generated REST clients the response service uses to enrich a stored
 * review result with information owned by neighbouring services:
 * <ul>
 *   <li><b>workflow</b> — the grading schema (feedback form) a submission was reviewed by</li>
 *   <li><b>matching</b> — the examiner assigned to the submission</li>
 *   <li><b>configuration</b> — the review deadline (end date)</li>
 * </ul>
 *
 * <p>The enrichment happens inside the SQS listener thread, which has no inbound
 * HTTP request to forward auth headers from. In that case the interceptor falls
 * back to acting as a system admin (mirrors {@code matchingService}'s pattern),
 * so the downstream {@code @PreAuthorize} checks pass.
 *
 * <p>Service URLs follow the ECS Service Connect AAAA-record pattern
 * {@code http://<service>.internal.services:<port>} and are injected as env vars
 * by the CDK stack; the defaults here are for local runs only.
 */
@Configuration
public class ServiceClientsConfig {


    @Value("${aws.matching-service.url:http://matching.internal.services:8081}")
    private String matchingServiceUrl;

    @Value("${aws.configuration-service.url:http://configuration.internal.services:8080}")
    private String configurationServiceUrl;

    private Consumer<HttpRequest.Builder> createAuthInterceptor() {
        return builder -> {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
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
                // Background SQS task: act as a system admin so downstream ABAC passes.
                builder.header("x-auth-username", "system-response-service");
                builder.header("x-auth-groups", "Admin");
            }
        };
    }

    // ── Configuration client (grading schema / feedback form) ──────────────────

    @Bean
    public com.fh_wedel.configuration.client.api.SubmissionReviewsApi submissionReviewsApi(
            com.fh_wedel.configuration.client.ApiClient configurationApiClient) {
        return new com.fh_wedel.configuration.client.api.SubmissionReviewsApi(configurationApiClient);
    }

    // ── Matching client (examiner) ────────────────────────────────────────

    @Bean
    public com.fh_wedel.matching.client.ApiClient matchingApiClient() {
        com.fh_wedel.matching.client.ApiClient apiClient = new com.fh_wedel.matching.client.ApiClient();
        apiClient.updateBaseUri(matchingServiceUrl + "/api/matching");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public com.fh_wedel.matching.client.api.MatchesApi matchesApi(
            com.fh_wedel.matching.client.ApiClient matchingApiClient) {
        return new com.fh_wedel.matching.client.api.MatchesApi(matchingApiClient);
    }

    // ── Configuration client (review deadline / end date) ─────────────────

    @Bean
    public com.fh_wedel.configuration.client.ApiClient configurationApiClient() {
        com.fh_wedel.configuration.client.ApiClient apiClient = new com.fh_wedel.configuration.client.ApiClient();
        apiClient.updateBaseUri(configurationServiceUrl + "/api/configuration");
        apiClient.setRequestInterceptor(createAuthInterceptor());
        return apiClient;
    }

    @Bean
    public com.fh_wedel.configuration.client.api.SubmissionsApi submissionsApi(
            com.fh_wedel.configuration.client.ApiClient configurationApiClient) {
        return new com.fh_wedel.configuration.client.api.SubmissionsApi(configurationApiClient);
    }
}
