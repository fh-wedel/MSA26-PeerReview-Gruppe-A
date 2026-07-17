package com.fh_wedel.matching.controller;

import com.fh_wedel.configuration.client.api.SubmissionRulesApi;
import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.api.AssignmentEntry;
import com.fh_wedel.matching.model.api.ExaminerMatchResponse;
import com.fh_wedel.matching.model.api.MatchEntry;
import com.fh_wedel.matching.model.api.SubmissionMatchResponse;
import com.fh_wedel.matching.service.MatchingService;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.api.UsersApi;
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


/**
 * REST controller for querying match information.
 * Provides endpoints to look up matches by submission or by examiner.
 */
@RestController
@RequestMapping("/api/matching")
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;
    private final GroupsApi groupsApi;
    private final UsersApi usersApi;
    private final SubmissionRulesApi configurationRulesApi;

    public MatchingController(MatchingService matchingService, 
                              GroupsApi groupsApi,
                              UsersApi usersApi,
                              SubmissionRulesApi configurationRulesApi) {
        this.matchingService = matchingService;
        this.groupsApi = groupsApi;
        this.usersApi = usersApi;
        this.configurationRulesApi = configurationRulesApi;
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

        List<String> submitterSubs = status.getSubmitterIds();
        List<MatchRecord> matches = matchingService.getMatchesBySubmission(submissionId);

        String callerSub = extractSubFromDetails(authentication);

        boolean isExaminer = matches.stream()
                .anyMatch(m -> m.getExaminerId().equals(callerSub));

        boolean isCallerSubmitter = submitterSubs != null && submitterSubs.contains(callerSub);

        if (!isAdminOrOfficer(authentication) && !isCallerSubmitter && !isExaminer) {
            log.warn("Access Denied: caller '{}' (details: '{}') does not match submitter subs '{}' and is not an examiner for submission {}",
                    authentication.getName(), authentication.getDetails(), submitterSubs, submissionId);
            return ResponseEntity.notFound().build();
        }

        final boolean hide = resolveAnonymityRule(submissionId, authentication);

        Map<String, String> examinerIdToUserNameMap = resolveExaminerUsernameMap(matches);
        List<MatchEntry> matchEntries = buildMatchEntries(matches, hide, examinerIdToUserNameMap, callerSub);

        SubmissionMatchResponse response = new SubmissionMatchResponse();
        response.setSubmissionId(status.getSubmissionId());
        response.setStatus(SubmissionMatchResponse.StatusEnum.valueOf(status.getStatus()));
        response.setMatchedAt(status.getTimestamp().atOffset(ZoneOffset.UTC));
        response.setReason(status.getReason());
        response.setNumberOfExaminers(status.getNumberOfExaminers());
        response.setSubmitterIds(submitterSubs);
        
        List<String> usernames = resolveSubmitterUsernames(submitterSubs);
        response.setSubmitterUsernames(usernames);
        
        response.setMatches(matchEntries);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/matches/examiners/{examinerUsername}")
    @PreAuthorize("hasAnyRole('Admin', 'Reviewer')")
    public ResponseEntity<ExaminerMatchResponse> getMatchesByExaminer(
            @PathVariable String examinerUsername,
            Authentication authentication) {

        log.info("Request received: GET /matches/examiners/{} (username)", examinerUsername);

        String examinerSub = null;
        try {
            com.fh_wedel.user.client.model.UserSearchResponse searchResponse = usersApi.searchUsers(examinerUsername);
            if (searchResponse != null && searchResponse.getUsers() != null) {
                examinerSub = searchResponse.getUsers().stream()
                        .filter(u -> examinerUsername.equals(u.getUsername()))
                        .map(com.fh_wedel.user.client.model.UserSummary::getSub)
                        .findFirst()
                        .orElse(null);
            }
            if (examinerSub == null) {
                log.warn("Examiner username '{}' not found in Cognito", examinerUsername);
                return ResponseEntity.notFound().build();
            }
            log.debug("Resolved examiner username '{}' → sub UUID '{}'", examinerUsername, examinerSub);
        } catch (Exception e) {
            log.warn("Error looking up examiner username '{}'", examinerUsername, e);
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

    private boolean resolveAnonymityRule(String submissionId, Authentication authentication) {
        if (isAdminOrOfficer(authentication)) {
            return false;
        }
        try {
            com.fh_wedel.configuration.client.model.ReviewRulesDto rules = configurationRulesApi.getRulesForSubmission(submissionId);
            if (rules != null && Boolean.TRUE.equals(rules.getReviewerAnonymous())) {
                return true;
            }
        } catch (Exception e) {
            log.warn("Failed to delete/fetch workflow rules for submission {}, defaulting to hiding examiner", submissionId, e);
            return true;
        }
        return false;
    }

    private Map<String, String> resolveExaminerUsernameMap(List<MatchRecord> matches) {
        Map<String, String> examinerIdToUserNameMap = new HashMap<>();
        if (matches != null && !matches.isEmpty()) {
            try {
                List<String> examinerIds = matches.stream()
                        .map(MatchRecord::getExaminerId)
                        .distinct()
                        .toList();

                com.fh_wedel.user.client.model.BulkResolveRequest request = new com.fh_wedel.user.client.model.BulkResolveRequest();
                request.setSubs(examinerIds);
                var response = usersApi.bulkResolveUsers(request);
                
                if (response != null && response.getUsers() != null) {
                    examinerIdToUserNameMap.putAll(response.getUsers());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch reviewer usernames", e);
            }
        }
        return examinerIdToUserNameMap;
    }

    private List<MatchEntry> buildMatchEntries(List<MatchRecord> matches, boolean hide, Map<String, String> examinerIdToUserNameMap, String callerSub) {
        return matches.stream()
                .map(m -> {
                    MatchEntry entry = new MatchEntry();
                    boolean hideForThisMatch = hide && !m.getExaminerId().equals(callerSub);
                    entry.setExaminerId(hideForThisMatch ? null : m.getExaminerId());
                    entry.setExaminerUsername(hideForThisMatch ? null : examinerIdToUserNameMap.get(m.getExaminerId()));
                    entry.setAssignedAt(m.getTimestamp().atOffset(ZoneOffset.UTC));
                    return entry;
                })
                .toList();
    }

    private List<String> resolveSubmitterUsernames(List<String> submitterSubs) {
        List<String> usernames = new java.util.ArrayList<>();
        if (submitterSubs != null) {
            for (String sub : submitterSubs) {
                try {
                    usernames.add(usersApi.getUserBySub(sub).getUsername());
                } catch (Exception e) {
                    usernames.add("Unknown");
                }
            }
        }
        return usernames;
    }
}
