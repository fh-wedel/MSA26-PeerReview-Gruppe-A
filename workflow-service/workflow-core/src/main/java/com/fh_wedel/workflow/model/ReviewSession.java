package com.fh_wedel.workflow.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

@Setter
@DynamoDbBean
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSession {

    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_VALUE = "SESSION";

    private String pk;
    private String sk;

    @Getter
    private String submissionId;
    @Getter
    private String pluginName;
    @Getter
    private List<String> expectedReviewerIds;
    @Getter
    private int receivedReviewCount;
    @Getter
    private int totalExpected;
    @Getter
    private boolean complete;
    @Getter
    private Instant createdAt;

    public ReviewSession(String submissionId, String pluginName, List<String> expectedReviewerIds) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.pluginName = pluginName;
        this.expectedReviewerIds = expectedReviewerIds;
        this.receivedReviewCount = 0;
        this.totalExpected = expectedReviewerIds != null ? expectedReviewerIds.size() : 0;
        this.complete = false;
        this.createdAt = Instant.now();
    }

    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }

}
