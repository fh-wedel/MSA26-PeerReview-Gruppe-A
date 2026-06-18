package com.fh_wedel.workflow.api.model;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

import java.util.List;

/**
 * Immutable snapshot of a plugin's complete configuration:
 * rules, participant structure, and feedback form template.
 */
public record WorkflowRules(
    boolean authorAnonymous,
    boolean reviewerAnonymous,
    boolean authorReviewerChatAllowed,
    List<ReviewQuestion> feedbackFormTemplate
) {
    public static WorkflowRules fromPlugin(ReviewWorkflowPlugin plugin) {
        return new WorkflowRules(
                plugin.isAuthorAnonymous(),
                plugin.isReviewerAnonymous(),
                plugin.isAuthorReviewerChatAllowed(),
                plugin.getFeedbackFormTemplate()
        );
    }
}
