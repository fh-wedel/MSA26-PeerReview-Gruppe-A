package com.fh_wedel.configuration.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.time.Instant;

@Data
public class CreateConfigurationRequest {

    @NotBlank(message = "Title must not be blank")
    private String title;

    @NotBlank(message = "Review process type must be specified")
    private String reviewProcessType;

    @NotEmpty(message = "At least one author must be specified")
    private List<String> authorIds;

    private Integer numberOfExaminers;
    private Instant submissionDeadline;
    private Instant reviewDeadline;
    private String reviewTemplateType;

}
