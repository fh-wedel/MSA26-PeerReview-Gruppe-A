package com.fh_wedel.workflow.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.workflow.api.WorkflowPluginsApi;
import com.fh_wedel.workflow.api.WorkflowReviewsApi;
import com.fh_wedel.workflow.api.WorkflowRulesApi;
import com.fh_wedel.workflow.exception.DownstreamServiceException;
import com.fh_wedel.workflow.exception.ReviewAlreadySubmittedException;
import com.fh_wedel.workflow.model.api.*;
import com.fh_wedel.workflow.service.WorkflowService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@org.springframework.web.bind.annotation.RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController implements WorkflowPluginsApi, WorkflowRulesApi, WorkflowReviewsApi {

    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;
    private final HttpServletRequest requestContext;

    @Override
    public ResponseEntity<List<WorkflowPluginDto>> listPlugins() {
        return ResponseEntity.ok(workflowService.listPlugins());
    }

    @Override
    public ResponseEntity<WorkflowPluginDto> getPlugin(String pluginName) {
        return ResponseEntity.ok(workflowService.getPlugin(pluginName));
    }

    @Override
    public ResponseEntity<WorkflowRulesDto> getPluginRules(String pluginName) {
        return ResponseEntity.ok(workflowService.getPluginRules(pluginName));
    }

    @Override
    public ResponseEntity<WorkflowRulesDto> getRulesForSubmission(String submissionId) {
        return ResponseEntity.ok(workflowService.getRulesForSubmission(submissionId));
    }

    @Override
    public ResponseEntity<List<ReviewQuestionDto>> getFeedbackFormForSubmission(String submissionId) {
        List<com.fh_wedel.workflow.api.model.ReviewQuestion> form = workflowService.getFeedbackFormForSubmission(submissionId);
        List<ReviewQuestionDto> dtoList = form.stream().map(q -> {
            ReviewQuestionDto dto = new ReviewQuestionDto();
            dto.setId(q.id());
            dto.setText(q.text());
            dto.setType(ReviewQuestionDto.TypeEnum.fromValue(q.type().name()));
            dto.setMaxPoints(q.maxPoints());
            dto.setRequired(q.required());
            dto.setOptions(q.options());
            return dto;
        }).toList();
        return ResponseEntity.ok(dtoList);
    }

    @Override
    public ResponseEntity<SubmitReviewResponseDto> submitReview(String submissionId, SubmitReviewRequest request) {
        String reviewerId = getReviewerIdFromHeaders();
        if (reviewerId == null) {
            return ResponseEntity.status(401).build();
        }

        List<com.fh_wedel.workflow.api.model.ReviewResponse> domainResponses = request.getResponses().stream()
                .map(r -> new com.fh_wedel.workflow.api.model.ReviewResponse(
                        r.getQuestionId(),
                        r.getTextValue(),
                        r.getNumericValue(),
                        r.getSelectedOption()
                ))
                .toList();

        com.fh_wedel.workflow.api.model.ReviewGrade grade = workflowService.submitReview(submissionId, reviewerId, domainResponses);

        SubmitReviewResponseDto response = new SubmitReviewResponseDto();
        response.setTotalPoints(grade.totalPoints());
        response.setMaxPossiblePoints(grade.maxPossiblePoints());
        response.setPercentage(java.math.BigDecimal.valueOf(grade.percentage()));
        response.setSummary(grade.summary());

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<ReviewStatusDto> getReviewStatus(String submissionId) {
        com.fh_wedel.workflow.model.ReviewSession session = workflowService.getReviewStatus(submissionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        ReviewStatusDto dto = new ReviewStatusDto();
        dto.setSubmissionId(session.getSubmissionId());
        dto.setTotalExpected(session.getTotalExpected());
        dto.setReceivedCount(session.getReceivedReviewCount());
        dto.setComplete(session.isComplete());

        return ResponseEntity.ok(dto);
    }

    @Override
    public ResponseEntity<List<SubmittedReviewDto>> getReviewsForSubmission(String submissionId) {
        List<com.fh_wedel.workflow.model.SubmittedReview> reviews = workflowService.getReviewsForSubmission(submissionId);

        List<SubmittedReviewDto> dtoList = new ArrayList<>();
        for (com.fh_wedel.workflow.model.SubmittedReview review : reviews) {
            SubmittedReviewDto dto = new SubmittedReviewDto();
            dto.setSubmissionId(review.getSubmissionId());
            dto.setReviewerId(review.getReviewerId());
            dto.setTotalPoints(review.getTotalPoints());
            dto.setMaxPossiblePoints(review.getMaxPossiblePoints());
            dto.setPercentage(java.math.BigDecimal.valueOf(review.getPercentage()));
            dto.setGradeSummary(review.getGradeSummary());
            if (review.getSubmittedAt() != null) {
                dto.setSubmittedAt(review.getSubmittedAt().atOffset(ZoneOffset.UTC));
            }

            try {
                List<com.fh_wedel.workflow.api.model.ReviewResponse> responses = objectMapper.readValue(
                        review.getResponsesJson(),
                        new TypeReference<>() {
                        }
                );
                List<ReviewResponseDto> responseDtos = responses.stream().map(r -> {
                    ReviewResponseDto rDto = new ReviewResponseDto();
                    rDto.setQuestionId(r.questionId());
                    rDto.setTextValue(r.textValue());
                    rDto.setNumericValue(r.numericValue());
                    rDto.setSelectedOption(r.selectedOption());
                    return rDto;
                }).toList();
                dto.setResponses(responseDtos);
            } catch (Exception e) {
                dto.setResponses(new ArrayList<>());
            }

            dtoList.add(dto);
        }

        return ResponseEntity.ok(dtoList);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNotFoundException(NoSuchElementException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }

    @ExceptionHandler(ReviewAlreadySubmittedException.class)
    public ResponseEntity<String> handleReviewAlreadySubmittedException(ReviewAlreadySubmittedException ex) {
        return ResponseEntity.status(409).body(ex.getMessage());
    }

    @ExceptionHandler(DownstreamServiceException.class)
    public ResponseEntity<String> handleDownstreamServiceException(DownstreamServiceException ex) {
        return ResponseEntity.status(502).body(ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<String> handleBadRequestException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    private String getReviewerIdFromHeaders() {
        String principalId = requestContext.getHeader("x-auth-principal-id");
        if (principalId == null || principalId.isBlank()) {
            return null;
        }

        String cleanPrincipalId = principalId;
        int firstQuote = principalId.indexOf('"');
        int lastQuote = principalId.lastIndexOf('"');
        if (firstQuote >= 0 && lastQuote > firstQuote) {
            cleanPrincipalId = principalId.substring(firstQuote + 1, lastQuote);
        }

        int pipeIndex = cleanPrincipalId.lastIndexOf('|');
        if (pipeIndex >= 0) {
            return cleanPrincipalId.substring(pipeIndex + 1);
        }
        return cleanPrincipalId;
    }
}
