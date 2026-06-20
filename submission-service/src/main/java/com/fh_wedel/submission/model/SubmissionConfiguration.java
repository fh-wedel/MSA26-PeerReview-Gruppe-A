package com.fh_wedel.submission.model;

import java.time.Instant;
import java.util.List;

public class SubmissionConfiguration {

    private String submissionId;
    private String title;
    private List<String> authorIds;
    private Instant submissionDeadline;
    private Instant reviewDeadline;

    public SubmissionConfiguration() {
    }

    public SubmissionConfiguration(String submissionId, String title, List<String> authorIds) {
        this.submissionId = submissionId;
        this.title = title;
        this.authorIds = authorIds;
    }

    public SubmissionConfiguration(String submissionId, String title, List<String> authorIds,
                                   Instant submissionDeadline, Instant reviewDeadline) {
        this.submissionId = submissionId;
        this.title = title;
        this.authorIds = authorIds;
        this.submissionDeadline = submissionDeadline;
        this.reviewDeadline = reviewDeadline;
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

    public List<String> getAuthorIds() {
        return authorIds;
    }

    public void setAuthorIds(List<String> authorIds) {
        this.authorIds = authorIds;
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
}
