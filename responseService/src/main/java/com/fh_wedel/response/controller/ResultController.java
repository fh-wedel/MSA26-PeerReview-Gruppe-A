package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.model.SubmitReviewRequest;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.service.ResultService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for querying review results.
 *
 * <p><b>Ownership / access control:</b> Review results are private to the author
 * whose work was reviewed. Authors may only access their own results; the
 * {@code authorId} is derived from the authenticated caller's Cognito {@code sub}
 * rather than trusted blindly from a query parameter. Admins may query any
 * {@code authorId}. When an Author requests a foreign result we return
 * {@code 404 Not Found} (not {@code 403}) to avoid leaking the existence of
 * other authors' data — consistent with the matchingService convention.
 *
 * <p>The {@link com.fh_wedel.response.security.AuthHeaderFilter} populates the
 * {@code Authentication} so that {@code auth.getDetails()} carries the
 * {@code x-auth-principal-id} value (Cedar entity id {@code "poolId|subUUID"}),
 * from which the Cognito sub UUID is extracted.
 */
@RestController
@RequestMapping("/api/response")
@Slf4j
public class ResultController {

    private final ResultService resultService;
    private final com.fh_wedel.response.service.AiReviewOrchestrator aiReviewOrchestrator;

    public ResultController(ResultService resultService, com.fh_wedel.response.service.AiReviewOrchestrator aiReviewOrchestrator) {
        this.resultService = resultService;
        this.aiReviewOrchestrator = aiReviewOrchestrator;
    }

    @PostMapping("/results")
    @PreAuthorize("hasAnyRole('Admin', 'Reviewer')")
    public ResponseEntity<ReviewResultDto> submitReview(
            @RequestBody SubmitReviewRequest request,
            Authentication authentication) {

        String callerSub = extractSubFromDetails(authentication);

        if (callerSub == null || callerSub.isBlank()) {
            log.warn("Could not determine callerSub for caller '{}'",
                    authentication != null ? authentication.getName() : "anonymous");
            return ResponseEntity.badRequest().build();
        }
        if (!isAdmin(authentication) && !resultService.isAssignedReviewer(request.getSubmissionId(), callerSub)) {
            log.warn("Access denied: reviewer '{}' is not assigned to submission {}", callerSub, request.getSubmissionId());
            return ResponseEntity.status(403).build();
        }

        log.info("Submitting review for submission: {}", request.getSubmissionId());
        ReviewResult saved = resultService.submitReview(request, callerSub);
        return ResponseEntity.status(201).body(ReviewResultDto.from(saved));
    }

    @PostMapping("/results/{submissionId}/ai-review")
    @PreAuthorize("hasAnyRole('Admin', 'Author', 'Reviewer')")
    public ResponseEntity<ReviewResultDto> requestAiReview(
            @PathVariable String submissionId,
            Authentication authentication) {
        String callerSub = extractSubFromDetails(authentication);
        boolean hasAccess = isAdmin(authentication)
                || resultService.isAuthorOfSubmission(submissionId, callerSub)
                || resultService.isAssignedReviewer(submissionId, callerSub);

        if (!hasAccess) {
            log.warn("Access denied: caller '{}' cannot trigger AI review for submission {}",
                    authentication != null ? authentication.getName() : "anonymous", submissionId);
            return ResponseEntity.status(403).build();
        }

        log.info("Manual AI Review requested for submission: {}", submissionId);
        // Manual trigger has no S3 key; the listener will fetch it via the submission service API
        ReviewResult saved = aiReviewOrchestrator.requestReview(submissionId, null);
        return ResponseEntity.status(202).body(ReviewResultDto.from(saved));
    }

