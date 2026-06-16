package com.fh_wedel.workflow.api.model;

/**
 * Represents a reviewer's answer to a single {@link ReviewQuestion}.
 * Exactly one of the value fields should be populated, matching the question's {@link QuestionType}.
 *
 * @param questionId     The ID of the question being answered (must match a {@link ReviewQuestion#id()}).
 * @param textValue      The free-text answer (for {@link QuestionType#TEXT}).
 * @param numericValue   The numeric rating/scale value (for {@link QuestionType#RATING} or {@link QuestionType#SCALE}).
 * @param selectedOption The chosen option (for {@link QuestionType#MULTIPLE_CHOICE}).
 */
public record ReviewResponse(
        String questionId,
        String textValue,
        Integer numericValue,
        String selectedOption
) {
}
