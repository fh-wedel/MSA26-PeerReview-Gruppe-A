package com.fh_wedel.workflow.service;

import com.fh_wedel.configuration.client.api.DefaultApi;
import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import com.fh_wedel.workflow.exception.DownstreamServiceException;
import com.fh_wedel.workflow.exception.ReviewAlreadySubmittedException;
import com.fh_wedel.workflow.model.api.WorkflowPluginDto;
import com.fh_wedel.workflow.model.api.WorkflowRulesDto;
import com.fh_wedel.workflow.plugin.WorkflowPluginRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    private final WorkflowPluginRegistry registry;
    private final DefaultApi configurationApi;
    private final com.fh_wedel.workflow.repository.ReviewRepository reviewRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public List<WorkflowPluginDto> listPlugins() {
        return registry.getAll().stream()
            .map(this::toDto)
            .toList();
    }

    public WorkflowPluginDto getPlugin(String name) {
        return registry.getByName(name)
            .map(this::toDto)
            .orElseThrow(() -> new NoSuchElementException("Workflow plugin not found: " + name));
    }

    public WorkflowRulesDto getPluginRules(String name) {
        return registry.getByName(name)
            .map(this::toRulesDto)
            .orElseThrow(() -> new NoSuchElementException("Workflow plugin not found: " + name));
    }

    public WorkflowRulesDto getRulesForSubmission(String submissionId) {
        try {
            com.fh_wedel.configuration.client.model.ModelConfiguration config = configurationApi.submissionIdGet(submissionId);
            String workflowName = config.getReviewProcessType();
            return getPluginRules(workflowName);
        } catch (com.fh_wedel.configuration.client.ApiException e) {
            if (e.getCode() == 404) {
                log.error("Submission not found: {}", submissionId, e);
                throw new NoSuchElementException("Submission not found: " + submissionId, e);
            }
            log.error("Failed to fetch configuration for submission: {}", submissionId, e);
            throw new DownstreamServiceException("Failed to fetch configuration for submission: " + submissionId, e);
        } catch (Exception e) {
            log.error("Failed to fetch configuration for submission: {}", submissionId, e);
            throw new DownstreamServiceException("Failed to fetch configuration for submission: " + submissionId, e);
        }
    }

    public void initializeReviewSession(String submissionId, String pluginName, List<String> expectedReviewerIds) {
        com.fh_wedel.workflow.model.ReviewSession session = new com.fh_wedel.workflow.model.ReviewSession(
                submissionId, pluginName, expectedReviewerIds
        );
        reviewRepository.saveSession(session);
    }

    public com.fh_wedel.workflow.api.model.ReviewGrade submitReview(String submissionId, String reviewerId, List<com.fh_wedel.workflow.api.model.ReviewResponse> responses) {
        com.fh_wedel.workflow.model.ReviewSession session = reviewRepository.getSession(submissionId);
        if (session == null) {
            throw new IllegalArgumentException("No review session found for submission: " + submissionId);
        }

        // Check if the reviewer has already submitted a review
        if (reviewRepository.getReview(submissionId, reviewerId) != null) {
            throw new ReviewAlreadySubmittedException("Reviewer " + reviewerId + " has already submitted a review for submission " + submissionId);
        }

        ReviewWorkflowPlugin plugin = registry.getByName(session.getPluginName())
                .orElseThrow(() -> new IllegalStateException("Plugin not found: " + session.getPluginName()));

        com.fh_wedel.workflow.api.model.ReviewGrade grade = plugin.calculateGrade(responses);

        try {
            String responsesJson = objectMapper.writeValueAsString(responses);
            com.fh_wedel.workflow.model.SubmittedReview review = new com.fh_wedel.workflow.model.SubmittedReview(
                    submissionId, reviewerId, responsesJson, grade.totalPoints(), grade.maxPossiblePoints(),
                    grade.percentage(), grade.summary()
            );
            reviewRepository.saveReview(review);

            // Atomically increment the received review count to prevent race conditions
            int newCount = reviewRepository.incrementReceivedReviewCount(submissionId);
            boolean isComplete = newCount >= session.getTotalExpected();
            if (isComplete) {
                reviewRepository.markSessionComplete(submissionId);
            }

            return grade;
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize responses", e);
        }
    }

    public com.fh_wedel.workflow.model.ReviewSession getReviewStatus(String submissionId) {
        return reviewRepository.getSession(submissionId);
    }

    public List<com.fh_wedel.workflow.model.SubmittedReview> getReviewsForSubmission(String submissionId) {
        return reviewRepository.getReviewsForSubmission(submissionId);
    }

    public List<com.fh_wedel.workflow.api.model.ReviewQuestion> getFeedbackFormForSubmission(String submissionId) {
        try {
            com.fh_wedel.configuration.client.model.ModelConfiguration config = configurationApi.submissionIdGet(submissionId);
            String workflowName = config.getReviewProcessType();
            return registry.getByName(workflowName)
                    .map(ReviewWorkflowPlugin::getFeedbackFormTemplate)
                    .orElseThrow(() -> new NoSuchElementException("Plugin not found: " + workflowName));
        } catch (com.fh_wedel.configuration.client.ApiException e) {
            if (e.getCode() == 404) {
                throw new NoSuchElementException("Submission not found: " + submissionId, e);
            }
            throw new DownstreamServiceException("Failed to fetch configuration for submission: " + submissionId, e);
        } catch (Exception e) {
            throw new DownstreamServiceException("Failed to fetch configuration for submission: " + submissionId, e);
        }
    }

    private WorkflowPluginDto toDto(ReviewWorkflowPlugin plugin) {
        WorkflowPluginDto dto = new WorkflowPluginDto();
        dto.setName(plugin.getName());
        dto.setTitle(plugin.getTitle());
        dto.setDescription(plugin.getDescription());
        dto.setRules(toRulesDto(plugin));
        dto.setNumberOfReviewers(plugin.getNumberOfReviewers());
        dto.setNumberOfAuthors(plugin.getNumberOfAuthors());
        dto.setSubmissionDeadlineDuration(plugin.getSubmissionDeadlineDuration() != null ? plugin.getSubmissionDeadlineDuration().toString() : null);
        dto.setReviewDeadlineDuration(plugin.getReviewDeadlineDuration() != null ? plugin.getReviewDeadlineDuration().toString() : null);
        dto.setEvaluationCriteriaVisibleToAuthors(plugin.isEvaluationCriteriaVisibleToAuthors());

        List<com.fh_wedel.workflow.model.api.ReviewQuestionDto> feedbackDtos = plugin.getFeedbackFormTemplate().stream()
                .map(q -> {
                    com.fh_wedel.workflow.model.api.ReviewQuestionDto qDto = new com.fh_wedel.workflow.model.api.ReviewQuestionDto();
                    qDto.setId(q.id());
                    qDto.setText(q.text());
                    qDto.setType(com.fh_wedel.workflow.model.api.ReviewQuestionDto.TypeEnum.fromValue(q.type().name()));
                    qDto.setMaxPoints(q.maxPoints());
                    qDto.setRequired(q.required());
                    qDto.setOptions(q.options());
                    return qDto;
                })
                .toList();
        dto.setFeedbackFormTemplate(feedbackDtos);
        
        return dto;
    }

    private WorkflowRulesDto toRulesDto(ReviewWorkflowPlugin plugin) {
        WorkflowRulesDto dto = new WorkflowRulesDto();
        dto.setAuthorAnonymous(plugin.isAuthorAnonymous());
        dto.setReviewerAnonymous(plugin.isReviewerAnonymous());
        dto.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());
        return dto;
    }
}
