package com.fh_wedel.matching;

import com.fh_wedel.configuration.client.api.SubmissionRulesApi;
import com.fh_wedel.matching.repository.MatchRepository;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.api.UsersApi;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

@SpringBootTest
class MatchingApplicationTests {

    @MockitoBean
    private DynamoDbClient dynamoDbClient;

    @MockitoBean
    private DynamoDbEnhancedClient dynamoDbEnhancedClient;

    @MockitoBean
    private SqsTemplate sqsTemplate;

    @MockitoBean
    private GroupsApi groupsApi;

    @MockitoBean
    private UsersApi usersApi;

    @MockitoBean
    private SubmissionRulesApi configurationRulesApi;

    @MockitoBean
    private MatchRepository matchRepository;

    @Test
    void contextLoads() {
    }

}
