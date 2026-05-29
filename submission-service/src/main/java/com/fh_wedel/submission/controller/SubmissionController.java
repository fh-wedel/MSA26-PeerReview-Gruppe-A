package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.dto.*;
import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.service.SubmissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/submission")
@Slf4j
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/status")
    public String getStatus() {
        log.info("Request received for Status endpoint");
        return submissionService.getServiceStatus();
    }

    @GetMapping("/time")
    public String getCurrentTime(
            @RequestHeader(value = "x-auth-username", required = false) String username,
            @RequestHeader(value = "x-auth-groups", required = false) String groups) {
        log.info("Request received for Time endpoint");
        return submissionService.getCurrentTimeWithIdentity(username, groups);
    }

    // 1. POST /api/submission/configurations -> Create configuration
    @PostMapping("/configurations")
    public ResponseEntity<SubmissionConfiguration> createConfiguration(
            @RequestBody SubmissionConfigurationCreateDto dto,
            @RequestHeader(value = "x-auth-username", required = false) String username,
            @RequestHeader(value = "x-auth-groups", required = false) String groups) {
        log.info("Creating submission configuration by {}", username);
        
        // Assert authorization: only Reviewer or ExamOffice can create submission configurations
        boolean isAuthorized = groups != null && (groups.contains("Reviewer") || groups.contains("ExamOffice") || groups.contains("Admin"));
        if (!isAuthorized && dto.getCreatedByType() != CreatedByType.AUTHOR) {
            return ResponseEntity.status(403).build();
        }

        SubmissionConfiguration config = submissionService.createConfiguration(dto);
        return ResponseEntity.ok(config);
    }

    // 2. POST /api/submission/submissions -> Create submission (co-authored or student self-assignment)
    @PostMapping("/submissions")
    public ResponseEntity<Submission> createSubmission(
            @RequestBody SubmissionCreateDto dto,
            @RequestHeader(value = "x-auth-username") String username) {
        log.info("Creating new submission for user {}", username);
        try {
            Submission submission = submissionService.createSubmission(dto, username);
            return ResponseEntity.ok(submission);
        } catch (IllegalStateException e) {
            log.warn("Submission initialization failed: {}", e.getMessage());
            return ResponseEntity.status(400).build();
        }
    }

    // 3. POST /api/submission/submissions/{id}/presigned-url -> S3 presigned url
    @PostMapping("/submissions/{id}/presigned-url")
    public ResponseEntity<PresignedUrlResponseDto> generatePresignedUrl(
            @PathVariable("id") UUID submissionId,
            @RequestBody PresignedUrlRequestDto dto,
            @RequestHeader(value = "x-auth-username") String username) {
        log.info("Generating presigned upload url for submission {} and user {}", submissionId, username);
        try {
            PresignedUrlResponseDto response = submissionService.generatePresignedUrl(submissionId, username, dto);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).build();
        }
    }

    // 4. PUT /api/submission/submissions/{id} -> Update submission details (files, abstract, title)
    @PutMapping("/submissions/{id}")
    public ResponseEntity<Submission> updateSubmission(
            @PathVariable("id") UUID submissionId,
            @RequestParam("title") String title,
            @RequestParam("abstractText") String abstractText,
            @RequestParam(value = "fileS3Key", required = false) String fileS3Key,
            @RequestParam(value = "additionalS3Keys", required = false) List<String> additionalS3Keys,
            @RequestHeader(value = "x-auth-username") String username) {
        log.info("Updating submission {} details by user {}", submissionId, username);
        try {
            Submission updated = submissionService.updateSubmission(submissionId, username, title, abstractText, fileS3Key, additionalS3Keys);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).build();
        }
    }

    // 5. POST /api/submission/submissions/{id}/submit -> Finalize and Lock Submission
    @PostMapping("/submissions/{id}/submit")
    public ResponseEntity<Submission> submitWork(
            @PathVariable("id") UUID submissionId,
            @RequestHeader(value = "x-auth-username") String username) {
        log.info("Submitting finalized work for submission {}", submissionId);
        try {
            Submission submitted = submissionService.submitWork(submissionId, username);
            return ResponseEntity.ok(submitted);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(400).build();
        }
    }

    // 6. GET /api/submission/configurations/{id}/grading-form -> Fetch criteria
    @GetMapping("/configurations/{id}/grading-form")
    public ResponseEntity<GradingCriteriaForm> getGradingCriteria(
            @PathVariable("id") UUID configId,
            @RequestHeader(value = "x-auth-username") String username,
            @RequestHeader(value = "x-auth-groups", required = false) String groups) {
        log.info("Fetching grading criteria details for configuration {}", configId);
        try {
            boolean isAuthor = groups != null && groups.contains("Author");
            GradingCriteriaForm form = submissionService.getGradingCriteria(configId, username, isAuthor);
            return ResponseEntity.ok(form);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
