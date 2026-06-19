package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTemplatePlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.Collections;
import java.util.List;

public class TestTemplatePlugin implements ReviewTemplatePlugin {
    @Override public String getTitle() { return "Test Plugin"; }
    @Override public String getName() { return "test-plugin"; }
    @Override public String getDescription() { return "A test plugin for unit testing"; }
    @Override public List<ReviewQuestion> getFeedbackFormTemplate() { return Collections.emptyList(); }
    @Override public ReviewGrade calculateGrade(List<ReviewResponse> responses) { return new ReviewGrade(0, 0, 0.0, "Test Grade"); }
    @Override public boolean isEvaluationCriteriaVisibleToAuthors() { return true; }
}
