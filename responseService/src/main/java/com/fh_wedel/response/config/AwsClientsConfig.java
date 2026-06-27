package com.fh_wedel.response.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.lambda.LambdaClient;

import java.time.Duration;

/**
 * Provides the AWS SDK v2 DynamoDB client beans.
 * <p>
 * Dual-stack is enabled explicitly so the clients resolve to AAAA-addressable
 * endpoints when the ECS task runs in an IPv6-only subnet. The
 * {@code spring.cloud.aws.dynamodb.dualstack-enabled} property is only honoured
 * by the Spring Cloud AWS auto-configured clients and is silently ignored here.
 */
@Configuration
public class AwsClientsConfig {

    @Value("${spring.cloud.aws.region.static:eu-north-1}")
    private String awsRegion;

    @Value("${aws.lambda.invoke-timeout-seconds:240}")
    private long lambdaInvokeTimeoutSeconds;

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
    public LambdaClient lambdaClient() {
        Duration invokeTimeout = Duration.ofSeconds(lambdaInvokeTimeoutSeconds);
        return LambdaClient.builder()
                .region(Region.of(awsRegion))
                .dualstackEnabled(true)
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallAttemptTimeout(invokeTimeout)
                        .apiCallTimeout(invokeTimeout.plusSeconds(20))
                        // Retrying invoke() can trigger duplicate Lambda executions for the same task.
                        .retryPolicy(RetryPolicy.none())
                        .build())
                .build();
    }
}
