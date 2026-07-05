package com.fh_wedel.matching.controller;

import com.fh_wedel.configuration.client.api.SubmissionRulesApi;
import com.fh_wedel.configuration.client.model.ReviewRulesDto;
import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.model.api.ExaminerMatchResponse;
import com.fh_wedel.matching.model.api.SubmissionMatchResponse;
import com.fh_wedel.matching.service.MatchingService;
import com.fh_wedel.user.client.api.GroupsApi;
import com.fh_wedel.user.client.api.UsersApi;
import com.fh_wedel.user.client.model.BulkResolveRequest;
import com.fh_wedel.user.client.model.BulkResolveResponse;
import com.fh_wedel.user.client.model.UserSearchResponse;
import com.fh_wedel.user.client.model.UserSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MatchingControllerTest {

    @Mock
    private MatchingService matchingService;

    @Mock
    private GroupsApi groupsApi;

    @Mock
    private UsersApi usersApi;

    @Mock
    private SubmissionRulesApi configurationRulesApi;

    @InjectMocks
    private MatchingController matchingController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getMatchesBySubmission_Success() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("Admin");
        when(auth.getDetails()).thenReturn("\"pool|admin-id\"");
        
        // Mock Admin role
        org.springframework.security.core.GrantedAuthority authority = mock(org.springframework.security.core.GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        doReturn(List.of(authority)).when(auth).getAuthorities();

        SubmissionStatusRecord status = new SubmissionStatusRecord();
        status.setSubmissionId("sub-1");
        status.setStatus("MATCHED");
        status.setTimestamp(Instant.now());
        status.setSubmitterIds(List.of("author-id"));

        when(matchingService.getStatusBySubmission("sub-1")).thenReturn(status);

        MatchRecord match = new MatchRecord();
        match.setSubmissionId("sub-1");
        match.setExaminerId("examiner-id");
        match.setTimestamp(Instant.now());
        
        when(matchingService.getMatchesBySubmission("sub-1")).thenReturn(List.of(match));

        UserSummary authorSummary = new UserSummary();
        authorSummary.setUsername("author-name");
        when(usersApi.getUserBySub("author-id")).thenReturn(authorSummary);

        BulkResolveResponse bulkResolveResponse = new BulkResolveResponse();
        bulkResolveResponse.setUsers(Map.of("examiner-id", "examiner-name"));
        when(usersApi.bulkResolveUsers(any(BulkResolveRequest.class))).thenReturn(bulkResolveResponse);

        ReviewRulesDto rules = new ReviewRulesDto();
        rules.setReviewerAnonymous(false);
        when(configurationRulesApi.getRulesForSubmission("sub-1")).thenReturn(rules);

        ResponseEntity<SubmissionMatchResponse> response = matchingController.getMatchesBySubmission("sub-1", auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("sub-1", response.getBody().getSubmissionId());
        assertEquals(1, response.getBody().getMatches().size());
        assertEquals("examiner-id", response.getBody().getMatches().get(0).getExaminerId());
    }

    @Test
    void getMatchesBySubmission_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("Admin");
        when(matchingService.getStatusBySubmission("sub-1")).thenReturn(null);

        ResponseEntity<SubmissionMatchResponse> response = matchingController.getMatchesBySubmission("sub-1", auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getMatchesByExaminer_Success() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("Admin");
        
        org.springframework.security.core.GrantedAuthority authority = mock(org.springframework.security.core.GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        doReturn(List.of(authority)).when(auth).getAuthorities();

        UserSearchResponse searchResponse = new UserSearchResponse();
        UserSummary userSummary = new UserSummary();
        userSummary.setUsername("exam-user");
        userSummary.setSub("examiner-id");
        searchResponse.setUsers(List.of(userSummary));
        
        when(usersApi.searchUsers("exam-user")).thenReturn(searchResponse);

        MatchRecord match = new MatchRecord();
        match.setSubmissionId("sub-1");
        match.setTimestamp(Instant.now());
        when(matchingService.getMatchesByExaminer("examiner-id")).thenReturn(List.of(match));

        ResponseEntity<ExaminerMatchResponse> response = matchingController.getMatchesByExaminer("exam-user", auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("examiner-id", response.getBody().getExaminerId());
        assertEquals(1, response.getBody().getAssignments().size());
    }
    
    @Test
    void getMatchesByExaminer_NotFound() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(usersApi.searchUsers("unknown-user")).thenReturn(new UserSearchResponse());

        ResponseEntity<ExaminerMatchResponse> response = matchingController.getMatchesByExaminer("unknown-user", auth);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
