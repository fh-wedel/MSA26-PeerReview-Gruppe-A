package com.fh_wedel.submission.model;

public class SubmissionReadyEvent {

    private String submissionId;
    private String authorId;
    private String configurationId;
    private String status;

    public SubmissionReadyEvent() {
    }

    public SubmissionReadyEvent(String submissionId, String authorId, String configurationId) {
        this.submissionId = submissionId;
        this.authorId = authorId;
        this.configurationId = configurationId;
        this.status = "SUBMITTED";
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getConfigurationId() {
        return configurationId;
    }

    public void setConfigurationId(String configurationId) {
        this.configurationId = configurationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
