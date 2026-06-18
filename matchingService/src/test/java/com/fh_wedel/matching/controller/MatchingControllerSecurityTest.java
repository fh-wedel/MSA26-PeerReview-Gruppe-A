package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.service.MatchingService;
import com.fh_wedel.matching.client.UserServiceClient;
import com.fh_wedel.matching.client.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingControllerSecurityTest {

    @Mock
    private MatchingService matchingService;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private MatchingController controller;

    @BeforeEach
    void setUp() {
        controller = new MatchingController(matchingService, userServiceClient, restTemplate, "http://mock");
    }

    private Authentication createAuth(String role, String username, String sub) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails("PeerReview::User::\"pool123|" + sub + "\"");
        return auth;
    }

    @Test
    @DisplayName("Admin can access any submission")
    void getMatchesBySubmission_admin_success() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "other-user", MatchStatus.MATCHED, 1, null));
        when(matchingService.getMatchesBySubmission("sub-1"))
                .thenReturn(Collections.emptyList());
        UserProfile mockProfile = new UserProfile();
        mockProfile.setUsername("other-username");
        when(userServiceClient.getUserBySub("other-user")).thenReturn(mockProfile);
        when(userServiceClient.listReviewers()).thenReturn(Collections.emptyList());

        Authentication auth = createAuth("Admin", "admin-user", "admin-uuid");
        ResponseEntity<?> response = controller.getMatchesBySubmission("sub-1", auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("ExaminationOfficer can access any submission")
    void getMatchesBySubmission_examOfficer_success() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "other-user", MatchStatus.MATCHED, 1, null));
        when(matchingService.getMatchesBySubmission("sub-1"))
                .thenReturn(Collections.emptyList());
        UserProfile mockProfile = new UserProfile();
        mockProfile.setUsername("other-username");
        when(userServiceClient.getUserBySub("other-user")).thenReturn(mockProfile);
        when(userServiceClient.listReviewers()).thenReturn(Collections.emptyList());

        Authentication auth = createAuth("ExaminationOfficer", "officer-user", "officer-uuid");
        ResponseEntity<?> response = controller.getMatchesBySubmission("sub-1", auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Author can access their own submission")
    void getMatchesBySubmission_authorOwn_success() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "author-uuid", MatchStatus.MATCHED, 1, null));
        when(matchingService.getMatchesBySubmission("sub-1"))
                .thenReturn(Collections.emptyList());
        UserProfile mockProfile = new UserProfile();
        mockProfile.setUsername("author-user");
        when(userServiceClient.getUserBySub("author-uuid")).thenReturn(mockProfile);
        when(userServiceClient.listReviewers()).thenReturn(Collections.emptyList());

        Authentication auth = createAuth("Author", "author-user", "author-uuid");
        ResponseEntity<?> response = controller.getMatchesBySubmission("sub-1", auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Author CANNOT access someone else's submission")
    void getMatchesBySubmission_authorOther_forbidden() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "other-uuid", MatchStatus.MATCHED, 1, null));

        Authentication auth = createAuth("Author", "author-user", "author-uuid");

        ResponseEntity<?> response = controller.getMatchesBySubmission("sub-1", auth);
        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    @DisplayName("Reviewer can access their own examiner matches")
    void getMatchesByExaminer_reviewerOwn_success() {
        String examinerUsername = "reviewer-username";
        String examinerSub = "reviewer-uuid";

        UserProfile mockProfile = new UserProfile();
        mockProfile.setSub(examinerSub);
        when(userServiceClient.getUserDetails(examinerUsername)).thenReturn(mockProfile);
        when(matchingService.getMatchesByExaminer(examinerSub)).thenReturn(Collections.emptyList());

        Authentication auth = createAuth("Reviewer", examinerUsername, examinerSub);
        ResponseEntity<?> response = controller.getMatchesByExaminer(examinerUsername, auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Reviewer CANNOT access other examiner's matches")
    void getMatchesByExaminer_reviewerOther_forbidden() {
        String otherExaminerUsername = "other-username";
        String otherExaminerSub = "other-uuid";

        UserProfile mockProfile = new UserProfile();
        mockProfile.setSub(otherExaminerSub);
        when(userServiceClient.getUserDetails(otherExaminerUsername)).thenReturn(mockProfile);

        Authentication auth = createAuth("Reviewer", "reviewer-username", "reviewer-uuid");

        ResponseEntity<?> response = controller.getMatchesByExaminer(otherExaminerUsername, auth);
        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }
}
