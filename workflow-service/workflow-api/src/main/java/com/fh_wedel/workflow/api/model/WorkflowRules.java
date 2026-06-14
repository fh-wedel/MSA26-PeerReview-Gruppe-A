package com.fh_wedel.workflow.api.model;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public record WorkflowRules(
    boolean authorAnonymous,
    boolean reviewerAnonymous,
    boolean authorReviewerChatAllowed
) {
    public static WorkflowRules fromPlugin(ReviewWorkflowPlugin plugin) {
        return new WorkflowRules(
            plugin.isAuthorAnonymous(),
            plugin.isReviewerAnonymous(),
                plugin.isAuthorReviewerChatAllowed()
        );
    }
}
