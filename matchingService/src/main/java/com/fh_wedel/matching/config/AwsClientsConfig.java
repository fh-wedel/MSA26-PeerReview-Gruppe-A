package com.fh_wedel.matching.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;

/**
 * Provides AWS SDK client beans for DynamoDB and Cognito.
 * Dual-stack is enabled explicitly on every client so that they resolve to
 * AAAA-addressable endpoints when the ECS task runs in an IPv6-only subnet.
 * The spring.cloud.aws.*.dualstack-enabled property is only honoured by the
 * Spring Cloud AWS auto-configured clients and is silently ignored here.
 */
@Configuration
public class AwsClientsConfig {

    @Value("${spring.cloud.aws.region.static:eu-north-1}")
    private String awsRegion;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }

    @Bean
    public CognitoIdentityProviderClient cognitoClient() {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .build();
    }
}
