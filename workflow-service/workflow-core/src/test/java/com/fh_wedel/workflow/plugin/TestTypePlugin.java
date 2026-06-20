package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTypePlugin;

public class TestTypePlugin implements ReviewTypePlugin {
    @Override public String getTitle() { return "Test Plugin"; }
    @Override public String getName() { return "test-plugin"; }
    @Override public String getDescription() { return "A test plugin for unit testing"; }
    @Override public boolean isAuthorAnonymous() { return true; }
    @Override public boolean isReviewerAnonymous() { return false; }
    @Override public boolean isAuthorReviewerChatAllowed() { return false; }
}
