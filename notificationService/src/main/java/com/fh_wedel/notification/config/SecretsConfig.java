package com.fh_wedel.notification.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;

@Configuration
@Slf4j
@Getter
public class SecretsConfig {

    @Value("${aws.secrets.name:}")
    private String secretName;

    private Map<String, String> secrets = new HashMap<>();

    @PostConstruct
    public void loadSecrets() {
        if (secretName == null || secretName.isBlank()) {
            log.warn("No secrets name configured, channels will be disabled");
            return;
        }
        try {
            var client = SecretsManagerClient.create();
            var response = client.getSecretValue(
                    GetSecretValueRequest.builder().secretId(secretName).build());
            secrets = new ObjectMapper().readValue(
                    response.secretString(), new TypeReference<>() {});
            log.info("Loaded {} secret keys", secrets.size());
        } catch (Exception e) {
            log.error("Failed to load secrets from {}: {}", secretName, e.getMessage());
        }
    }

    public String get(String key) {
        return secrets.getOrDefault(key, "");
    }
}
