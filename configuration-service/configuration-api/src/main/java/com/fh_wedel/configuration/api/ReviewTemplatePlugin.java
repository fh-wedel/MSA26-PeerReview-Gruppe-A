package com.fh_wedel.configuration.api;

import com.fh_wedel.configuration.api.model.ReviewGrade;
import com.fh_wedel.configuration.api.model.ReviewQuestion;
import com.fh_wedel.configuration.api.model.ReviewResponse;

import java.util.List;

/**
 * Service Provider Interface (SPI) for review template plugins.
 */
public interface ReviewTemplatePlugin {

    // ── Metadata ──────────────────────────────────────────────────────

    String getName();

    String getDescription();

    String getTitle();

    // ── Template rules ───────────────────────────────

    boolean isEvaluationCriteriaVisibleToAuthors();

    // ── Constraints ───────────────────────────────────────────────────

    Integer getMinAuthors();
    Integer getMaxAuthors();
    Integer getMinReviewers();
    Integer getMaxReviewers();
    Integer getSubmissionDurationDays();
    Integer getReviewDurationDays();

    // ── Feedback form ─────────────────────────────────────────────────

    List<ReviewQuestion> getFeedbackFormTemplate();

    // ── Grading logic ─────────────────────────────────────────────────

    ReviewGrade calculateGrade(List<ReviewResponse> responses);
}
