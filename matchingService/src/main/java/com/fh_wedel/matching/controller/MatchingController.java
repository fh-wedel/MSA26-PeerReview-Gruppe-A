package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.api.AssignmentEntry;
import com.fh_wedel.matching.model.api.ExaminerMatchResponse;
import com.fh_wedel.matching.model.api.MatchEntry;
import com.fh_wedel.matching.model.api.SubmissionMatchResponse;
import com.fh_wedel.matching.client.UserServiceClient;
import com.fh_wedel.matching.client.UserProfile;
import com.fh_wedel.matching.service.MatchingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fh_wedel.matching.model.api.WorkflowRulesDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

/**
 * REST controller for querying match information.
 * Provides endpoints to look up matches by submission or by examiner.
 */
@RestController
@RequestMapping("/api/matching")
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;
    private final UserServiceClient userServiceClient;
    private final RestTemplate restTemplate;
    private final String workflowServiceUrl;

    public MatchingController(MatchingService matchingService, 
                              UserServiceClient userServiceClient,
                              RestTemplate restTemplate,
                              @Value("${aws.workflow-service.url:http://workflow.internal.services:8081}") String workflowServiceUrl) {
        this.matchingService = matchingService;
        this.userServiceClient = userServiceClient;
        this.restTemplate = restTemplate;
        this.workflowServiceUrl = workflowServiceUrl;
    }

    @GetMapping("/matches/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Author', 'Reviewer')")
    public ResponseEntity<SubmissionMatchResponse> getMatchesBySubmission(
            @PathVariable String submissionId,
            Authentication authentication) {

        log.info("Request received: GET /matches/submissions/{}", submissionId);

        SubmissionStatusRecord status = matchingService.getStatusBySubmission(submissionId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        String submitterSub = status.getSubmitterId();
        List<MatchRecord> matches = matchingService.getMatchesBySubmission(submissionId);

        boolean isExaminer = matches.stream()
                .anyMatch(m -> m.getExaminerId().equals(extractSubFromDetails(authentication)));

        if (!isAdminOrOfficer(authentication) && !isCallerSub(authentication, submitterSub) && !isExaminer) {
            log.warn("Access Denied: caller '{}' (details: '{}') does not match submitter sub '{}' and is not an examiner for submission {}",
                    authentication.getName(), authentication.getDetails(), submitterSub, submissionId);
            return ResponseEntity.notFound().build();
        }

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

        Map<String, String> examinerIdToUserNameMap = new HashMap<>();
        List<UserProfile> allReviewers = userServiceClient.listReviewers();
        if (allReviewers != null) {
            allReviewers.forEach(user -> {
                examinerIdToUserNameMap.put(user.getSub(), user.getUsername());
            });
        }

        List<MatchEntry> matchEntries = matches.stream()
                .map(m -> {
                    MatchEntry entry = new MatchEntry();
                    entry.setExaminerId(hide ? null : m.getExaminerId());
                    entry.setExaminerUsername(hide ? null : examinerIdToUserNameMap.get(m.getExaminerId()));
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
        
        try {
            response.setSubmitterUsername(userServiceClient.getUserBySub(status.getSubmitterId()).getUsername());
        } catch (Exception e) {
            response.setSubmitterUsername("Unknown");
        }
        
        response.setMatches(matchEntries);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/matches/examiners/{examinerUsername}")
    @PreAuthorize("hasAnyRole('Admin', 'Reviewer')")
    public ResponseEntity<ExaminerMatchResponse> getMatchesByExaminer(
            @PathVariable String examinerUsername,
            Authentication authentication) {

        log.info("Request received: GET /matches/examiners/{} (username)", examinerUsername);

        String examinerSub;
        try {
            UserProfile examinerUser = userServiceClient.getUserDetails(examinerUsername);
            examinerSub = examinerUser.getSub();
            if (examinerSub == null) {
                log.warn("Cognito user '{}' (username) has no 'sub' attribute", examinerUsername);
                return ResponseEntity.notFound().build();
            }
            log.debug("Resolved examiner username '{}' → sub UUID '{}'", examinerUsername, examinerSub);
        } catch (Exception e) {
            log.warn("Examiner username '{}' not found in Cognito", examinerUsername);
            return ResponseEntity.notFound().build();
        }

        if (!isAdminOrOfficer(authentication) && !isCallerSub(authentication, examinerSub)) {
            log.warn("Access Denied: caller '{}' (details: '{}') does not match examiner sub '{}' (username: '{}')",
                    authentication.getName(), authentication.getDetails(), examinerSub, examinerUsername);
            return ResponseEntity.notFound().build();
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
        response.setExaminerId(examinerSub);
        response.setExaminerUsername(examinerUsername);
        response.setAssignments(assignments);

        return ResponseEntity.ok(response);
    }

    private boolean isAdminOrOfficer(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin")
                        || a.getAuthority().equals("ROLE_ExaminationOfficer"));
    }

    private boolean isCallerSub(Authentication auth, String targetSub) {
        if (auth == null || targetSub == null) return false;
        String callerSub = extractSubFromDetails(auth);
        return targetSub.equals(callerSub);
    }

    private String extractSubFromDetails(Authentication auth) {
        if (auth.getDetails() == null) return null;
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
