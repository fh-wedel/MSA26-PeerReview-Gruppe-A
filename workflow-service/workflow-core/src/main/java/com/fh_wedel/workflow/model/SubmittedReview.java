package com.fh_wedel.workflow.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

@DynamoDbBean
public class SubmittedReview {
    public SubmittedReview() {}

    public SubmittedReview(String pk, String sk, String submissionId, String reviewerId, String responsesJson, int totalPoints, int maxPossiblePoints, double percentage, String gradeSummary, Instant submittedAt) {
        this.pk = pk;
        this.sk = sk;
        this.submissionId = submissionId;
        this.reviewerId = reviewerId;
        this.responsesJson = responsesJson;
        this.totalPoints = totalPoints;
        this.maxPossiblePoints = maxPossiblePoints;
        this.percentage = percentage;
        this.gradeSummary = gradeSummary;
        this.submittedAt = submittedAt;
    }

            public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getResponsesJson() { return responsesJson; }
    public void setResponsesJson(String responsesJson) { this.responsesJson = responsesJson; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public int getMaxPossiblePoints() { return maxPossiblePoints; }
    public void setMaxPossiblePoints(int maxPossiblePoints) { this.maxPossiblePoints = maxPossiblePoints; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public String getGradeSummary() { return gradeSummary; }
    public void setGradeSummary(String gradeSummary) { this.gradeSummary = gradeSummary; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }



    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_PREFIX = "REVIEW#";

    private String pk;
    private String sk;

        private String submissionId;
        private String reviewerId;
        private String responsesJson;
        private int totalPoints;
        private int maxPossiblePoints;
        private double percentage;
        private String gradeSummary;
        private Instant submittedAt;

    public SubmittedReview(String submissionId, String reviewerId, String responsesJson,
                           int totalPoints, int maxPossiblePoints, double percentage, String gradeSummary) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_PREFIX + reviewerId;
        this.submissionId = submissionId;
        this.reviewerId = reviewerId;
        this.responsesJson = responsesJson;
        this.totalPoints = totalPoints;
        this.maxPossiblePoints = maxPossiblePoints;
        this.percentage = percentage;
        this.gradeSummary = gradeSummary;
        this.submittedAt = Instant.now();
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
