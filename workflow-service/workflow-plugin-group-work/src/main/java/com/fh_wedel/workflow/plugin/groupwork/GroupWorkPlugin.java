package com.fh_wedel.workflow.plugin.groupwork;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

public class GroupWorkPlugin implements ReviewWorkflowPlugin {

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
                ReviewQuestion.rating("content_argumentation", "Content & Argumentation", 10),
                ReviewQuestion.rating("structure_organization", "Structure & Organization", 10),
                ReviewQuestion.rating("clarity_writing", "Clarity & Writing", 10),
                ReviewQuestion.text("teamwork_assessment", "Teamwork Assessment", 5),
                ReviewQuestion.text("strengths", "Strengths", 0),
                ReviewQuestion.text("improvements", "Improvements", 0)
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 35;

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "content_argumentation":
                case "structure_organization":
                case "clarity_writing":
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
