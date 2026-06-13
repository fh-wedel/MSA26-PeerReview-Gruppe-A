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
    private List<String> evaluationCriteria;
    @Getter
    private boolean criteriaVisibleToAuthor;
    @Getter
    private String status; // e.g. CREATED, MATCHED

    public SubmissionConfiguration() {
    }

    public SubmissionConfiguration(String submissionId, String title, String reviewProcessType,
                                   List<String> authorIds, String creatorId, String creatorRole,
                                   int numberOfExaminers, Instant submissionDeadline, Instant reviewDeadline,
                                   List<String> evaluationCriteria, boolean criteriaVisibleToAuthor) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.title = title;
        this.reviewProcessType = reviewProcessType;
        this.authorIds = authorIds;
        this.creatorId = creatorId;
        this.creatorRole = creatorRole;
        this.numberOfExaminers = numberOfExaminers;
        this.submissionDeadline = submissionDeadline;
        this.reviewDeadline = reviewDeadline;
        this.evaluationCriteria = evaluationCriteria;
        this.criteriaVisibleToAuthor = criteriaVisibleToAuthor;
        this.status = "CREATED";
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
