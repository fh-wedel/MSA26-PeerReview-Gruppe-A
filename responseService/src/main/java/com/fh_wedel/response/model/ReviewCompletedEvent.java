package com.fh_wedel.response.model;

import java.time.Instant;

public record ReviewCompletedEvent(
        String submissionId,
        String reviewerId,
        String authorId,
        String finalGrade,
        String reviewComments,
        String documentS3Key,
        Instant completedAt
) {}
