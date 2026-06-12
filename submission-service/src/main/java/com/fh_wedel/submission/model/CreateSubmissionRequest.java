package com.fh_wedel.submission.model;

import jakarta.validation.constraints.NotBlank;

public class CreateSubmissionRequest {

    @NotBlank
    private String configurationId;

    @NotBlank
    private String title;

    public CreateSubmissionRequest() {
    }

    public String getConfigurationId() {
        return configurationId;
    }

    public void setConfigurationId(String configurationId) {
        this.configurationId = configurationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
