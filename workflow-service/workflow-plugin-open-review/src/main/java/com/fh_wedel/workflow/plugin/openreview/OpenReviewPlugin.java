package com.fh_wedel.workflow.plugin.openreview;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public class OpenReviewPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Open Review";
    }

    @Override
    public String getName() {
        return "OPEN_REVIEW";
    }

    @Override
    public String getDescription() {
        return "Open Review: All identities are visible. Authors and reviewers can freely communicate with each other.";
    }

    @Override
    public boolean isAuthorAnonymous() {
        return false;
    }

    @Override
    public boolean isReviewerAnonymous() {
        return false;
    }

    @Override
    public boolean isAuthorReviewerChatAllowed() {
        return true;
    }
}
