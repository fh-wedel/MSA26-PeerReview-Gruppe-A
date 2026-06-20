package com.fh_wedel.configuration.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

import java.time.Instant;

@DynamoDbBean
public class AuthorMapping {

    public static final String PK_PREFIX = SubmissionConfiguration.PK_PREFIX;
    public static final String SK_PREFIX = "AUTHOR#";

    private String pk;
    private String sk;
    private String authorId;
    private String submissionId;
    private Instant timestamp;

    public AuthorMapping() {
    }

    public AuthorMapping(String submissionId, String authorId) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_PREFIX + authorId;
        this.authorId = authorId;
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

    @DynamoDbSecondaryPartitionKey(indexNames = "AuthorIndex")
    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    @DynamoDbSecondarySortKey(indexNames = "AuthorIndex")
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
