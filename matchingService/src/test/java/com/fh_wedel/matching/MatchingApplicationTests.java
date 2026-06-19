package com.fh_wedel.matching;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.api.UsersApi;
import com.fh_wedel.workflow.client.api.WorkflowRulesApi;
import com.fh_wedel.matching.repository.MatchRepository;

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
    private WorkflowRulesApi workflowRulesApi;

    @MockitoBean
    private MatchRepository matchRepository;

    @Test
    void contextLoads() {
    }

}
