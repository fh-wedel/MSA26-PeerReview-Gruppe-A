package com.fh_wedel.workflow.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

@Setter
@DynamoDbBean
@NoArgsConstructor
@AllArgsConstructor
public class SubmittedReview {

    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_PREFIX = "REVIEW#";

    private String pk;
    private String sk;

    @Getter
    private String submissionId;
    @Getter
    private String reviewerId;
    @Getter
    private String responsesJson;
    @Getter
    private int totalPoints;
    @Getter
    private int maxPossiblePoints;
    @Getter
    private double percentage;
    @Getter
    private String gradeSummary;
    @Getter
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
