package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;

public class TestPlugin implements ReviewWorkflowPlugin {
    @Override
    public String getName() { return "test-plugin"; }
    @Override
    public String getDescription() { return "A test plugin for unit testing"; }
    @Override
    public boolean isAuthorAnonymous() { return true; }
    @Override
    public boolean isReviewerAnonymous() { return false; }
    @Override
    public boolean isReviewerToReviewerAnonymous() { return true; }
    @Override
    public boolean isAuthorReviewerChatAllowed() { return false; }
    @Override
    public boolean isReviewerToReviewerChatAllowed() { return true; }
}
