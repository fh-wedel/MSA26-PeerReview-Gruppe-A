package com.fh_wedel.submission.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondarySortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

@DynamoDbBean
public class AuthorMapping {

    public static final String PK_PREFIX = Submission.PK_PREFIX;
    public static final String SK_PREFIX = "AUTHOR#";

    private String pk;
    private String sk;
    private String authorId;
    private String submissionId;
    private Instant createdAt;

    public AuthorMapping() {
    }

    public AuthorMapping(String submissionId, String authorId, Instant createdAt) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_PREFIX + authorId;
        this.authorId = authorId;
        this.submissionId = submissionId;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
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

    @DynamoDbSecondaryPartitionKey(indexNames = "AuthorIndex")
    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    @DynamoDbSecondarySortKey(indexNames = "AuthorIndex")
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
