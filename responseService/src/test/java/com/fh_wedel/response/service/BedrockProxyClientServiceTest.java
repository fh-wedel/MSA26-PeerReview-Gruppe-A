package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BedrockProxyClientServiceTest {

    @Mock
    private LambdaClient lambdaClient;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Successfully generates review via Lambda")
    void generateReview_success() {
        BedrockProxyClientService service = new BedrockProxyClientService(lambdaClient, objectMapper, "my-lambda", "my-bucket");

        String responsePayload = "{\"generatedReviewJson\": \"{ \\\"review\\\": \\\"good\\\" }\"}";
        InvokeResponse invokeResponse = InvokeResponse.builder()
                .payload(SdkBytes.fromUtf8String(responsePayload))
                .build();
        when(lambdaClient.invoke(any(InvokeRequest.class))).thenReturn(invokeResponse);

        String result = service.generateReview("sub-1", "rev-1", "{}", "docs/sub-1.pdf");

        assertThat(result).isEqualTo("{ \"review\": \"good\" }");

        ArgumentCaptor<InvokeRequest> captor = ArgumentCaptor.forClass(InvokeRequest.class);
        verify(lambdaClient).invoke(captor.capture());
        InvokeRequest request = captor.getValue();
        assertThat(request.functionName()).isEqualTo("my-lambda");
        assertThat(request.payload().asUtf8String()).contains("sub-1").contains("rev-1").contains("my-bucket");
    }

    @Test
    @DisplayName("Throws exception if Lambda name is not configured")
    void generateReview_missingLambdaName() {
        BedrockProxyClientService service = new BedrockProxyClientService(lambdaClient, objectMapper, "", "my-bucket");

        assertThatThrownBy(() -> service.generateReview("sub-1", "rev-1", "{}", "docs/sub-1.pdf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Lambda name is not configured");
    }

    @Test
    @DisplayName("Throws exception if Lambda returns an error")
    void generateReview_lambdaError() {
        BedrockProxyClientService service = new BedrockProxyClientService(lambdaClient, objectMapper, "my-lambda", "my-bucket");

        InvokeResponse invokeResponse = InvokeResponse.builder()
                .functionError("Unhandled")
                .payload(SdkBytes.fromUtf8String("{\"errorMessage\": \"Lambda failed\"}"))
                .build();
        when(lambdaClient.invoke(any(InvokeRequest.class))).thenReturn(invokeResponse);

        assertThatThrownBy(() -> service.generateReview("sub-1", "rev-1", "{}", "docs/sub-1.pdf"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to generate AI review")
                .hasCauseInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("Throws exception if response has no review payload")
    void generateReview_noReviewPayload() {
        BedrockProxyClientService service = new BedrockProxyClientService(lambdaClient, objectMapper, "my-lambda", "my-bucket");

        String responsePayload = "{}";
        InvokeResponse invokeResponse = InvokeResponse.builder()
                .payload(SdkBytes.fromUtf8String(responsePayload))
                .build();
        when(lambdaClient.invoke(any(InvokeRequest.class))).thenReturn(invokeResponse);

        assertThatThrownBy(() -> service.generateReview("sub-1", "rev-1", "{}", "docs/sub-1.pdf"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to generate AI review")
                .hasCauseInstanceOf(IllegalStateException.class);
    }
}
