package com.fh_wedel.workflow.plugin.bachelorthesis;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

public class BachelorThesisPlugin implements ReviewWorkflowPlugin {

    @Override
    public String getTitle() {
        return "Bachelor Thesis";
    }

    @Override
    public String getName() {
        return "BACHELOR_THESIS";
    }

    @Override
    public String getDescription() {
        return "Single-blind review process tailored for bachelor theses.";
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
    public int getNumberOfReviewers() {
        return 1;
    }

    @Override
    public int getNumberOfAuthors() {
        return 1;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("abstract_introduction", "Abstract & Introduction", 10),
                ReviewQuestion.rating("theoretical_background", "Theoretical Background", 10),
                ReviewQuestion.rating("methodology_implementation", "Methodology & Implementation", 20),
                ReviewQuestion.rating("evaluation_results", "Evaluation & Results", 10),
                ReviewQuestion.rating("structure_academic_writing", "Structure & Academic Writing", 10),
                ReviewQuestion.text("conclusion_future_work", "Conclusion & Future Work", 0),
                ReviewQuestion.scale("thesis_grade", "Thesis Grade", 0,
                        List.of("Very Good", "Good", "Satisfactory", "Adequate", "Insufficient", "Failed"))
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 60;

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "abstract_introduction":
                case "theoretical_background":
                case "methodology_implementation":
                case "evaluation_results":
                case "structure_academic_writing":
                    if (response.numericValue() != null) {
                        totalPoints += response.numericValue();
                    }
                    break;
                // thesis_grade (scale) and conclusion_future_work contribute 0 points to the numeric total
            }
        }

        return ReviewGrade.of(totalPoints, maxPoints, "Bachelor Thesis Evaluation");
    }

    @Override
    public java.time.Duration getSubmissionDeadlineDuration() {
        return java.time.Duration.ofDays(30);
    }

    @Override
    public java.time.Duration getReviewDeadlineDuration() {
        return java.time.Duration.ofDays(21);
    }

    @Override
    public boolean isEvaluationCriteriaVisibleToAuthors() {
        return true;
    }
}
