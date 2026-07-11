package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClientBuilder;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BedrockAiServiceTest {

    @Mock
    private BedrockRuntimeClient bedrockClient;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Successfully generates review")
    void generateReview_success() {
        try (MockedStatic<BedrockRuntimeClient> mockedStatic = mockStatic(BedrockRuntimeClient.class)) {
            BedrockRuntimeClientBuilder builderMock = mock(BedrockRuntimeClientBuilder.class);
            mockedStatic.when(BedrockRuntimeClient::builder).thenReturn(builderMock);
            when(builderMock.build()).thenReturn(bedrockClient);

            BedrockAiService service = new BedrockAiService(objectMapper);

            String responsePayload = "{\"content\": [{\"text\": \"{\\\"review\\\": \\\"good\\\"}\"}]}";
            InvokeModelResponse response = InvokeModelResponse.builder()
                    .body(SdkBytes.fromUtf8String(responsePayload))
                    .build();
            when(bedrockClient.invokeModel(any(InvokeModelRequest.class))).thenReturn(response);

            String result = service.generateReview("{}", new byte[]{1, 2, 3});

            assertThat(result).isEqualTo("{\"review\": \"good\"}");

            ArgumentCaptor<InvokeModelRequest> captor = ArgumentCaptor.forClass(InvokeModelRequest.class);
            verify(bedrockClient).invokeModel(captor.capture());
            InvokeModelRequest request = captor.getValue();
            assertThat(request.body().asUtf8String()).contains("bedrock-2023-05-31");
        }
    }

    @Test
    @DisplayName("Strips markdown wrapper from response")
    void generateReview_stripsMarkdown() {
        try (MockedStatic<BedrockRuntimeClient> mockedStatic = mockStatic(BedrockRuntimeClient.class)) {
            BedrockRuntimeClientBuilder builderMock = mock(BedrockRuntimeClientBuilder.class);
            mockedStatic.when(BedrockRuntimeClient::builder).thenReturn(builderMock);
            when(builderMock.build()).thenReturn(bedrockClient);

            BedrockAiService service = new BedrockAiService(objectMapper);

            String responsePayload = "{\"content\": [{\"text\": \"```json\\n{\\\"review\\\": \\\"good\\\"}\\n```\"}]}";
            InvokeModelResponse response = InvokeModelResponse.builder()
                    .body(SdkBytes.fromUtf8String(responsePayload))
                    .build();
            when(bedrockClient.invokeModel(any(InvokeModelRequest.class))).thenReturn(response);

            String result = service.generateReview("{}", new byte[]{1, 2, 3});

            assertThat(result).isEqualTo("{\"review\": \"good\"}");
        }
    }

    @Test
    @DisplayName("Throws exception if no content returned")
    void generateReview_noContent() {
        try (MockedStatic<BedrockRuntimeClient> mockedStatic = mockStatic(BedrockRuntimeClient.class)) {
            BedrockRuntimeClientBuilder builderMock = mock(BedrockRuntimeClientBuilder.class);
            mockedStatic.when(BedrockRuntimeClient::builder).thenReturn(builderMock);
            when(builderMock.build()).thenReturn(bedrockClient);

            BedrockAiService service = new BedrockAiService(objectMapper);

            String responsePayload = "{\"content\": []}";
            InvokeModelResponse response = InvokeModelResponse.builder()
                    .body(SdkBytes.fromUtf8String(responsePayload))
                    .build();
            when(bedrockClient.invokeModel(any(InvokeModelRequest.class))).thenReturn(response);

            assertThatThrownBy(() -> service.generateReview("{}", new byte[]{1, 2, 3}))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to generate AI Review")
                    .hasCauseInstanceOf(RuntimeException.class);
        }
    }
}
