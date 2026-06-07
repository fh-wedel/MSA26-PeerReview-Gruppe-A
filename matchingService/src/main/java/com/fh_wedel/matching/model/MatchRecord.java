package com.fh_wedel.matching.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

/**
 * DynamoDB entity representing a single reviewer assignment for a submission.
 * <p>
 * Table schema (single-table design):
 * <ul>
 *   <li>PK: {@code SUBMISSION#{submissionId}}</li>
 *   <li>SK: {@code MATCH#{examinerId}}</li>
 * </ul>
 * <p>
 * GSI "ExaminerIndex":
 * <ul>
 *   <li>GSI-PK: {@code examinerId}</li>
 *   <li>GSI-SK: {@code submissionId}</li>
 * </ul>
 */
@DynamoDbBean
public class MatchRecord {

    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_PREFIX = "MATCH#";

    private String pk;
    private String sk;
    private String examinerId;
    private String submissionId;
    private Instant timestamp;

    public MatchRecord() {
    }

    public MatchRecord(String submissionId, String examinerId) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_PREFIX + examinerId;
        this.examinerId = examinerId;
        this.submissionId = submissionId;
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

    @DynamoDbSecondaryPartitionKey(indexNames = "ExaminerIndex")
    public String getExaminerId() {
        return examinerId;
    }

    public void setExaminerId(String examinerId) {
        this.examinerId = examinerId;
    }

    @DynamoDbSecondarySortKey(indexNames = "ExaminerIndex")
    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
