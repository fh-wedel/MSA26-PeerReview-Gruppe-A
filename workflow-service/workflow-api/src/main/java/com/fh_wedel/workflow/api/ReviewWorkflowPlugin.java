package com.fh_wedel.workflow.api;

import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

/**
 * Service Provider Interface (SPI) for review workflow plugins.
 *
 * <p>Each plugin defines the complete behaviour of a review process:
 * metadata, anonymity/chat rules, participant structure, feedback form,
 * and grading logic.  Implementations are discovered at runtime via
 * {@link java.util.ServiceLoader}.</p>
 */
public interface ReviewWorkflowPlugin {

    // ── Metadata ──────────────────────────────────────────────────────

    /**
     * Unique machine-readable identifier (e.g. {@code "INDIVIDUAL_WORK"}).
     */
    String getName();

    /** Human-readable description of the review process. */
    String getDescription();

    /** Human-readable display title (e.g. {@code "Double Blind"}). */
    String getTitle();

    // ── Anonymity & communication rules ───────────────────────────────

    /** Whether the author's identity is hidden from reviewers. */
    boolean isAuthorAnonymous();

    /** Whether the reviewer's identity is hidden from the author. */
    boolean isReviewerAnonymous();

    /** Whether direct chat between author and reviewer is allowed. */
    boolean isAuthorReviewerChatAllowed();

    // ── Participant structure ─────────────────────────────────────────

    /**
     * Default number of reviewers required for submissions using this workflow.
     * Can be overridden per-submission in the Configuration Service.
     */
    int getDefaultNumberOfReviewers();

    /**
     * Default number of authors expected for submissions using this workflow.
     * {@code 1} for individual work, {@code > 1} for group work.
     */
    int getDefaultNumberOfAuthors();

    // ── Feedback form ─────────────────────────────────────────────────

    /**
     * Returns the ordered list of questions that make up the feedback form
     * a reviewer must fill in for submissions using this workflow.
     */
    List<ReviewQuestion> getFeedbackFormTemplate();

    // ── Grading logic ─────────────────────────────────────────────────

    /**
     * Evaluates a list of review responses against this plugin's grading
     * rubric and returns a computed grade.
     *
     * @param responses the reviewer's answers (one per question)
     * @return the calculated grade
     */
    ReviewGrade calculateGrade(List<ReviewResponse> responses);
}
