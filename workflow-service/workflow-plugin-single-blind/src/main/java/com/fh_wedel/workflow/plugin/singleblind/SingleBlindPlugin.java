package com.fh_wedel.workflow.plugin.singleblind;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public class SingleBlindPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Single Blind";
    }

    @Override
    public String getName() {
        return "SINGLE_BLIND";
    }

    @Override
    public String getDescription() {
        return "Single-Blind Review: Reviewers remain anonymous to authors, but authors are visible to reviewers.";
    }

    @Override
    public boolean isAuthorAnonymous() {
        return false;
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
