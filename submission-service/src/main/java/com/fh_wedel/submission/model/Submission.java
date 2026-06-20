package com.fh_wedel.submission.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

@DynamoDbBean
public class Submission {

    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_VALUE = "META";

    private String pk;
    private String sk;
    private String submissionId;
    private String configurationId;
    private String authorId;
    private String title;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant submittedAt;

    public Submission() {
    }

    public Submission(String submissionId, String configurationId, String authorId, String title) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.configurationId = configurationId;
        this.authorId = authorId;
        this.title = title;
        this.status = SubmissionStatus.DRAFT.getDbValue();
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
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

    public String getConfigurationId() {
        return configurationId;
    }

    public void setConfigurationId(String configurationId) {
        this.configurationId = configurationId;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "AuthorIndex")
    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @DynamoDbSecondarySortKey(indexNames = "AuthorIndex")
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
