package com.fh_wedel.response.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitReviewRequest {
    private String submissionId;
    private String reviewComments;
    private String finalGrade;
    private List<ReviewAnswer> answers;
}
