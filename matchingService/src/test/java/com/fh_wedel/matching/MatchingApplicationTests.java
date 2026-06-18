package com.fh_wedel.matching;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import com.fh_wedel.matching.client.UserServiceClient;
import com.fh_wedel.matching.repository.MatchRepository;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
class MatchingApplicationTests {

    @MockitoBean
    private DynamoDbClient dynamoDbClient;

    @MockitoBean
    private DynamoDbEnhancedClient dynamoDbEnhancedClient;

    @MockitoBean
    private SqsTemplate sqsTemplate;

    @MockitoBean
    private UserServiceClient userServiceClient;

    @MockitoBean
    private MatchRepository matchRepository;

    @MockitoBean
    private RestTemplate restTemplate;

    @Test
    void contextLoads() {
    }

}
