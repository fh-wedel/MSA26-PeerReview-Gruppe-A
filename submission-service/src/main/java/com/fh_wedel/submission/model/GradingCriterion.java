package com.fh_wedel.submission.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Table("grading_criteria")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingCriterion {
    @Id
    private UUID id;
    
    private String title;
    
    private String description;
    
    @Column("criterion_type")
    private CriterionType criterionType;
    
    @Column("max_points")
    private Integer maxPoints;
    
    private Double weight;
    
    @Column("sort_order")
    private int sortOrder;
}
