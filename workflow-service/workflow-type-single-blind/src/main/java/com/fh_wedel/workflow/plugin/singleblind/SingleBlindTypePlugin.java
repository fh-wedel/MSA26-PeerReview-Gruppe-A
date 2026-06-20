package com.fh_wedel.workflow.plugin.singleblind;

import com.fh_wedel.workflow.api.ReviewTypePlugin;

public class SingleBlindTypePlugin implements ReviewTypePlugin {

    @Override
    public String getName() {
        return "SINGLE_BLIND";
    }

    @Override
    public String getTitle() {
        return "Single Blind Review";
    }

    @Override
    public String getDescription() {
        return "The reviewer's identity is hidden from the author, but the reviewer knows the author's identity.";
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
