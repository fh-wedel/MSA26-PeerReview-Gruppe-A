package com.fh_wedel.response.model;

import java.time.Instant;
import java.util.UUID;

public record ReviewResultDto(
        UUID id,
        String submissionId,
        String reviewerId,
        String authorId,
        String finalGrade,
        String reviewComments,
        boolean hasDocument,
        Instant completedAt,
        Instant createdAt
) {
    public static ReviewResultDto from(ReviewResult entity) {
        return new ReviewResultDto(
                entity.getId(),
                entity.getSubmissionId(),
                entity.getReviewerId(),
                entity.getAuthorId(),
                entity.getFinalGrade(),
                entity.getReviewComments(),
                entity.getDocumentS3Key() != null && !entity.getDocumentS3Key().isBlank(),
                entity.getCompletedAt(),
                entity.getCreatedAt()
        );
    }
}
