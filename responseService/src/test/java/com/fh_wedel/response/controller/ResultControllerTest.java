package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.service.ResultService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultControllerTest {

    @Mock
    private ResultService resultService;

    @InjectMocks
    private ResultController controller;

    /**
     * Builds an Authentication matching the {@code AuthHeaderFilter} contract:
     * principal = username, details = Cedar entity id {@code "poolId|subUUID"}.
     */
    private Authentication auth(String role, String username, String sub) {
        var token = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        token.setDetails("PeerReview::User::\"pool123|" + sub + "\"");
        return token;
    }

    private ReviewResultDto dtoForAuthor(String authorId) {
        return new ReviewResultDto(
                UUID.randomUUID(), "sub-1", "rev-1", List.of("examiner-1"), authorId,
                "1.7", "Good", null, null, null, true, Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("Author querying their own authorId returns their results")
    void getResultsByAuthor_own_success() {
        var dto = dtoForAuthor("author-sub");
        when(resultService.findByAuthor("author-sub")).thenReturn(List.of(dto));

        var response = controller.getResultsByAuthor("author-sub", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("Author passing a foreign authorId is forced to their own sub")
    void getResultsByAuthor_foreignParam_isOverridden() {
        var dto = dtoForAuthor("author-sub");
        when(resultService.findByAuthor("author-sub")).thenReturn(List.of(dto));

        // Caller is 'author-sub' but tries to query 'victim-sub' via the param.
        var response = controller.getResultsByAuthor("victim-sub", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Service was called with the caller's own sub, NOT the spoofed param.
        verify(resultService).findByAuthor("author-sub");
    }

    @Test
    @DisplayName("Admin may query an arbitrary authorId")
    void getResultsByAuthor_admin_arbitrary() {
        var dto = dtoForAuthor("someone-else");
        when(resultService.findByAuthor("someone-else")).thenReturn(List.of(dto));

        var response = controller.getResultsByAuthor("someone-else", auth("Admin", "admin-user", "admin-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(resultService).findByAuthor("someone-else");
    }

    @Test
    @DisplayName("Author accessing their own submission result succeeds")
    void getResultBySubmission_own_success() {
        when(resultService.findResultsBySubmission("sub-1")).thenReturn(List.of(dtoForAuthor("author-sub")));
        when(resultService.isAuthorOfSubmission("sub-1", "author-sub")).thenReturn(true);
        when(resultService.isReviewComplete("sub-1", 1)).thenReturn(true);

        var response = controller.getResultBySubmission("sub-1", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Author accessing a foreign submission result gets 403")
    void getResultBySubmission_foreign_forbidden() {
        when(resultService.findResultsBySubmission("sub-1")).thenReturn(List.of(dtoForAuthor("other-sub")));

        var response = controller.getResultBySubmission("sub-1", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Admin may access any submission result")
    void getResultBySubmission_admin_success() {
        when(resultService.findResultsBySubmission("sub-1")).thenReturn(List.of(dtoForAuthor("other-sub")));

        var response = controller.getResultBySubmission("sub-1", auth("Admin", "admin-user", "admin-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Author downloads their own document")
    void getDocumentUrl_own_success() {
        when(resultService.isAuthorOfSubmission("sub-1", "author-sub")).thenReturn(true);
        when(resultService.getDocumentDownloadUrl("sub-1")).thenReturn("https://s3.presigned.url");

        var response = controller.getDocumentUrl("sub-1", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("downloadUrl", "https://s3.presigned.url");
    }

    @Test
    @DisplayName("Author cannot download a foreign document (403, no presign)")
    void getDocumentUrl_foreign_forbidden() {
        var response = controller.getDocumentUrl("sub-1", auth("Author", "author-user", "author-sub"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
