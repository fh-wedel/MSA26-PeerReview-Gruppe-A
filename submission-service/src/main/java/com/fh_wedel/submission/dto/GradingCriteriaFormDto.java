package com.fh_wedel.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingCriteriaFormDto {
    private String title;
    private String description;
    private boolean visibleToAuthors;
    private List<GradingCriterionDto> criteria;
}
