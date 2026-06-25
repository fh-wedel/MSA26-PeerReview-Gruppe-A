package com.fh_wedel.configuration.plugin.seminar;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.model.ReviewGrade;
import com.fh_wedel.configuration.api.model.ReviewQuestion;
import com.fh_wedel.configuration.api.model.ReviewResponse;

import java.util.List;

public class SeminarTemplatePlugin implements ReviewTemplatePlugin {

    @Override
    public String getTitle() {
        return "Seminar";
    }

    @Override
    public String getName() {
        return "SEMINAR";
    }

    @Override
    public String getDescription() {
        return "Review template tailored for seminars.";
    }

    @Override
    public boolean isEvaluationCriteriaVisibleToAuthors() {
        return true;
    }

    @Override
    public Integer getMinAuthors() {
        return 1;
    }

    @Override
    public Integer getMaxAuthors() {
        return 1;
    }

    @Override
    public Integer getMinReviewers() {
        return 1;
    }

    @Override
    public Integer getMaxReviewers() {
        return 1;
    }

    @Override
    public Integer getSubmissionDurationDays() {
        return null;
    }

    @Override
    public Integer getReviewDurationDays() {
        return null;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("content_structure", "Content & Structure", 20),
                ReviewQuestion.rating("presentation", "Presentation", 20),
                ReviewQuestion.rating("discussion", "Discussion & Q&A", 10),
                ReviewQuestion.text("overall_feedback", "Overall Feedback", 0)
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 50;

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "content_structure":
                case "presentation":
                case "discussion":
                    if (response.numericValue() != null) {
                        totalPoints += response.numericValue();
                    }
                    break;
            }
        }

        return ReviewGrade.of(totalPoints, maxPoints, "Seminar Evaluation");
    }
}
