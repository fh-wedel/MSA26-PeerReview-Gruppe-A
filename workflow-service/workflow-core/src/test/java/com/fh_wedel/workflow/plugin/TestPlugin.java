package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.Collections;
import java.util.List;

public class TestPlugin implements ReviewWorkflowPlugin {
    @Override
    public String getTitle() { return "Test Plugin"; }
    @Override
    public String getName() { return "test-plugin"; }
    @Override
    public String getDescription() { return "A test plugin for unit testing"; }
    @Override
    public boolean isAuthorAnonymous() { return true; }
    @Override
    public boolean isReviewerAnonymous() { return false; }
    @Override
    public boolean isAuthorReviewerChatAllowed() { return false; }

    @Override
    public int getDefaultNumberOfReviewers() {
        return 2;
    }

    @Override
    public int getDefaultNumberOfAuthors() {
        return 1;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return Collections.emptyList();
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        return new ReviewGrade(0, 0, 0.0, "Test Grade");
    }
}
