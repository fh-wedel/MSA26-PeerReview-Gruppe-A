package com.fh_wedel.response.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;

import java.util.List;

/**
 * One question of the grading schema a submission was reviewed by.
 *
 * <p>Snapshotted from the workflow service's feedback-form template
 * ({@code ReviewQuestionDto}) at the time the review result is stored, so the
 * criteria stay stable even if the template later changes. Persisted as a nested
 * DynamoDB bean inside {@link ReviewResult#getGradingSchema()}.
 */
@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingCriterion {

    private String id;
    private String text;
    private String type;
    private Integer maxPoints;
    private Boolean required;
    private List<String> options;
    private String answer;
}
