package com.fh_wedel.submission.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.MappedCollection;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;
import java.util.Set;

@Table("grading_criteria_forms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingCriteriaForm {
    @Id
    private UUID id;
    
    @Column("configuration_id")
    private UUID configurationId;
    
    private String title;
    
    private String description;
    
    @Column("visible_to_authors")
    private boolean visibleToAuthors;
    
    @Column("created_at")
    private Instant createdAt;

    @MappedCollection(idColumn = "form_id", keyColumn = "sort_order")
    private Set<GradingCriterion> criteria;
}
