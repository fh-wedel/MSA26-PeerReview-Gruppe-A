package com.fh_wedel.response.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.lambda.LambdaClient;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

class AwsClientsConfigTest {

    @Test
    void testDynamoDbClient() {
        AwsClientsConfig config = new AwsClientsConfig();
        ReflectionTestUtils.setField(config, "awsRegion", "eu-central-1");
        DynamoDbClient client = config.dynamoDbClient();
        assertNotNull(client);
    }

    @Test
    void testDynamoDbEnhancedClient() {
        AwsClientsConfig config = new AwsClientsConfig();
        DynamoDbClient dynamoDbClient = mock(DynamoDbClient.class);
        DynamoDbEnhancedClient client = config.dynamoDbEnhancedClient(dynamoDbClient);
        assertNotNull(client);
    }

    @Test
    void testLambdaClient() {
        AwsClientsConfig config = new AwsClientsConfig();
        ReflectionTestUtils.setField(config, "awsRegion", "eu-central-1");
        ReflectionTestUtils.setField(config, "lambdaInvokeTimeoutSeconds", 330L);
        LambdaClient client = config.lambdaClient();
        assertNotNull(client);
    }
}
