package com.fh_wedel.response.model;

public class SubmissionReadyEvent {

    private String submissionId;
    private boolean requestAiReview;
    private String documentS3Key;

    public SubmissionReadyEvent() {
    }

    public SubmissionReadyEvent(String submissionId, boolean requestAiReview) {
        this.submissionId = submissionId;
        this.requestAiReview = requestAiReview;
    }

    public SubmissionReadyEvent(String submissionId, boolean requestAiReview, String documentS3Key) {
        this.submissionId = submissionId;
        this.requestAiReview = requestAiReview;
        this.documentS3Key = documentS3Key;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    public boolean isRequestAiReview() {
        return requestAiReview;
    }

    public void setRequestAiReview(boolean requestAiReview) {
        this.requestAiReview = requestAiReview;
    }

    public String getDocumentS3Key() {
        return documentS3Key;
    }

    public void setDocumentS3Key(String documentS3Key) {
        this.documentS3Key = documentS3Key;
    }
}
