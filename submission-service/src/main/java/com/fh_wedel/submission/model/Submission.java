package com.fh_wedel.submission.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

@DynamoDbBean
public class Submission {

    public static final String PK_PREFIX = "SUBMISSION#";
    public static final String SK_VALUE = "META";

    private String pk;
    private String sk;
    private String submissionId;
    private String configurationId;
    private List<String> authorIds;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant submittedAt;
    private boolean requestAiReview;

    public Submission() {
    }

    public Submission(String submissionId, String configurationId, List<String> authorIds) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.configurationId = configurationId;
        this.authorIds = authorIds;
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

    public List<String> getAuthorIds() {
        return authorIds;
    }

    public void setAuthorIds(List<String> authorIds) {
        this.authorIds = authorIds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

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

    public boolean isRequestAiReview() {
        return requestAiReview;
    }

    public void setRequestAiReview(boolean requestAiReview) {
        this.requestAiReview = requestAiReview;
    }
}
