package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.api.AssignmentEntry;
import com.fh_wedel.matching.model.api.ExaminerMatchResponse;
import com.fh_wedel.matching.model.api.MatchEntry;
import com.fh_wedel.matching.model.api.SubmissionMatchResponse;
import com.fh_wedel.matching.service.MatchingService;
import com.fh_wedel.matching.service.CognitoService;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.util.List;

/**
 * REST controller for querying match information.
 * Provides endpoints to look up matches by submission or by examiner.
 */
@RestController
@RequestMapping("/api/matching")
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;
    private final CognitoService cognitoService;

    public MatchingController(MatchingService matchingService, CognitoService cognitoService) {
        this.matchingService = matchingService;
        this.cognitoService = cognitoService;
    }

    /**
     * Returns all matched reviewers and the matching status for a given submission.
     */
    @GetMapping("/matches/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author')")
    public ResponseEntity<SubmissionMatchResponse> getMatchesBySubmission(@PathVariable String submissionId, Authentication authentication) {
        log.info("Request received: GET /matches/submissions/{}", submissionId);

        SubmissionStatusRecord status = matchingService.getStatusBySubmission(submissionId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        String resolvedSubmitterId = status.getSubmitterId();
        if (resolvedSubmitterId != null && !resolvedSubmitterId.isEmpty()) {
            try {
                AdminGetUserResponse submitter = cognitoService.getUser(resolvedSubmitterId);
                if (submitter != null) {
                    String sub = CognitoService.extractAttribute(submitter, "sub");
                    if (sub != null) {
                        resolvedSubmitterId = sub;
                    }
                }
            } catch (UserNotFoundException e) {
                log.warn("Submitter {} not found in Cognito", resolvedSubmitterId);
            }
        }

        if (!isAdminOrOfficer(authentication) && !isCurrentUser(authentication, resolvedSubmitterId)) {
            log.warn("Access Denied: User is not the author of submission {}", submissionId);
            throw new AccessDeniedException("Access Denied: You are not the author of this submission.");
        }

        List<MatchRecord> matches = matchingService.getMatchesBySubmission(submissionId);

        List<MatchEntry> matchEntries = matches.stream()
                .map(m -> {
                    MatchEntry entry = new MatchEntry();
                    entry.setExaminerId(m.getExaminerId());
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
        response.setSubmitterId(status.getSubmitterId());
        response.setMatches(matchEntries);

        return ResponseEntity.ok(response);
    }

    /**
     * Returns all submissions assigned to a specific examiner.
     */
    @GetMapping("/matches/examiners/{examinerId}")
    @PreAuthorize("hasAnyRole('Admin', 'Reviewer')")
    public ResponseEntity<ExaminerMatchResponse> getMatchesByExaminer(@PathVariable String examinerId, Authentication authentication) {
        log.info("Request received: GET /matches/examiners/{}", examinerId);

        String resolvedExaminerId = examinerId;
        try {
            AdminGetUserResponse user = cognitoService.getUser(examinerId);
            String sub = CognitoService.extractAttribute(user, "sub");
            if (sub != null) {
                resolvedExaminerId = sub;
            }
        } catch (UserNotFoundException e) {
            log.warn("Examiner {} not found in Cognito", examinerId);
            return ResponseEntity.notFound().build();
        }

        if (!isAdminOrOfficer(authentication) && !isCurrentUser(authentication, resolvedExaminerId)) {
            log.warn("Access Denied: User attempted to fetch matches for examiner {}", examinerId);
            throw new AccessDeniedException("Access Denied: You can only access your own matches.");
        }

        List<MatchRecord> matches = matchingService.getMatchesByExaminer(resolvedExaminerId);

        List<AssignmentEntry> assignments = matches.stream()
                .map(m -> {
                    AssignmentEntry entry = new AssignmentEntry();
                    entry.setSubmissionId(m.getSubmissionId());
                    entry.setAssignedAt(m.getTimestamp().atOffset(ZoneOffset.UTC));
                    return entry;
                })
                .toList();

        ExaminerMatchResponse response = new ExaminerMatchResponse();
        response.setExaminerId(resolvedExaminerId);
        response.setAssignments(assignments);

        return ResponseEntity.ok(response);
    }

    private boolean isAdminOrOfficer(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_ExaminationOfficer"));
    }

    private boolean isCurrentUser(Authentication auth, String targetUserId) {
        if (auth == null || auth.getDetails() == null || targetUserId == null) return false;
        String principalId = auth.getDetails().toString();
        return principalId.endsWith("|" + targetUserId) || principalId.equals(targetUserId);
    }
}
