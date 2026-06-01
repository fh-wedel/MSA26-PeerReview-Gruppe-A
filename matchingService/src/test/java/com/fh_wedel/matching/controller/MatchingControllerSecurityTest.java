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

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingControllerSecurityTest {

    @Mock
    private MatchingService matchingService;

    @InjectMocks
    private MatchingController controller;

    private Authentication createAuth(String role, String targetId) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails("pool123|" + targetId);
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
        when(matchingService.getMatchesByExaminer("reviewer-uuid"))
                .thenReturn(Collections.emptyList());

        Authentication auth = createAuth("Reviewer", "reviewer-uuid");
        ResponseEntity<?> response = controller.getMatchesByExaminer("reviewer-uuid", auth);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("Reviewer CANNOT access other examiner's matches")
    void getMatchesByExaminer_reviewerOther_forbidden() {
        Authentication auth = createAuth("Reviewer", "reviewer-uuid");

        assertThatThrownBy(() -> controller.getMatchesByExaminer("other-uuid", auth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only access your own matches");
    }
}
