package com.fh_wedel.workflow.api.model;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public record WorkflowRules(
    boolean authorAnonymous,
    boolean reviewerAnonymous,
    boolean reviewerToReviewerAnonymous,
    boolean authorReviewerChatAllowed,
    boolean reviewerToReviewerChatAllowed
) {
    public static WorkflowRules fromPlugin(ReviewWorkflowPlugin plugin) {
        return new WorkflowRules(
            plugin.isAuthorAnonymous(),
            plugin.isReviewerAnonymous(),
            plugin.isReviewerToReviewerAnonymous(),
            plugin.isAuthorReviewerChatAllowed(),
            plugin.isReviewerToReviewerChatAllowed()
        );
    }
}
