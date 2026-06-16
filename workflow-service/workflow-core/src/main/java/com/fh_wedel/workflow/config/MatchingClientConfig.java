package com.fh_wedel.workflow.config;

import com.fh_wedel.matching.client.ApiClient;
import com.fh_wedel.matching.client.api.MatchesApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MatchingClientConfig {

    @Value("${matching.service.url:http://matching.internal.services:8080}")
    private String matchingServiceUrl;

    @Bean
    public ApiClient matchingApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.updateBaseUri(matchingServiceUrl + "/api/matching");
        return apiClient;
    }

    @Bean
    public MatchesApi matchingMatchesApi(ApiClient matchingApiClient) {
        return new MatchesApi(matchingApiClient);
    }
}
