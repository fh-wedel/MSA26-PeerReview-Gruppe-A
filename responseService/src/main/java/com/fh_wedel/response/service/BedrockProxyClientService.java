package com.fh_wedel.response.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class BedrockProxyClientService {

    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;
    private final String lambdaName;
    private final String submissionDocumentsBucketName;

    public BedrockProxyClientService(LambdaClient lambdaClient,
                                     ObjectMapper objectMapper,
                                     @Value("${aws.bedrock-proxy.lambda-name:}") String lambdaName,
                                     @Value("${aws.submission-documents.bucket-name:}") String submissionDocumentsBucketName) {
        this.lambdaClient = lambdaClient;
        this.objectMapper = objectMapper;
        this.lambdaName = lambdaName;
        this.submissionDocumentsBucketName = submissionDocumentsBucketName;
    }

    public String generateReview(String submissionId,
                                 String reviewResultId,
                                 String criteriaJson,
                                 String documentS3Key) {
        if (lambdaName == null || lambdaName.isBlank()) {
            throw new IllegalStateException("Bedrock proxy Lambda name is not configured.");
        }

        try {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("submissionId", submissionId);
            payloadMap.put("reviewResultId", reviewResultId);
            payloadMap.put("criteriaJson", criteriaJson);
            payloadMap.put("documentS3Key", documentS3Key);
            if (submissionDocumentsBucketName != null && !submissionDocumentsBucketName.isBlank()) {
                payloadMap.put("documentS3Bucket", submissionDocumentsBucketName);
            }
            String payload = objectMapper.writeValueAsString(payloadMap);

            InvokeRequest request = InvokeRequest.builder()
                    .functionName(lambdaName)
                    .payload(SdkBytes.fromUtf8String(payload))
                    .build();

            InvokeResponse response = lambdaClient.invoke(request);
            if (response.functionError() != null && !response.functionError().isBlank()) {
                String errorPayload = response.payload() != null ? response.payload().asUtf8String() : "";
                throw new IllegalStateException("Bedrock proxy Lambda failed: " + errorPayload);
            }

            String rawPayload = response.payload() != null ? response.payload().asUtf8String() : "";
            Map<String, Object> responseBody = objectMapper.readValue(rawPayload, new TypeReference<>() {
            });
            Object generatedReviewJson = responseBody.get("generatedReviewJson");
            if (!(generatedReviewJson instanceof String generated) || generated.isBlank()) {
                throw new IllegalStateException("Bedrock proxy Lambda returned no review payload.");
            }

            return generated;
        } catch (Exception e) {
            log.error("Error invoking Bedrock proxy Lambda {}", lambdaName, e);
            throw new RuntimeException("Failed to generate AI review via Bedrock proxy Lambda.", e);
        }
    }
}
