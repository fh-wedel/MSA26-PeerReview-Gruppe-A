package com.fh_wedel.workflow.api;

import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

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

    // ── Feedback form ─────────────────────────────────────────────────

    List<ReviewQuestion> getFeedbackFormTemplate();

    // ── Grading logic ─────────────────────────────────────────────────

    ReviewGrade calculateGrade(List<ReviewResponse> responses);
}
