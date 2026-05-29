package com.fh_wedel.submission.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Table("submission_configurations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionConfiguration {
    @Id
    private UUID id;
    
    private String title;
    
    private String description;
    
    @Column("created_by_type")
    private CreatedByType createdByType;
    
    @Column("created_by_id")
    private String createdById;
    
    @Column("submission_start")
    private Instant submissionStart;
    
    @Column("submission_deadline")
    private Instant submissionDeadline;
    
    @Column("review_deadline")
    private Instant reviewDeadline;
    
    @Column("review_process")
    private String reviewProcess;
    
    @Column("matching_rule")
    private String matchingRule;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Column("updated_at")
    private Instant updatedAt;
}
