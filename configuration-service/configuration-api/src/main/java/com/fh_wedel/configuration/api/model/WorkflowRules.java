package com.fh_wedel.configuration.api.model;

import com.fh_wedel.configuration.api.ReviewTypePlugin;

/**
 * Immutable snapshot of a plugin's complete configuration:
 * rules, participant structure, and feedback form template.
 */
public record WorkflowRules(
    boolean authorAnonymous,
    boolean reviewerAnonymous,
    boolean authorReviewerChatAllowed
) {
    public static WorkflowRules fromPlugin(ReviewTypePlugin plugin) {
        return new WorkflowRules(
                plugin.isAuthorAnonymous(),
                plugin.isReviewerAnonymous(),
                plugin.isAuthorReviewerChatAllowed()
        );
    }
}
