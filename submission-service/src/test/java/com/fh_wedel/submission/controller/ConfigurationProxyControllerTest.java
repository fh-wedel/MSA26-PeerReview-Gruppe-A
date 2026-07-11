package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.service.ConfigurationServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ConfigurationProxyControllerTest {

    @Mock
    private ConfigurationServiceClient configurationServiceClient;

    @InjectMocks
    private ConfigurationProxyController controller;

    @Test
    void createConfiguration_success() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("x-auth-username")).thenReturn("test-user");
        when(request.getHeader("x-auth-groups")).thenReturn("test-group");
        when(request.getHeader("x-auth-principal-id")).thenReturn("test-principal");

        when(configurationServiceClient.createConfiguration("test-body", "test-user", "test-group", "test-principal"))
                .thenReturn("{\"id\":\"config-1\"}");

        ResponseEntity<String> response = controller.createConfiguration("test-body", request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isEqualTo("{\"id\":\"config-1\"}");
    }

    @Test
    void getGradingForm_success() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("x-auth-username")).thenReturn("test-user");
        when(request.getHeader("x-auth-groups")).thenReturn("test-group");
        when(request.getHeader("x-auth-principal-id")).thenReturn("test-principal");

        when(configurationServiceClient.getGradingForm("config-1", "test-user", "test-group", "test-principal"))
                .thenReturn("{\"form\":\"data\"}");

        ResponseEntity<String> response = controller.getGradingForm("config-1", request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("{\"form\":\"data\"}");
    }
}
