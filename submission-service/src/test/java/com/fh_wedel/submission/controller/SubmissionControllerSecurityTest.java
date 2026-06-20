package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.model.*;
import com.fh_wedel.submission.service.SubmissionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionControllerSecurityTest {

    @Mock
    private SubmissionService submissionService;

    @InjectMocks
    private SubmissionController controller;

    @BeforeEach
    void setUp() {
        controller = new SubmissionController(submissionService);
    }

    private Authentication createAuth(String role, String username, String sub) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails("PeerReview::User::\"pool123|" + sub + "\"");
        return auth;
    }

    @Test
    @DisplayName("Admin can fetch any submission")
    void getSubmission_admin_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);

        Authentication auth = createAuth("Admin", "admin-user", "admin-uuid");
        ResponseEntity<Submission> response = controller.getSubmission("sub-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(submission);
    }

    @Test
    @DisplayName("Author can fetch their own submission")
    void getSubmission_authorOwn_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);

        Authentication auth = createAuth("Author", "author-user", "author-1");
        ResponseEntity<Submission> response = controller.getSubmission("sub-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(submission);
    }

    @Test
    @DisplayName("Author CANNOT fetch other author's submission")
    void getSubmission_authorOther_forbidden() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);

        Authentication auth = createAuth("Author", "author-user", "author-2");
        ResponseEntity<Submission> response = controller.getSubmission("sub-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("Teacher/Reviewer can fetch any submission")
    void getSubmission_teacher_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);

        Authentication auth = createAuth("Teacher", "teacher-user", "teacher-uuid");
        ResponseEntity<Submission> response = controller.getSubmission("sub-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Author can create submission draft")
    void createSubmission_success() {
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setConfigurationId("config-1");
        request.setTitle("My Thesis");

        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.createSubmission("config-1", "author-1", "My Thesis")).thenReturn(submission);

        Authentication auth = createAuth("Author", "author-user", "author-1");
        ResponseEntity<Submission> response = controller.createSubmission(request, auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(submission);
    }

    @Test
    @DisplayName("Admin can fetch presigned download URL for any submission")
    void getPresignedDownloadUrl_admin_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);
        when(submissionService.getPresignedDownloadUrl("sub-1", "doc-1")).thenReturn("http://s3.download.url");

        Authentication auth = createAuth("Admin", "admin-user", "admin-uuid");
        ResponseEntity<PresignedUrlResponse> response = controller.getPresignedDownloadUrl("sub-1", "doc-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUploadUrl()).isEqualTo("http://s3.download.url");
    }

    @Test
    @DisplayName("Author can fetch presigned download URL for their own submission")
    void getPresignedDownloadUrl_authorOwn_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);
        when(submissionService.getPresignedDownloadUrl("sub-1", "doc-1")).thenReturn("http://s3.download.url");

        Authentication auth = createAuth("Author", "author-user", "author-1");
        ResponseEntity<PresignedUrlResponse> response = controller.getPresignedDownloadUrl("sub-1", "doc-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUploadUrl()).isEqualTo("http://s3.download.url");
    }

    @Test
    @DisplayName("Author CANNOT fetch presigned download URL for other author's submission")
    void getPresignedDownloadUrl_authorOther_forbidden() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);

        Authentication auth = createAuth("Author", "author-user", "author-2");
        ResponseEntity<PresignedUrlResponse> response = controller.getPresignedDownloadUrl("sub-1", "doc-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNull();
        verify(submissionService, never()).getPresignedDownloadUrl(anyString(), anyString());
    }

    @Test
    @DisplayName("Teacher/Reviewer can fetch presigned download URL for any submission")
    void getPresignedDownloadUrl_teacher_success() {
        Submission submission = new Submission("sub-1", "config-1", "author-1", "My Thesis");
        when(submissionService.getSubmission("sub-1")).thenReturn(submission);
        when(submissionService.getPresignedDownloadUrl("sub-1", "doc-1")).thenReturn("http://s3.download.url");

        Authentication auth = createAuth("Teacher", "teacher-user", "teacher-uuid");
        ResponseEntity<PresignedUrlResponse> response = controller.getPresignedDownloadUrl("sub-1", "doc-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUploadUrl()).isEqualTo("http://s3.download.url");
    }

    @Test
    @DisplayName("Get download URL returns not found if submission does not exist")
    void getPresignedDownloadUrl_notFound() {
        when(submissionService.getSubmission("sub-1")).thenReturn(null);

        Authentication auth = createAuth("Admin", "admin-user", "admin-uuid");
        ResponseEntity<PresignedUrlResponse> response = controller.getPresignedDownloadUrl("sub-1", "doc-1", auth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }
}
