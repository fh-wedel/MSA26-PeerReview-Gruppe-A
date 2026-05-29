package com.fh_wedel.submission.dto;

import com.fh_wedel.submission.model.CriterionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingCriterionDto {
    private String title;
    private String description;
    private CriterionType type;
    private Integer maxPoints;
    private Double weight;
}
