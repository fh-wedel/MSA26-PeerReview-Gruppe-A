package com.fh_wedel.workflow.model;

public record WorkflowRulesDto(
    boolean authorAnonymous,
    boolean reviewerAnonymous,
    boolean reviewerToReviewerAnonymous,
    boolean authorReviewerChatAllowed,
    boolean reviewerToReviewerChatAllowed
) {}
