package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.api.AssignmentEntry;
import com.fh_wedel.matching.model.api.ExaminerMatchResponse;
import com.fh_wedel.matching.model.api.MatchEntry;
import com.fh_wedel.matching.model.api.SubmissionMatchResponse;
import com.fh_wedel.matching.service.CognitoService;
import com.fh_wedel.matching.service.MatchingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

import java.time.ZoneOffset;
import java.util.List;

/**
 * REST controller for querying match information.
 * Provides endpoints to look up matches by submission or by examiner.
 *
 * <p><b>Identity convention used throughout this controller:</b>
 * <ul>
 *   <li><b>username</b> – The human-readable Cognito username (e.g. "Marcel").
 *       This is what callers pass as path parameters.</li>
 *   <li><b>userSub</b> – The opaque Cognito {@code sub} UUID (e.g. "b0ac99ec-e0a1-...").
 *       This is what DynamoDB and the JWT {@code auth.getName()} carry.</li>
 * </ul>
 */
import com.fh_wedel.matching.model.api.WorkflowRulesDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/matching")
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;
    private final CognitoService cognitoService;
    private final RestTemplate restTemplate;
    private final String workflowServiceUrl;

    public MatchingController(MatchingService matchingService, 
                              CognitoService cognitoService,
                              RestTemplate restTemplate,
                              @Value("${aws.workflow-service.url:http://workflow-service.internal.services:8080}") String workflowServiceUrl) {
        this.matchingService = matchingService;
        this.cognitoService = cognitoService;
        this.restTemplate = restTemplate;
        this.workflowServiceUrl = workflowServiceUrl;
    }

    /**
     * Returns all matched reviewers and the matching status for a given submission.
     *
     * <p>Access is granted to Admins, ExaminationOfficers, and the submitter themselves.
     * The submitter is identified by comparing the Cognito {@code sub} UUID stored in DynamoDB
     * against the {@code sub} UUID carried in the caller's JWT ({@code auth.getName()}).
     * No Cognito lookup is required because both sides already use the UUID.
     */
    @GetMapping("/matches/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author')")
    public ResponseEntity<SubmissionMatchResponse> getMatchesBySubmission(
            @PathVariable String submissionId,
            Authentication authentication) {

        log.info("Request received: GET /matches/submissions/{}", submissionId);

        SubmissionStatusRecord status = matchingService.getStatusBySubmission(submissionId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        // DynamoDB stores the submitter's Cognito sub UUID — compare directly against the
        // JWT sub UUID from auth.getName(). No Cognito AdminGetUser call needed here
        // because AdminGetUser accepts usernames, not sub UUIDs.
        String submitterSub = status.getSubmitterId();

        if (!isAdminOrOfficer(authentication) && !isCallerSub(authentication, submitterSub)) {
            log.warn("Access Denied: caller '{}' (details: '{}') does not match submitter sub '{}' for submission {}",
                    authentication.getName(), authentication.getDetails(), submitterSub, submissionId);
            throw new AccessDeniedException("Access Denied: You are not the author of this submission.");
        }

        List<MatchRecord> matches = matchingService.getMatchesBySubmission(submissionId);

        boolean hideExaminer = false;
        if (!isAdminOrOfficer(authentication)) {
            try {
                WorkflowRulesDto rules = restTemplate.getForObject(
                        workflowServiceUrl + "/api/workflow/submissions/" + submissionId + "/rules",
                        WorkflowRulesDto.class
                );
                if (rules != null && Boolean.TRUE.equals(rules.getReviewerAnonymous())) {
                    hideExaminer = true;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch workflow rules for submission {}, defaulting to hiding examiner", submissionId, e);
                hideExaminer = true;
            }
        }
        
        final boolean hide = hideExaminer;

        List<MatchEntry> matchEntries = matches.stream()
                .map(m -> {
                    MatchEntry entry = new MatchEntry();
                    entry.setExaminerId(hide ? null : m.getExaminerId());   // stored as sub UUID in DynamoDB
                    entry.setAssignedAt(m.getTimestamp().atOffset(ZoneOffset.UTC));
                    return entry;
                })
                .toList();

        SubmissionMatchResponse response = new SubmissionMatchResponse();
        response.setSubmissionId(status.getSubmissionId());
        response.setStatus(SubmissionMatchResponse.StatusEnum.valueOf(status.getStatus()));
        response.setMatchedAt(status.getTimestamp().atOffset(ZoneOffset.UTC));
        response.setReason(status.getReason());
        response.setNumberOfExaminers(status.getNumberOfExaminers());
        response.setSubmitterId(status.getSubmitterId());     // sub UUID
        response.setMatches(matchEntries);

        return ResponseEntity.ok(response);
    }

    /**
     * Returns all submissions assigned to a specific examiner.
     *
     * <p>The {@code examinerUsername} path parameter is the human-readable Cognito username
     * (e.g. "Marcel"), <em>not</em> the sub UUID. The service resolves the username to its
     * sub UUID via Cognito ({@code AdminGetUser}) before querying DynamoDB and before
     * performing the access check against the caller's JWT sub.
     */
    @GetMapping("/matches/examiners/{examinerUsername}")
    @PreAuthorize("hasAnyRole('Admin', 'Reviewer')")
    public ResponseEntity<ExaminerMatchResponse> getMatchesByExaminer(
            @PathVariable String examinerUsername,
            Authentication authentication) {

        log.info("Request received: GET /matches/examiners/{} (username)", examinerUsername);

        // Resolve the human-readable username → Cognito sub UUID for DynamoDB lookup
        // and access-control comparison.
        String examinerSub;
        try {
            AdminGetUserResponse examinerUser = cognitoService.getUser(examinerUsername);
            examinerSub = CognitoService.extractAttribute(examinerUser, "sub");
            if (examinerSub == null) {
                log.warn("Cognito user '{}' (username) has no 'sub' attribute", examinerUsername);
                return ResponseEntity.notFound().build();
            }
            log.debug("Resolved examiner username '{}' → sub UUID '{}'", examinerUsername, examinerSub);
        } catch (UserNotFoundException e) {
            log.warn("Examiner username '{}' not found in Cognito", examinerUsername);
            return ResponseEntity.notFound().build();
        }

        // The caller's JWT sub UUID must match the resolved examiner sub UUID
        // (or the caller must be an Admin/ExaminationOfficer).
        if (!isAdminOrOfficer(authentication) && !isCallerSub(authentication, examinerSub)) {
            log.warn("Access Denied: caller '{}' (details: '{}') does not match examiner sub '{}' (username: '{}')",
                    authentication.getName(), authentication.getDetails(), examinerSub, examinerUsername);
            throw new AccessDeniedException("Access Denied: You can only access your own matches.");
        }

        List<MatchRecord> matches = matchingService.getMatchesByExaminer(examinerSub);

        List<AssignmentEntry> assignments = matches.stream()
                .map(m -> {
                    AssignmentEntry entry = new AssignmentEntry();
                    entry.setSubmissionId(m.getSubmissionId());
                    entry.setAssignedAt(m.getTimestamp().atOffset(ZoneOffset.UTC));
                    return entry;
                })
                .toList();

        ExaminerMatchResponse response = new ExaminerMatchResponse();
        response.setExaminerId(examinerSub);   // return the sub UUID in the response body
        response.setAssignments(assignments);

        return ResponseEntity.ok(response);
    }

    /**
     * Returns {@code true} if the authenticated caller holds an Admin or ExaminationOfficer role.
     */
    private boolean isAdminOrOfficer(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin")
                        || a.getAuthority().equals("ROLE_ExaminationOfficer"));
    }

    /**
     * Returns {@code true} if the authenticated caller's Cognito sub UUID matches
     * the given {@code targetSub}.
     *
     * <p>The {@link AuthHeaderFilter} populates the {@code Authentication} as follows:
     * <ul>
     *   <li>{@code auth.getName()} → Cognito <b>username</b> (e.g. "Marcel")</li>
     *   <li>{@code auth.getDetails()} → the {@code x-auth-principal-id} header,
     *       formatted as {@code "poolId|subUUID"} (e.g. "eu-central-1_abc|b0ac99ec-...")</li>
     * </ul>
     * DynamoDB stores the sub UUID, so we extract it from the details string.
     *
     * @param auth      the current authentication token
     * @param targetSub the Cognito sub UUID to compare against (from DynamoDB)
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
     * <p>The value is a Cedar entity identifier in the format:
     * {@code PeerReview::User::"poolId|subUUID"}
     * <br>We extract the content between the quotes, then take the part after the {@code |}.
     * <p>Falls back gracefully if the format is just {@code "poolId|subUUID"} (no Cedar prefix)
     * or a bare UUID.
     */
    private String extractSubFromDetails(Authentication auth) {
        if (auth.getDetails() == null) return null;
        String raw = auth.getDetails().toString();

        // Extract the content between the outermost double quotes, if present.
        // e.g. PeerReview::User::"eu-north-1_xxx|b0ac99ec-..." → eu-north-1_xxx|b0ac99ec-...
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner;
        if (firstQuote >= 0 && lastQuote > firstQuote) {
            inner = raw.substring(firstQuote + 1, lastQuote);
        } else {
            inner = raw;
        }

        // Split on | and take the sub UUID (the part after the pipe).
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
