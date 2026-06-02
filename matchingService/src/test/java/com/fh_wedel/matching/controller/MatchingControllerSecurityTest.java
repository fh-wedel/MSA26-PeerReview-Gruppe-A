package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.MatchStatus;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import com.fh_wedel.matching.service.MatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import com.fh_wedel.matching.service.CognitoService;

@ExtendWith(MockitoExtension.class)
class MatchingControllerSecurityTest {

    @Mock
    private MatchingService matchingService;

    @Mock
    private CognitoService cognitoService;

    @InjectMocks
    private MatchingController controller;

    /**
     * Creates a mock Authentication matching the {@code AuthHeaderFilter} behavior:
     * principal = Cognito username (auth.getName()), details = "poolId|subUUID".
     */
    private Authentication createAuth(String role, String username, String sub) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails("pool123|" + sub);
        return auth;
    }

    @Test
    @DisplayName("Admin can access any submission")
    void getMatchesBySubmission_admin_success() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "other-user", MatchStatus.MATCHED, 1, null));
        when(matchingService.getMatchesBySubmission("sub-1"))
                .thenReturn(Collections.emptyList());

        Authentication auth = createAuth("Admin", "admin-uuid");
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

        Authentication auth = createAuth("ExaminationOfficer", "officer-uuid");
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

        Authentication auth = createAuth("Author", "author-uuid");
        ResponseEntity<?> response = controller.getMatchesBySubmission("sub-1", auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Author CANNOT access someone else's submission")
    void getMatchesBySubmission_authorOther_forbidden() {
        when(matchingService.getStatusBySubmission("sub-1"))
                .thenReturn(new SubmissionStatusRecord("sub-1", "other-uuid", MatchStatus.MATCHED, 1, null));

        Authentication auth = createAuth("Author", "author-uuid");

        assertThatThrownBy(() -> controller.getMatchesBySubmission("sub-1", auth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You are not the author");
    }

    @Test
    @DisplayName("Reviewer can access their own examiner matches")
    void getMatchesByExaminer_reviewerOwn_success() {
        // The path param is the Cognito username; the controller resolves it to a sub UUID.
        String examinerUsername = "reviewer-username";
        String examinerSub = "reviewer-uuid";

        AdminGetUserResponse mockResponse = AdminGetUserResponse.builder()
                .userAttributes(AttributeType.builder().name("sub").value(examinerSub).build())
                .build();
        when(cognitoService.getUser(examinerUsername)).thenReturn(mockResponse);
        when(matchingService.getMatchesByExaminer(examinerSub)).thenReturn(Collections.emptyList());

        // The caller's JWT principal (auth.getName()) must be the resolved sub UUID.
        Authentication auth = createAuth("Reviewer", examinerSub);
        ResponseEntity<?> response = controller.getMatchesByExaminer(examinerUsername, auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Reviewer CANNOT access other examiner's matches")
    void getMatchesByExaminer_reviewerOther_forbidden() {
        // Path param is a username belonging to a DIFFERENT user.
        String otherExaminerUsername = "other-username";
        String otherExaminerSub = "other-uuid";

        AdminGetUserResponse mockResponse = AdminGetUserResponse.builder()
                .userAttributes(AttributeType.builder().name("sub").value(otherExaminerSub).build())
                .build();
        when(cognitoService.getUser(otherExaminerUsername)).thenReturn(mockResponse);

        // The caller's sub is different from the resolved examiner sub.
        Authentication auth = createAuth("Reviewer", "reviewer-uuid");

        assertThatThrownBy(() -> controller.getMatchesByExaminer(otherExaminerUsername, auth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only access your own matches");
    }
}
