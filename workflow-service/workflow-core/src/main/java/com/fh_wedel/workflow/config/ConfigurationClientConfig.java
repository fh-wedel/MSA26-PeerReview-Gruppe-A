package com.fh_wedel.workflow.config;

import com.fh_wedel.configuration.client.ApiClient;
import com.fh_wedel.configuration.client.api.DefaultApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfigurationClientConfig {

    @Value("${configuration.service.url:http://configuration.internal.services:8080}")
    private String configurationServiceUrl;

    @Bean
    public ApiClient configurationApiClient() {
        ApiClient apiClient = new ApiClient();
        apiClient.updateBaseUri(configurationServiceUrl + "/api/configuration");
        return apiClient;
    }

    @Bean
    public DefaultApi configurationDefaultApi(ApiClient configurationApiClient) {
        return new DefaultApi(configurationApiClient);
    }
}
