package com.fh_wedel.workflow.plugin.groupwork;

import com.fh_wedel.workflow.api.ReviewTypePlugin;

public class GroupWorkTypePlugin implements ReviewTypePlugin {

    @Override
    public String getTitle() {
        return "Group Work";
    }

    @Override
    public String getName() {
        return "GROUP_WORK";
    }

    @Override
    public String getDescription() {
        return "Open review process tailored for collaborative papers and group projects.";
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
