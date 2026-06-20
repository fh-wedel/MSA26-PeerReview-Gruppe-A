package com.fh_wedel.configuration.plugin.openreview;

import com.fh_wedel.configuration.api.ReviewTypePlugin;

public class OpenReviewTypePlugin implements ReviewTypePlugin {

    @Override
    public String getName() {
        return "OPEN_REVIEW";
    }

    @Override
    public String getTitle() {
        return "Open Review";
    }

    @Override
    public String getDescription() {
        return "Both the author's and reviewer's identities are known to each other.";
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
