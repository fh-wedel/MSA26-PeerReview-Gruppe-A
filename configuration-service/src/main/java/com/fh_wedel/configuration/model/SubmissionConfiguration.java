package com.fh_wedel.configuration.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;
import java.util.List;

@DynamoDbBean
public class SubmissionConfiguration {

    public static final String PK_PREFIX = "CONFIG#";
    public static final String SK_VALUE = "METADATA";

    private String pk;
    private String sk;
    private String submissionId;
    private String title;
    private String reviewProcessType; // Store as string (enum name)
    private List<String> authorIds;
    private String creatorId;
    private String creatorRole;
    private int numberOfExaminers;
    private Instant submissionDeadline;
    private Instant reviewDeadline;
    private List<String> evaluationCriteria;
    private boolean criteriaVisibleToAuthor;
    private String status; // e.g. CREATED, MATCHED

    public SubmissionConfiguration() {
    }

    public SubmissionConfiguration(String submissionId, String title, ReviewProcessType reviewProcessType,
                                   List<String> authorIds, String creatorId, String creatorRole,
                                   int numberOfExaminers, Instant submissionDeadline, Instant reviewDeadline,
                                   List<String> evaluationCriteria, boolean criteriaVisibleToAuthor) {
        this.pk = PK_PREFIX + submissionId;
        this.sk = SK_VALUE;
        this.submissionId = submissionId;
        this.title = title;
        this.reviewProcessType = reviewProcessType.name();
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getReviewProcessType() {
        return reviewProcessType;
    }

    public void setReviewProcessType(String reviewProcessType) {
        this.reviewProcessType = reviewProcessType;
    }

    public List<String> getAuthorIds() {
        return authorIds;
    }

    public void setAuthorIds(List<String> authorIds) {
        this.authorIds = authorIds;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }

    public String getCreatorRole() {
        return creatorRole;
    }

    public void setCreatorRole(String creatorRole) {
        this.creatorRole = creatorRole;
    }

    public int getNumberOfExaminers() {
        return numberOfExaminers;
    }

    public void setNumberOfExaminers(int numberOfExaminers) {
        this.numberOfExaminers = numberOfExaminers;
    }

    public Instant getSubmissionDeadline() {
        return submissionDeadline;
    }

    public void setSubmissionDeadline(Instant submissionDeadline) {
        this.submissionDeadline = submissionDeadline;
    }

    public Instant getReviewDeadline() {
        return reviewDeadline;
    }

    public void setReviewDeadline(Instant reviewDeadline) {
        this.reviewDeadline = reviewDeadline;
    }

    public List<String> getEvaluationCriteria() {
        return evaluationCriteria;
    }

    public void setEvaluationCriteria(List<String> evaluationCriteria) {
        this.evaluationCriteria = evaluationCriteria;
    }

    public boolean isCriteriaVisibleToAuthor() {
        return criteriaVisibleToAuthor;
    }

    public void setCriteriaVisibleToAuthor(boolean criteriaVisibleToAuthor) {
        this.criteriaVisibleToAuthor = criteriaVisibleToAuthor;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
