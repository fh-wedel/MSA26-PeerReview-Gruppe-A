package com.fh_wedel.configuration.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class CreateConfigurationRequest {

    @NotBlank(message = "Title must not be blank")
    private String title;

    @NotBlank(message = "Review process type must be specified")
    private String reviewProcessType;

    @NotEmpty(message = "At least one author must be specified")
    private List<String> authorIds;

    @Min(value = 1, message = "Number of examiners must be at least 1")
    private int numberOfExaminers;

    private Instant submissionDeadline;
    
    private Instant reviewDeadline;

    private List<String> evaluationCriteria;

    private boolean criteriaVisibleToAuthor;
}
