package com.fh_wedel.submission.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;

class ConfigurationServiceClientTest {

    private ConfigurationServiceClient client;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();
        client = new ConfigurationServiceClient(restClient, "http://configuration-service:8080");
    }

    @Test
    void createConfiguration_success() {
        server.expect(requestTo("http://configuration-service:8080/api/configuration/submissions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-auth-username", "test-user"))
                .andExpect(header("x-auth-groups", "test-group"))
                .andExpect(header("x-auth-principal-id", "test-principal"))
                .andExpect(content().string("test-body"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess("response-body", MediaType.APPLICATION_JSON));

        String result = client.createConfiguration("test-body", "test-user", "test-group", "test-principal");

        assertThat(result).isEqualTo("response-body");
    }

    @Test
    void getGradingForm_success() {
        server.expect(requestTo("http://configuration-service:8080/api/configuration/submissions/config-1"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("x-auth-username", "test-user"))
                .andExpect(header("x-auth-groups", "test-group"))
                .andExpect(header("x-auth-principal-id", "test-principal"))
                .andRespond(withSuccess("form-data", MediaType.APPLICATION_JSON));

        String result = client.getGradingForm("config-1", "test-user", "test-group", "test-principal");

        assertThat(result).isEqualTo("form-data");
    }

    @Test
    void getConfiguration_success() {
        String json = "{\"submissionId\":\"config-1\",\"title\":\"Test Config\"}";
        server.expect(requestTo("http://configuration-service:8080/api/configuration/submissions/config-1"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        com.fh_wedel.submission.model.SubmissionConfiguration result = client.getConfiguration("config-1");

        assertThat(result).isNotNull();
        assertThat(result.getSubmissionId()).isEqualTo("config-1");
        assertThat(result.getTitle()).isEqualTo("Test Config");
    }

    @Test
    void getConfiguration_error() {
        server.expect(requestTo("http://configuration-service:8080/api/configuration/submissions/config-1"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withServerError());

        com.fh_wedel.submission.model.SubmissionConfiguration result = client.getConfiguration("config-1");

        assertThat(result).isNull();
    }
}
