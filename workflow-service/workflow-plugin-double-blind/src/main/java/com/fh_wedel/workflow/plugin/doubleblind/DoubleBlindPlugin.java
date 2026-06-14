package com.fh_wedel.workflow.plugin.doubleblind;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public class DoubleBlindPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Double Blind";
    }

    @Override
    public String getName() {
        return "DOUBLE_BLIND";
    }

    @Override
    public String getDescription() {
        return "Double-Blind Review: Both authors and reviewers remain anonymous to each other. No direct communication is allowed.";
    }

    @Override
    public boolean isAuthorAnonymous() {
        return true;
    }

    @Override
    public boolean isReviewerAnonymous() {
        return true;
    }

    @Override
    public boolean isAuthorReviewerChatAllowed() {
        return false;
    }
}
