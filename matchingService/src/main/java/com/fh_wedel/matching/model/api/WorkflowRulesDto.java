package com.fh_wedel.matching.model.api;

import lombok.Data;

@Data
public class WorkflowRulesDto {
    private Boolean authorAnonymous;
    private Boolean reviewerAnonymous;
    private Boolean authorReviewerChatAllowed;
}
