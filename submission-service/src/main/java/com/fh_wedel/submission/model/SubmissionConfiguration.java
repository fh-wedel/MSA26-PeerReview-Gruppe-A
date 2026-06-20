package com.fh_wedel.submission.model;

import java.util.List;

public class SubmissionConfiguration {

    private String submissionId;
    private String title;
    private List<String> authorIds;

    public SubmissionConfiguration() {
    }

    public SubmissionConfiguration(String submissionId, String title, List<String> authorIds) {
        this.submissionId = submissionId;
        this.title = title;
        this.authorIds = authorIds;
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
}
