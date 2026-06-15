package com.fh_wedel.workflow.plugin.singleblind;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

public class SingleBlindPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Single Blind";
    }

    @Override
    public String getName() {
        return "SINGLE_BLIND";
    }

    @Override
    public String getDescription() {
        return "Single-Blind Review: Reviewers remain anonymous to authors, but authors are visible to reviewers.";
    }

    @Override
    public boolean isAuthorAnonymous() {
        return false;
    }

    @Override
    public boolean isReviewerAnonymous() {
        return true;
    }

    @Override
    public boolean isAuthorReviewerChatAllowed() {
        return false;
    }

    @Override
    public int getDefaultNumberOfReviewers() {
        return 1;
    }

    @Override
    public int getDefaultNumberOfAuthors() {
        return 1;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("content_quality", "Content Quality", 20),
                ReviewQuestion.rating("structure", "Structure", 10),
                ReviewQuestion.rating("academic_writing", "Academic Writing", 10),
                ReviewQuestion.rating("research_depth", "Research Depth", 10),
                ReviewQuestion.scale("thesis_grade", "Thesis Grade", 0,
                        List.of("Very Good", "Good", "Satisfactory", "Adequate", "Insufficient", "Failed"))
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 50; // 20 + 10 + 10 + 10 (scale has 0 points)

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "content_quality":
                case "structure":
                case "academic_writing":
                case "research_depth":
                    if (response.numericValue() != null) {
                        totalPoints += response.numericValue();
                    }
                    break;
                // thesis_grade (scale) contributes 0 points to the numeric total
            }
        }

        return ReviewGrade.of(totalPoints, maxPoints, "Bachelor Thesis Evaluation");
    }
}
