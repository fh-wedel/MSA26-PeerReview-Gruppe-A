package com.fh_wedel.matching.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

/**
 * DynamoDB entity representing the overall status of a matching operation for a submission.
 * <p>
 * Table schema:
 * <ul>
 *   <li>PK: {@code SUBMISSION#{submissionId}}</li>
 *   <li>SK: {@code STATUS}</li>
 * </ul>
 */
@DynamoDbBean
public class SubmissionStatusRecord {

    public static final String SK_VALUE = "STATUS";

    private String pk;
    private String sk;
    private String submissionId;
    private List<String> submitterIds;
    private String status;
    private String reason;
    private int numberOfExaminers;
    private Instant timestamp;
 
    public SubmissionStatusRecord() {
    }
 
    public SubmissionStatusRecord(String submissionId, List<String> submitterIds, MatchStatus status,
                                  int numberOfExaminers, String reason) {
        this.pk = MatchRecord.PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.submitterIds = submitterIds;
        this.status = status.name();
        this.numberOfExaminers = numberOfExaminers;
        this.reason = reason;
        this.timestamp = Instant.now();
    }

    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    public void setPk(String pk) {
        this.pk = pk;
    }

    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }

    public void setSk(String sk) {
        this.sk = sk;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    public List<String> getSubmitterIds() {
        return submitterIds;
    }

    public void setSubmitterIds(List<String> submitterIds) {
        this.submitterIds = submitterIds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public int getNumberOfExaminers() {
        return numberOfExaminers;
    }

    public void setNumberOfExaminers(int numberOfExaminers) {
        this.numberOfExaminers = numberOfExaminers;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
