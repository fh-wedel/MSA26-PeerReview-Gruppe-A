package com.fh_wedel.notification.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SecretsConfigTest {

    @Test
    void loadSecrets_shouldDoNothingWhenSecretNameIsBlank() {
        SecretsConfig config = new SecretsConfig();
        ReflectionTestUtils.setField(config, "secretName", "");
        
        config.loadSecrets();
        
        assertThat(config.getSecrets()).isEmpty();
        assertThat(config.get("any")).isEmpty();
    }

    @Test
    void loadSecrets_shouldDoNothingWhenSecretNameIsNull() {
        SecretsConfig config = new SecretsConfig();
        ReflectionTestUtils.setField(config, "secretName", null);
        
        config.loadSecrets();
        
        assertThat(config.getSecrets()).isEmpty();
    }

    @Test
    void loadSecrets_shouldHandleExceptionWhenAwsCallFails() {
        SecretsConfig config = new SecretsConfig();
        ReflectionTestUtils.setField(config, "secretName", "my-secret");
        ReflectionTestUtils.setField(config, "awsRegion", "invalid-region");

        // Should catch exception and log error, not throw
        config.loadSecrets();

        assertThat(config.getSecrets()).isEmpty();
    }

    @Test
    void get_shouldReturnEmptyStringForUnknownKey() {
        SecretsConfig config = new SecretsConfig();
        assertThat(config.get("unknown.key")).isEmpty();
    }

    @Test
    void get_shouldReturnKnownKey() {
        SecretsConfig config = new SecretsConfig();
        ReflectionTestUtils.setField(config, "secrets", Map.of("known.key", "value"));
        
        assertThat(config.get("known.key")).isEqualTo("value");
    }

    @Test
    void getterTest() {
        SecretsConfig config = new SecretsConfig();
        ReflectionTestUtils.setField(config, "secretName", "sn");
        ReflectionTestUtils.setField(config, "awsRegion", "ar");
        
        assertThat(config.getSecretName()).isEqualTo("sn");
        assertThat(config.getAwsRegion()).isEqualTo("ar");
    }
}
