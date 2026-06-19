package com.fh_wedel.submission.model;

import jakarta.validation.constraints.NotBlank;

public class PresignedUrlRequest {

    @NotBlank
    private String fileName;

    @NotBlank
    private String contentType;

    public PresignedUrlRequest() {
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
