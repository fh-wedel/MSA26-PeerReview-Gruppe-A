package com.fh_wedel.user.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

import java.util.concurrent.TimeUnit;

/**
 * Provides AWS SDK client beans (Cognito), Jackson ObjectMapper,
 * RestTemplate, and the Caffeine-backed CacheManager.
 * <p>
 * Dual-stack is enabled on every AWS SDK client so that they resolve to
 * AAAA-addressable endpoints when the ECS task runs in an IPv6-only subnet.
 * Without dualstackEnabled(true), the default IPv4-only endpoints are unreachable
 * from the private IPv6-only subnet ("Network unreachable").
 */
@Configuration
public class AppConfig {

    @Value("${spring.cloud.aws.region.static:eu-north-1}")
    private String awsRegion;

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.build();
    }

    /**
     * Cognito SDK client with dual-stack enabled for IPv6-only ECS subnet compatibility.
     */
    @Bean
    public CognitoIdentityProviderClient cognitoClient() {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .build();
    }

    /**
     * Caffeine-backed CacheManager with two named caches:
     * <ul>
     *   <li>{@code users} – 5-minute TTL for user lookups by sub or username</li>
     *   <li>{@code groupMembers} – 5-minute TTL for group member listings</li>
     *   <li>{@code userSearch} – 2-minute TTL for username search results</li>
     * </ul>
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.registerCustomCache("users",
                Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .maximumSize(1000)
                        .build());
        manager.registerCustomCache("groupMembers",
                Caffeine.newBuilder()
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .maximumSize(50)
                        .build());
        manager.registerCustomCache("userSearch",
                Caffeine.newBuilder()
                        .expireAfterWrite(2, TimeUnit.MINUTES)
                        .maximumSize(200)
                        .build());
        return manager;
    }
}
