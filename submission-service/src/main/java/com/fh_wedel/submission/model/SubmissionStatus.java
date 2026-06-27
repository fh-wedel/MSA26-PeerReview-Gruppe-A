package com.fh_wedel.submission.model;

public enum SubmissionStatus {
    DRAFT("DRAFT"),
    WAITING_FOR_SUBMISSION("WAITING_FOR_SUBMISSION"),
    SUBMITTED("SUBMITTED"),
    READY_FOR_REVIEW("READY_FOR_REVIEW"),
    REVIEW_COMPLETED("REVIEW_COMPLETED");

    private final String dbValue;

    SubmissionStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }
}
