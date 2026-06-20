package com.fh_wedel.notification.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrincipalNormalizerTest {

    @Test
    void extractsSubFromCedarEntity() {
        assertThat(PrincipalNormalizer.normalize("PeerReview::User::\"eu-central-1_abc|sub-123\""))
                .isEqualTo("sub-123");
    }

    @Test
    void extractsSubFromPoolPipeSub() {
        assertThat(PrincipalNormalizer.normalize("eu-central-1_abc|sub-123")).isEqualTo("sub-123");
    }

    @Test
    void returnsBareSubUnchanged() {
        assertThat(PrincipalNormalizer.normalize("sub-123")).isEqualTo("sub-123");
    }
}
