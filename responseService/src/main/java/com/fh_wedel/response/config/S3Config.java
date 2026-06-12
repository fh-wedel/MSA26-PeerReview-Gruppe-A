package com.fh_wedel.response.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Provides AWS SDK client beans for S3.
 * Dual-stack is enabled explicitly on every client so that they resolve to
 * AAAA-addressable endpoints when the ECS task runs in an IPv6-only subnet.
 * The spring.cloud.aws.*.dualstack-enabled property is only honoured by the
 * Spring Cloud AWS auto-configured clients and is silently ignored for the
 * manually built clients below.
 */
@Configuration
public class S3Config {

    @Value("${spring.cloud.aws.region.static:eu-north-1}")
    private String awsRegion;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .build();
    }
}
