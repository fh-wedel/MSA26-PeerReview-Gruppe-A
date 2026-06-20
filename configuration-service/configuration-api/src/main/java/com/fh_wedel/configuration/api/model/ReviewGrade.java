package com.fh_wedel.configuration.api.model;

/**
 * The result of evaluating a set of {@link ReviewResponse}s through a plugin's grading logic.
 *
 * @param totalPoints       The total points awarded by the reviewer.
 * @param maxPossiblePoints The maximum points possible across all questions.
 * @param percentage        The percentage score (totalPoints / maxPossiblePoints × 100).
 * @param summary           An optional human-readable summary of the grade.
 */
public record ReviewGrade(
        int totalPoints,
        int maxPossiblePoints,
        double percentage,
        String summary
) {
    /**
     * Convenience factory that auto-calculates the percentage.
     */
    public static ReviewGrade of(int totalPoints, int maxPossiblePoints, String summary) {
        double pct = maxPossiblePoints > 0
                ? (totalPoints * 100.0) / maxPossiblePoints
                : 0.0;
        return new ReviewGrade(totalPoints, maxPossiblePoints, pct, summary);
    }
}
