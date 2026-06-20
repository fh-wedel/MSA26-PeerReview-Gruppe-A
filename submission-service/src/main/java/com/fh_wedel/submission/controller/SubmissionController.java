package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submission")
@Slf4j
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/submissions")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<Submission> createSubmission(
            @Valid @RequestBody CreateSubmissionRequest request,
            Authentication authentication) {

        log.info("Request received: POST /submissions (configId={}, title={})",
                request.getConfigurationId(), request.getTitle());

        String authorId = extractSubFromDetails(authentication);
        Submission submission = submissionService.createSubmission(
                request.getConfigurationId(), authorId, request.getTitle());

        return ResponseEntity.status(HttpStatus.CREATED).body(submission);
    }

    @PostMapping("/submissions/{id}/presigned-url")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author')")
    public ResponseEntity<PresignedUrlResponse> getPresignedUploadUrl(
            @PathVariable String id,
            @Valid @RequestBody PresignedUrlRequest request,
            Authentication authentication) {

        log.info("Request received: POST /submissions/{}/presigned-url (fileName={})", id, request.getFileName());

        String authorId = extractSubFromDetails(authentication);
        PresignedUrlResponse response = submissionService.generatePresignedUploadUrl(
                id, authorId, request.getFileName(), request.getContentType());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/submissions/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author')")
    public ResponseEntity<Submission> updateSubmission(
            @PathVariable String id,
            @RequestBody UpdateSubmissionRequest request,
            Authentication authentication) {

        log.info("Request received: PUT /submissions/{}", id);

        String authorId = extractSubFromDetails(authentication);
        Submission submission = submissionService.updateSubmission(id, authorId, request);

        if (submission == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(submission);
    }

    @PostMapping("/submissions/{id}/submit")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author')")
    public ResponseEntity<Submission> submitSubmission(
            @PathVariable String id,
            Authentication authentication) {

        log.info("Request received: POST /submissions/{}/submit", id);

        String authorId = extractSubFromDetails(authentication);
        Submission submission = submissionService.submitSubmission(id, authorId);

        if (submission == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/submissions/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<Submission> getSubmission(
            @PathVariable String id,
            Authentication authentication) {

        Submission submission = submissionService.getSubmission(id);
        if (submission == null) {
            return ResponseEntity.notFound().build();
        }

        String callerSub = extractSubFromDetails(authentication);
        if (isOnlyAuthor(authentication) && !submission.getAuthorId().equals(callerSub)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(submission);
    }

    @GetMapping("/submissions")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<List<Submission>> listSubmissions(Authentication authentication) {
        String callerSub = extractSubFromDetails(authentication);
        List<Submission> submissions = submissionService.getSubmissionsByAuthor(callerSub);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/submissions/{id}/documents")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<List<DocumentRecord>> getDocuments(
            @PathVariable String id,
            Authentication authentication) {

        Submission submission = submissionService.getSubmission(id);
        if (submission == null) {
            return ResponseEntity.notFound().build();
        }

        String callerSub = extractSubFromDetails(authentication);
        if (isOnlyAuthor(authentication) && !submission.getAuthorId().equals(callerSub)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(submissionService.getDocuments(id));
    }

    @GetMapping("/submissions/{id}/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<PresignedUrlResponse> getPresignedDownloadUrl(
            @PathVariable String id,
            @PathVariable String documentId,
            Authentication authentication) {

        log.info("Request received: GET /submissions/{}/documents/{}/download", id, documentId);

        Submission submission = submissionService.getSubmission(id);
        if (submission == null) {
            return ResponseEntity.notFound().build();
        }

        String callerSub = extractSubFromDetails(authentication);
        if (isOnlyAuthor(authentication) && !submission.getAuthorId().equals(callerSub)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String downloadUrl = submissionService.getPresignedDownloadUrl(id, documentId);
        PresignedUrlResponse response = new PresignedUrlResponse(downloadUrl, documentId, null);
        return ResponseEntity.ok(response);
    }

    private boolean isOnlyAuthor(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        boolean hasAuthor = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Author"));
        boolean hasHigherRole = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin")
                        || a.getAuthority().equals("ROLE_ExaminationOfficer")
                        || a.getAuthority().equals("ROLE_Teacher")
                        || a.getAuthority().equals("ROLE_Reviewer"));
        return hasAuthor && !hasHigherRole;
    }

    private String extractSubFromDetails(Authentication auth) {
        if (auth == null || auth.getDetails() == null) return null;
        String raw = auth.getDetails().toString();

        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner;
        if (firstQuote >= 0 && lastQuote > firstQuote) {
            inner = raw.substring(firstQuote + 1, lastQuote);
        } else {
            inner = raw;
        }

        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
