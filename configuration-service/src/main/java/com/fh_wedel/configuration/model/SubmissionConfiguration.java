package com.fh_wedel.configuration.model;

import lombok.Getter;
import lombok.Setter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

@Setter
@DynamoDbBean
public class SubmissionConfiguration {

    public static final String PK_PREFIX = "CONFIG#";
    public static final String SK_VALUE = "METADATA";

    private String pk;
    private String sk;
    @Getter
    private String submissionId;
    @Getter
    private String title;
    @Getter
    private String reviewProcessType; // Store as string (enum name)
    @Getter
    private String reviewTemplateType;
    @Getter
    private List<String> authorIds;
    @Getter
    private String creatorId;
    @Getter
    private String creatorRole;
    @Getter
    private int numberOfExaminers;
    @Getter
    private Instant submissionDeadline;
    @Getter
    private Instant reviewDeadline;
    @Getter
    private String status; // e.g. CREATED, MATCHED
    @Getter
    private Instant createdAt;

    public SubmissionConfiguration() {
    }

    public SubmissionConfiguration(String submissionId, String title, String reviewProcessType,
                                   String reviewTemplateType, List<String> authorIds, String creatorId, String creatorRole,
                                   int numberOfExaminers, Instant submissionDeadline, Instant reviewDeadline) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.title = title;
        this.reviewProcessType = reviewProcessType;
        this.reviewTemplateType = reviewTemplateType;
        this.authorIds = authorIds;
        this.creatorId = creatorId;
        this.creatorRole = creatorRole;
        this.numberOfExaminers = numberOfExaminers;
        this.submissionDeadline = submissionDeadline;
        this.reviewDeadline = reviewDeadline;
        this.status = "CREATED";
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
