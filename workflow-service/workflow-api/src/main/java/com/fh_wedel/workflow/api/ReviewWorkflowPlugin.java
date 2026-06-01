package com.fh_wedel.workflow.api;

public interface ReviewWorkflowPlugin {
    String getName();
    String getDescription();
    String getTitle();
    boolean isAuthorAnonymous();
    boolean isReviewerAnonymous();
    boolean isReviewerToReviewerAnonymous();
    boolean isAuthorReviewerChatAllowed();
    boolean isReviewerToReviewerChatAllowed();
}
