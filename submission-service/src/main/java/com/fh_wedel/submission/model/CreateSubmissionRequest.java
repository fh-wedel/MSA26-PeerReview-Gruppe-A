package com.fh_wedel.submission.model;

import jakarta.validation.constraints.NotBlank;

public class CreateSubmissionRequest {

    @NotBlank
    private String configurationId;

    private boolean requestAiReview;

    public CreateSubmissionRequest() {
    }

    public String getConfigurationId() {
        return configurationId;
    }

    public void setConfigurationId(String configurationId) {
        this.configurationId = configurationId;
    }

    public boolean isRequestAiReview() {
        return requestAiReview;
    }

    public void setRequestAiReview(boolean requestAiReview) {
        this.requestAiReview = requestAiReview;
    }
}
