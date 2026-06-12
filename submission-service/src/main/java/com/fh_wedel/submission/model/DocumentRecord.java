package com.fh_wedel.submission.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;

@DynamoDbBean
public class DocumentRecord {

    public static final String SK_PREFIX = "DOC#";

    private String pk;
    private String sk;
    private String submissionId;
    private String documentId;
    private String fileName;
    private String s3Key;
    private String contentType;
    private long fileSize;
    private Instant uploadedAt;

    public DocumentRecord() {
    }

    public DocumentRecord(String submissionId, String documentId, String fileName, String s3Key, String contentType) {
        this.pk = Submission.PK_PREFIX + submissionId;
        this.sk = SK_PREFIX + documentId;
        this.submissionId = submissionId;
        this.documentId = documentId;
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.contentType = contentType;
        this.uploadedAt = Instant.now();
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

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
