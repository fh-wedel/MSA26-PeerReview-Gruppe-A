package com.fh_wedel.submission.model;

public class SubmissionReadyEvent {

    private String submissionId;
    private boolean requestAiReview;

    public SubmissionReadyEvent() {
    }

    public SubmissionReadyEvent(String submissionId, boolean requestAiReview) {
        this.submissionId = submissionId;
        this.requestAiReview = requestAiReview;
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
}
