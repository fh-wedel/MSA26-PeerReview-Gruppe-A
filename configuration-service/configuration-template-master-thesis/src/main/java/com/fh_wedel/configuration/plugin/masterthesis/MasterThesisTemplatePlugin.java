package com.fh_wedel.configuration.plugin.masterthesis;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.model.ReviewGrade;
import com.fh_wedel.configuration.api.model.ReviewQuestion;
import com.fh_wedel.configuration.api.model.ReviewResponse;

import java.util.List;

public class MasterThesisTemplatePlugin implements ReviewTemplatePlugin {

    @Override
    public String getTitle() {
        return "Master Thesis";
    }

    @Override
    public String getName() {
        return "MASTER_THESIS";
    }

    @Override
    public String getDescription() {
        return "Review template tailored for master theses.";
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
        return 2;
    }

    @Override
    public Integer getMaxReviewers() {
        return 2;
    }

    @Override
    public Integer getSubmissionDurationDays() {
        return 180;
    }

    @Override
    public Integer getReviewDurationDays() {
        return 90;
    }

    @Override
    public List<ReviewQuestion> getFeedbackFormTemplate() {
        return List.of(
                ReviewQuestion.rating("abstract_introduction", "Abstract & Introduction", 10),
                ReviewQuestion.rating("theoretical_background", "Theoretical Background", 10),
                ReviewQuestion.rating("methodology_implementation", "Methodology & Implementation", 10),
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
        int maxPoints = 50;

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

        return ReviewGrade.of(totalPoints, maxPoints, "Calculated grade based on Master Thesis rubric");
    }

    @Override
    public boolean isAllowAuthorCustomReviewer() {
        return true;
    }
}
