package com.fh_wedel.response.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiReviewTask {
    private String submissionId;
    private String reviewResultId;
    private String documentS3Key;
}
