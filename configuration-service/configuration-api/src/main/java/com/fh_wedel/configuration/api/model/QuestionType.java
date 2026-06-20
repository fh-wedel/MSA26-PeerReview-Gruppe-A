package com.fh_wedel.configuration.api.model;

/**
 * Defines the type of input expected for a review question.
 */
public enum QuestionType {

    /**
     * Free-form text response.
     */
    TEXT,

    /**
     * Numeric rating within a defined range (e.g., 1–10).
     */
    RATING,

    /**
     * Select one option from a predefined list.
     */
    MULTIPLE_CHOICE,

    /**
     * Likert-style scale (e.g., Strongly Disagree → Strongly Agree).
     */
    SCALE
}
