package com.fh_wedel.workflow.api.model;

import java.util.List;

/**
 * Represents a single question in a plugin-defined feedback form.
 * Each question has a type, point value, and optional answer options.
 *
 * @param id        Unique identifier for this question within the form (e.g., "q1", "clarity").
 * @param text      The question text displayed to the reviewer.
 * @param type      The input type expected for this question.
 * @param maxPoints Maximum points awardable for this question.
 * @param required  Whether the reviewer must answer this question.
 * @param options   Predefined answer options (used for MULTIPLE_CHOICE and SCALE types; empty for TEXT/RATING).
 */
public record ReviewQuestion(
        String id,
        String text,
        QuestionType type,
        int maxPoints,
        boolean required,
        List<String> options
) {
    /**
     * Convenience factory for a required text question with the given max points.
     */
    public static ReviewQuestion text(String id, String text, int maxPoints) {
        return new ReviewQuestion(id, text, QuestionType.TEXT, maxPoints, true, List.of());
    }

    /**
     * Convenience factory for a required rating question with the given max points.
     */
    public static ReviewQuestion rating(String id, String text, int maxPoints) {
        return new ReviewQuestion(id, text, QuestionType.RATING, maxPoints, true, List.of());
    }

    /**
     * Convenience factory for a required multiple-choice question.
     */
    public static ReviewQuestion multipleChoice(String id, String text, int maxPoints, List<String> options) {
        return new ReviewQuestion(id, text, QuestionType.MULTIPLE_CHOICE, maxPoints, true, options);
    }

    /**
     * Convenience factory for a required scale question.
     */
    public static ReviewQuestion scale(String id, String text, int maxPoints, List<String> scaleLabels) {
        return new ReviewQuestion(id, text, QuestionType.SCALE, maxPoints, true, scaleLabels);
    }
}
