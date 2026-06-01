package com.fh_wedel.workflow.plugin.singleblind;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public class SingleBlindPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Single Blind";
    }

    @Override
    public String getName() {
        return "single-blind";
    }

    @Override
    public String getDescription() {
        return "Single-Blind Review: Authors remain anonymous to reviewers, but reviewers are visible to authors. Reviewers can communicate with each other.";
    }

    @Override
    public boolean isAuthorAnonymous() {
        return true;
    }

    @Override
    public boolean isReviewerAnonymous() {
        return false;
    }

    @Override
    public boolean isReviewerToReviewerAnonymous() {
        return false;
    }

    @Override
    public boolean isAuthorReviewerChatAllowed() {
        return false;
    }

    @Override
    public boolean isReviewerToReviewerChatAllowed() {
        return true;
    }
}