    @GetMapping("/results")
    @PreAuthorize("hasAnyRole('Admin', 'Author')")
    public ResponseEntity<List<ReviewResultDto>> getResultsByAuthor(
            @RequestParam(required = false) String authorId,
            Authentication authentication) {

        String callerSub = extractSubFromDetails(authentication);

        // Admins may query any authorId. Non-admins are forced to their own sub,
        // regardless of what they pass in the query parameter (prevents IDOR).
        String effectiveAuthorId = isAdmin(authentication) ? authorId : callerSub;

        if (effectiveAuthorId == null || effectiveAuthorId.isBlank()) {
            log.warn("Could not determine authorId for caller '{}'",
                    authentication != null ? authentication.getName() : "anonymous");
            return ResponseEntity.ok(List.of());
        }

        log.info("Fetching results for author: {}", effectiveAuthorId);
        return ResponseEntity.ok(resultService.findByAuthor(effectiveAuthorId));
    }

    @GetMapping("/results/{submissionId}")
    @PreAuthorize("hasAnyRole('Admin', 'Author', 'Reviewer')")
    public ResponseEntity<List<ReviewResultDto>> getResultBySubmission(
            @PathVariable String submissionId,
            Authentication authentication) {

        log.info("Fetching result for submission: {}", submissionId);
        List<ReviewResultDto> results = resultService.findResultsBySubmission(submissionId);
        String callerSub = extractSubFromDetails(authentication);

        if (isAdmin(authentication)) {
            return ResponseEntity.ok(results);
        }

        if (resultService.isAssignedReviewer(submissionId, callerSub)) {
            return ResponseEntity.ok(results);
        }

        if (resultService.isAuthorOfSubmission(submissionId, callerSub)) {
            int submittedHumanReviewsCount = (int) results.stream()
                    .filter(r -> !r.isAiGenerated() && r.completedAt() != null)
                    .count();
            if (resultService.isReviewComplete(submissionId, submittedHumanReviewsCount)) {
                return ResponseEntity.ok(results);
            } else {
                List<ReviewResultDto> aiOnlyResults = results.stream()
                        .filter(ReviewResultDto::isAiGenerated)
                        .toList();
                return ResponseEntity.ok(aiOnlyResults);
            }
        }

        log.warn("Access Denied: caller '{}' (details: '{}') is neither the author nor an assigned reviewer of submission {}",
                authentication.getName(), authentication.getDetails(), submissionId);
        return ResponseEntity.status(403).build();
    }

    @GetMapping("/results/{submissionId}/document")
    @PreAuthorize("hasAnyRole('Admin', 'Author', 'Reviewer')")
    public ResponseEntity<Map<String, String>> getDocumentUrl(
            @PathVariable String submissionId,
            Authentication authentication) {

        log.info("Generating document URL for submission: {}", submissionId);

        String callerSub = extractSubFromDetails(authentication);
        boolean hasAccess = isAdmin(authentication) ||
                resultService.isAssignedReviewer(submissionId, callerSub) ||
                resultService.isAuthorOfSubmission(submissionId, callerSub);

        if (!hasAccess) {
            log.warn("Access Denied: caller '{}' (details: '{}') is neither the author nor an assigned reviewer of submission {}",
                    authentication.getName(), authentication.getDetails(), submissionId);
            return ResponseEntity.status(403).build();
        }

        String url = resultService.getDocumentDownloadUrl(submissionId);
        return ResponseEntity.ok(Map.of("downloadUrl", url));
    }

    /**
     * Returns {@code true} if the authenticated caller holds the Admin role.
     */
    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin"));
    }

    /**
     * Returns {@code true} if the authenticated caller's Cognito sub UUID matches
     * the given {@code targetSub}.
     */
    private boolean isCallerSub(Authentication auth, String targetSub) {
        if (auth == null || targetSub == null) return false;
        String callerSub = extractSubFromDetails(auth);
        return targetSub.equals(callerSub);
    }

    /**
     * Extracts the Cognito sub UUID from the {@code x-auth-principal-id} value
     * stored in {@code auth.getDetails()}.
     *
     * <p>The value is a Cedar entity identifier in the format
     * {@code PeerReview::User::"poolId|subUUID"}. We extract the content between
     * the outermost double quotes, then take the part after the {@code |}.
     * Falls back gracefully if the format is just {@code "poolId|subUUID"} (no
     * Cedar prefix) or a bare UUID.
     */
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
