package com.fh_wedel.workflow.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

@DynamoDbBean
public class ReviewSession {
    public ReviewSession() {}

    public ReviewSession(String pk, String sk, String submissionId, String pluginName, List<String> expectedReviewerIds, int receivedReviewCount, int totalExpected, boolean complete, Instant createdAt) {
        this.pk = pk;
        this.sk = sk;
        this.submissionId = submissionId;
        this.pluginName = pluginName;
        this.expectedReviewerIds = expectedReviewerIds;
        this.receivedReviewCount = receivedReviewCount;
        this.totalExpected = totalExpected;
        this.complete = complete;
        this.createdAt = createdAt;
    }

            public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }

    public String getPluginName() { return pluginName; }
    public void setPluginName(String pluginName) { this.pluginName = pluginName; }

    public List<String> getExpectedReviewerIds() { return expectedReviewerIds; }
    public void setExpectedReviewerIds(List<String> expectedReviewerIds) { this.expectedReviewerIds = expectedReviewerIds; }

    public int getReceivedReviewCount() { return receivedReviewCount; }
    public void setReceivedReviewCount(int receivedReviewCount) { this.receivedReviewCount = receivedReviewCount; }

    public int getTotalExpected() { return totalExpected; }
    public void setTotalExpected(int totalExpected) { this.totalExpected = totalExpected; }

    public boolean isComplete() { return complete; }
    public void setComplete(boolean complete) { this.complete = complete; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }



    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_VALUE = "SESSION";

    private String pk;
    private String sk;

        private String submissionId;
        private String pluginName;
        private List<String> expectedReviewerIds;
        private int receivedReviewCount;
        private int totalExpected;
        private boolean complete;
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
