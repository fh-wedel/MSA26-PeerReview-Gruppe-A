package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class BedrockAiService {

    private final BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;
    
    // AWS Bedrock Model ID for Claude 3.5 Sonnet
    private static final String MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";

    public BedrockAiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        // The default client uses the region from the environment/profile
        this.bedrockClient = BedrockRuntimeClient.builder()
                .dualstackEnabled(true)
                .build();
    }

    /**
     * Calls AWS Bedrock (Claude 3.5 Sonnet) to generate a review based on the criteria and PDF document bytes.
     */
    public String generateReview(String criteriaJson, byte[] pdfBytes) {
        log.info("Calling AWS Bedrock model {} for AI Review generation", MODEL_ID);

        String systemPrompt = "You are an expert AI peer reviewer evaluating a scientific or academic submission. " +
                "Your task is to analyze the document content and provide grades and feedback according to the EXACT provided JSON grading criteria schema. " +
                "You must return ONLY a JSON object that matches the expected response schema. Do not include any other text, markdown formatting blocks, or explanations outside the JSON.";

        String userPromptText = "Here is the grading criteria and format you must follow:\n" +
                criteriaJson + "\n\n" +
                "Analyze the provided document thoroughly against the criteria and output the JSON response.";

        try {
            String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);

            Map<String, Object> documentBlock = Map.of(
                    "type", "document",
                    "source", Map.of(
                            "type", "base64",
                            "media_type", "application/pdf",
                            "data", base64Pdf
                    )
            );

            Map<String, Object> textBlock = Map.of(
                    "type", "text",
                    "text", userPromptText
            );

            Map<String, Object> payload = Map.of(
                    "anthropic_version", "bedrock-2023-05-31",
                    "max_tokens", 4096,
                    "system", systemPrompt,
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content", List.of(documentBlock, textBlock)
                            )
                    )
            );

            String payloadString = objectMapper.writeValueAsString(payload);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(MODEL_ID)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(payloadString))
                    .build();

            InvokeModelResponse response = bedrockClient.invokeModel(request);
            String responseBody = response.body().asUtf8String();

            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
            List<Map<String, Object>> contentList = (List<Map<String, Object>>) responseMap.get("content");
            if (contentList != null && !contentList.isEmpty()) {
                String text = (String) contentList.get(0).get("text");
                // Attempt to clean up if the model accidentally wrapped it in markdown
                if (text != null && text.startsWith("```json")) {
                    text = text.substring(7);
                    if (text.endsWith("```")) {
                        text = text.substring(0, text.length() - 3);
                    }
                }
                return text.trim();
            }

            throw new RuntimeException("No content returned from Bedrock model");
        } catch (Exception e) {
            log.error("Error calling Bedrock API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI Review via Bedrock", e);
        }
    }
}
