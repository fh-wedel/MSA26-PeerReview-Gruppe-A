package com.fh_wedel.configuration.plugin.doubleblind;

import com.fh_wedel.configuration.api.ReviewTypePlugin;

public class DoubleBlindTypePlugin implements ReviewTypePlugin {

    @Override
    public String getName() {
        return "DOUBLE_BLIND";
    }

    @Override
    public String getTitle() {
        return "Double Blind Review";
    }

    @Override
    public String getDescription() {
        return "Both the author's and reviewer's identities are hidden from each other.";
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
