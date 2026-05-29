package com.fh_wedel.submission.dto;

import com.fh_wedel.submission.model.CreatedByType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionConfigurationCreateDto {
    private String title;
    private String description;
    private CreatedByType createdByType;
    private String createdById;
    private Instant submissionStart;
    private Instant submissionDeadline;
    private Instant reviewDeadline;
    private String reviewProcess;
    private String matchingRule;
    private GradingCriteriaFormDto gradingForm;
}
