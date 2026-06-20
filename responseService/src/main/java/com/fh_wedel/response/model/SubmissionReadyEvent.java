package com.fh_wedel.response.model;

public class SubmissionReadyEvent {

    private String submissionId;

    public SubmissionReadyEvent() {
    }

    public SubmissionReadyEvent(String submissionId) {
        this.submissionId = submissionId;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }
}
