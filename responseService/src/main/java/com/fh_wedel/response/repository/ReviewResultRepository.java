package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewResultRepository extends JpaRepository<ReviewResult, UUID> {
    List<ReviewResult> findByAuthorId(String authorId);
    Optional<ReviewResult> findBySubmissionId(String submissionId);
}
