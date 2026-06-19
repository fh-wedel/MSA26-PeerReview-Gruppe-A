package com.fh_wedel.workflow.plugin.individualwork;

import com.fh_wedel.workflow.api.ReviewTemplatePlugin;
import com.fh_wedel.workflow.api.model.ReviewGrade;
import com.fh_wedel.workflow.api.model.ReviewQuestion;
import com.fh_wedel.workflow.api.model.ReviewResponse;

import java.util.List;

public class IndividualWorkTemplatePlugin implements ReviewTemplatePlugin {

    @Override
    public String getTitle() {
        return "Individual Work";
    }

    @Override
    public String getName() {
        return "INDIVIDUAL_WORK";
    }

    @Override
    public String getDescription() {
        return "Double-blind review process tailored for individual papers and assignments.";
    }

    @Override
    public boolean isEvaluationCriteriaVisibleToAuthors() {
        return true;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("originality", "Originality", 10),
                ReviewQuestion.rating("methodology", "Methodology", 10),
                ReviewQuestion.rating("clarity", "Clarity", 10),
                ReviewQuestion.rating("relevance", "Relevance", 10),
                ReviewQuestion.text("overall_assessment", "Overall Assessment", 10),
                ReviewQuestion.multipleChoice("recommendation", "Recommendation", 10,
                        List.of("Accept", "Minor Revisions", "Major Revisions", "Reject"))
        );
    }

    @Override
    public ReviewGrade calculateGrade(List<ReviewResponse> responses) {
        int totalPoints = 0;
        int maxPoints = 60; // 4x10 rating + 1x10 text + 1x10 MC

        for (ReviewResponse response : responses) {
            switch (response.questionId()) {
                case "originality":
                case "methodology":
                case "clarity":
                case "relevance":
                    if (response.numericValue() != null) {
                        totalPoints += response.numericValue();
                    }
                    break;
                case "overall_assessment":
                    if (response.textValue() != null && !response.textValue().isBlank()) {
                        totalPoints += 10;
                    }
                    break;
                case "recommendation":
                    if (response.selectedOption() != null) {
                        switch (response.selectedOption()) {
                            case "Accept" -> totalPoints += 10;
                            case "Minor Revisions" -> totalPoints += 7;
                            case "Major Revisions" -> totalPoints += 4;
                            case "Reject" -> totalPoints += 0;
                        }
                    }
                    break;
            }
        }

        return ReviewGrade.of(totalPoints, maxPoints, "Calculated grade based on Double-Blind rubric");
    }
}
