package com.fh_wedel.workflow.plugin.individualwork;

import com.fh_wedel.workflow.api.ReviewTypePlugin;

public class IndividualWorkTypePlugin implements ReviewTypePlugin {

    @Override
    public String getTitle() {
        return "Individual Work";
    }

    @Override
    public String getName() {
        return "INDIVIDUAL_WORK";
    }

    @Override
    public String getDescription() {
        return "Double-blind review process tailored for individual papers and assignments.";
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
