package com.fh_wedel.workflow.plugin.bachelorthesis;

import com.fh_wedel.workflow.api.ReviewTypePlugin;

public class BachelorThesisTypePlugin implements ReviewTypePlugin {

    @Override
    public String getTitle() {
        return "Bachelor Thesis";
    }

    @Override
    public String getName() {
        return "BACHELOR_THESIS";
    }

    @Override
    public String getDescription() {
        return "Single-blind review process tailored for bachelor theses.";
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
