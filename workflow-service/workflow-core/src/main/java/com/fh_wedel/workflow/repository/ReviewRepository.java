package com.fh_wedel.workflow.repository;

import com.fh_wedel.workflow.model.ReviewSession;
import com.fh_wedel.workflow.model.SubmittedReview;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ReturnValue;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public class ReviewRepository {

    private final DynamoDbTable<ReviewSession> sessionTable;
    private final DynamoDbTable<SubmittedReview> reviewTable;
    private final DynamoDbClient lowLevelClient;
    private final String tableName;

    public ReviewRepository(DynamoDbEnhancedClient enhancedClient,
                            DynamoDbClient lowLevelClient,
                            @Value("${dynamodb.table.name:workflow-reviews}") String tableName) {
        this.sessionTable = enhancedClient.table(tableName, TableSchema.fromBean(ReviewSession.class));
        this.reviewTable = enhancedClient.table(tableName, TableSchema.fromBean(SubmittedReview.class));
        this.lowLevelClient = lowLevelClient;
        this.tableName = tableName;
    }

    public void saveSession(ReviewSession session) {
        sessionTable.putItem(session);
    }

    public ReviewSession getSession(String submissionId) {
        Key key = Key.builder()
                .partitionValue(ReviewSession.PK_PREFIX + submissionId)
                .sortValue(ReviewSession.SK_VALUE)
                .build();
        return sessionTable.getItem(key);
    }

    public void saveReview(SubmittedReview review) {
        reviewTable.putItem(review);
    }

    public SubmittedReview getReview(String submissionId, String reviewerId) {
        Key key = Key.builder()
                .partitionValue(SubmittedReview.PK_PREFIX + submissionId)
                .sortValue(SubmittedReview.SK_PREFIX + reviewerId)
                .build();
        return reviewTable.getItem(key);
    }

    public List<SubmittedReview> getReviewsForSubmission(String submissionId) {
        return reviewTable.query(r -> r.queryConditional(QueryConditional.sortBeginsWith(
                        Key.builder().partitionValue(SubmittedReview.PK_PREFIX + submissionId)
                                .sortValue(SubmittedReview.SK_PREFIX).build()
                )))
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    /**
     * Atomically increments the receivedReviewCount of a ReviewSession in DynamoDB.
     * Returns the updated count to prevent race conditions during parallel updates.
     */
    public int incrementReceivedReviewCount(String submissionId) {
        Map<String, AttributeValue> keyMap = new HashMap<>();
        keyMap.put("pk", AttributeValue.builder().s(ReviewSession.PK_PREFIX + submissionId).build());
        keyMap.put("sk", AttributeValue.builder().s(ReviewSession.SK_VALUE).build());

        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":one", AttributeValue.builder().n("1").build());

        UpdateItemRequest request = UpdateItemRequest.builder()
                .tableName(tableName)
                .key(keyMap)
                .updateExpression("ADD receivedReviewCount :one")
                .expressionAttributeValues(expressionAttributeValues)
                .returnValues(ReturnValue.UPDATED_NEW)
                .build();

        UpdateItemResponse response = lowLevelClient.updateItem(request);
        Map<String, AttributeValue> attributes = response.attributes();
        if (attributes != null && attributes.containsKey("receivedReviewCount")) {
            return Integer.parseInt(attributes.get("receivedReviewCount").n());
        }

        throw new IllegalStateException("Failed to increment review count for submission: " + submissionId);
    }

    /**
     * Idempotently marks a ReviewSession as complete in DynamoDB.
     */
    public void markSessionComplete(String submissionId) {
        Map<String, AttributeValue> keyMap = new HashMap<>();
        keyMap.put("pk", AttributeValue.builder().s(ReviewSession.PK_PREFIX + submissionId).build());
        keyMap.put("sk", AttributeValue.builder().s(ReviewSession.SK_VALUE).build());

        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":true", AttributeValue.builder().bool(true).build());

        UpdateItemRequest request = UpdateItemRequest.builder()
                .tableName(tableName)
                .key(keyMap)
                .updateExpression("SET complete = :true")
                .expressionAttributeValues(expressionAttributeValues)
                .build();

        lowLevelClient.updateItem(request);
    }
}
