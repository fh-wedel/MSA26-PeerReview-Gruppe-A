package com.fh_wedel.response.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReviewResultDto(
        UUID id,
        String submissionId,
        String reviewerId,
        List<String> examinerUsernames,
        String authorId,
        String finalGrade,
        String reviewComments,
        Instant reviewDeadline,
        List<GradingCriterion> gradingSchema,
        List<ReviewAnswer> answers,
        boolean hasDocument,
        Instant completedAt,
        Instant createdAt
) {
    public static ReviewResultDto from(ReviewResult entity) {
        return new ReviewResultDto(
                entity.getId(),
                entity.getSubmissionId(),
                entity.getReviewerId(),
                entity.getExaminerUsernames(),
                entity.getAuthorId(),
                entity.getFinalGrade(),
                entity.getReviewComments(),
                entity.getReviewDeadline(),
                entity.getGradingSchema(),
                entity.getAnswers(),
                entity.getDocumentS3Key() != null && !entity.getDocumentS3Key().isBlank(),
                entity.getCompletedAt(),
                entity.getCreatedAt()
        );
    }
}
