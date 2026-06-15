package com.fh_wedel.workflow.plugin.openreview;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

public class OpenReviewPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Open Review";
    }

    @Override
    public String getName() {
        return "OPEN_REVIEW";
    }

    @Override
    public String getDescription() {
        return "Open Review: All identities are visible. Authors and reviewers can freely communicate with each other.";
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

    @Override
    public int getDefaultNumberOfReviewers() {
        return 3;
    }

    @Override
    public int getDefaultNumberOfAuthors() {
        return 4; // Group work
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("code_quality", "Code Quality", 10),
                ReviewQuestion.rating("documentation", "Documentation", 10),
                ReviewQuestion.text("teamwork_assessment", "Teamwork Assessment", 5),
                ReviewQuestion.text("strengths", "Strengths", 0),
                ReviewQuestion.text("improvements", "Improvements", 0)
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 25; // 10 + 10 + 5

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "code_quality":
                case "documentation":
                    if (response.numericValue() != null) {
                        totalPoints += response.numericValue();
                    }
                    break;
                case "teamwork_assessment":
                    if (response.textValue() != null && !response.textValue().isBlank()) {
                        totalPoints += 5; // Fixed points if filled out
                    }
                    break;
                // strengths and improvements contribute 0 points
            }
        }

        return ReviewGrade.of(totalPoints, maxPoints, "Group Project Evaluation");
    }
}
