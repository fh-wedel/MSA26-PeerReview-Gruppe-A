package com.fh_wedel.response.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "review_result")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "submission_id", nullable = false, length = 100)
    private String submissionId;

    @Column(name = "reviewer_id", nullable = false, length = 100)
    private String reviewerId;

    @Column(name = "author_id", nullable = false, length = 100)
    private String authorId;

    @Column(name = "final_grade", length = 10)
    private String finalGrade;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    @Column(name = "document_s3_key", length = 500)
    private String documentS3Key;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
