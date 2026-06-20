package com.fh_wedel.submission.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Slf4j
public class ConfigurationServiceClient {

    private final RestClient restClient;
    private final String configurationServiceUrl;

    public ConfigurationServiceClient(RestClient restClient,
                                      @Value("${services.configuration.url}") String configurationServiceUrl) {
        this.restClient = restClient;
        this.configurationServiceUrl = configurationServiceUrl;
    }

    public String createConfiguration(String requestBody, String username, String groups, String principalId) {
        log.info("Proxying POST /api/configuration/submissions to configuration-service");

        return restClient.post()
                .uri(configurationServiceUrl + "/api/configuration/submissions")
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-auth-username", username)
                .header("x-auth-groups", groups)
                .header("x-auth-principal-id", principalId)
                .body(requestBody)
                .retrieve()
                .body(String.class);
    }

    public String getGradingForm(String configurationId, String username, String groups, String principalId) {
        log.info("Proxying GET /api/configuration/submissions/{} to configuration-service", configurationId);

        return restClient.get()
                .uri(configurationServiceUrl + "/api/configuration/submissions/" + configurationId)
                .header("x-auth-username", username)
                .header("x-auth-groups", groups)
                .header("x-auth-principal-id", principalId)
                .retrieve()
                .body(String.class);
    }

    public com.fh_wedel.submission.model.SubmissionConfiguration getConfiguration(String submissionId) {
        log.info("Fetching configuration for submission {} from configuration-service", submissionId);
        try {
            return restClient.get()
                    .uri(configurationServiceUrl + "/api/configuration/submissions/" + submissionId)
                    .retrieve()
                    .body(com.fh_wedel.submission.model.SubmissionConfiguration.class);
        } catch (Exception e) {
            log.error("Failed to fetch configuration for submission {}", submissionId, e);
            return null;
        }
    }
}
