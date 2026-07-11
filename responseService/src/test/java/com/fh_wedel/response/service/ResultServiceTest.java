package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionsApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.AssignmentEntry;
import com.fh_wedel.matching.client.model.ExaminerMatchResponse;
import com.fh_wedel.matching.client.model.MatchEntry;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import com.fh_wedel.configuration.client.api.SubmissionReviewsApi;
import com.fh_wedel.configuration.client.model.ReviewQuestionDto;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock
    private ReviewResultRepository repository;

    @Mock
    private DocumentStorageService documentStorageService;

    @Mock
    private SqsTemplate sqsTemplate;

    @Mock
    private SubmissionReviewsApi submissionReviewsApi;

    @Mock
    private MatchesApi matchesApi;

    @Mock
    private SubmissionsApi submissionsApi;

    private ResultService buildService(String notificationQueue) {
        return new ResultService(repository, documentStorageService,
                sqsTemplate, new ObjectMapper(), notificationQueue,
                submissionReviewsApi, matchesApi, submissionsApi);
    }


    @Test
    void enrichesResultFromNeighbouringServicesOnSave() throws Exception {
        ResultService service = buildService("");

        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-9")).thenReturn(List.of(
                new ReviewQuestionDto().id("q1").text("Originality").maxPoints(10).required(true)));
        when(matchesApi.getMatchesBySubmission("sub-9")).thenReturn(
                new SubmissionMatchResponse().matches(List.of(
                        new MatchEntry().examinerUsername("examiner-x"))));
        OffsetDateTime deadline = OffsetDateTime.of(2026, 6, 30, 12, 0, 0, 0, ZoneOffset.UTC);
        when(submissionsApi.submissionsSubmissionIdGet("sub-9")).thenReturn(
                new ModelConfiguration().reviewDeadline(deadline));
        when(repository.save(any(ReviewResult.class))).thenAnswer(i -> i.getArgument(0));

        ReviewResult result = ReviewResult.builder()
                .submissionId("sub-9").authorId("author-1").reviewerId("rev-1")
                .completedAt(Instant.now()).build();

        service.save(result);

        ArgumentCaptor<ReviewResult> captor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(repository).save(captor.capture());
        ReviewResult saved = captor.getValue();
        assertThat(saved.getGradingSchema()).hasSize(1);
        assertThat(saved.getGradingSchema().getFirst().getText()).isEqualTo("Originality");
        assertThat(saved.getGradingSchema().getFirst().getMaxPoints()).isEqualTo(10);
        assertThat(saved.getExaminerUsernames()).containsExactly("examiner-x");
        assertThat(saved.getReviewDeadline()).isEqualTo(deadline.toInstant());
    }

    @Test
    void savesResultEvenWhenEnrichmentCallsFail() throws Exception {
        ResultService service = buildService("");

        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-9"))
                .thenThrow(new com.fh_wedel.configuration.client.ApiException("configuration down"));
        when(matchesApi.getMatchesBySubmission("sub-9"))
                .thenThrow(new com.fh_wedel.matching.client.ApiException("matching down"));
        when(submissionsApi.submissionsSubmissionIdGet("sub-9"))
                .thenThrow(new com.fh_wedel.configuration.client.ApiException("configuration down"));
        when(repository.save(any(ReviewResult.class))).thenAnswer(i -> i.getArgument(0));

        ReviewResult result = ReviewResult.builder()
                .submissionId("sub-9").authorId("author-1").reviewerId("rev-1")
                .completedAt(Instant.now()).build();

        service.save(result);

        ArgumentCaptor<ReviewResult> captor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(repository).save(captor.capture());
        ReviewResult saved = captor.getValue();
        assertThat(saved.getGradingSchema()).isNull();
        assertThat(saved.getExaminerUsernames()).isNull();
        assertThat(saved.getReviewDeadline()).isNull();
    }

    @Test
    void shouldFindResultsByAuthor() {
        ResultService service = buildService("");

        var result = ReviewResult.builder()
                .id(UUID.randomUUID())
                .submissionId("sub-1")
                .reviewerId("rev-1")
                .authorId("author-1")
                .finalGrade("1.7")
                .completedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        when(repository.findByAuthorId("author-1")).thenReturn(List.of(result));

        List<ReviewResultDto> results = service.findByAuthor("author-1");

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().finalGrade()).isEqualTo("1.7");
    }

    @Test
    void shouldReturnEmptyListWhenSubmissionNotFound() {
        ResultService service = buildService("");

        when(repository.findBySubmissionId("nonexistent")).thenReturn(List.of());

        List<ReviewResultDto> results = service.findResultsBySubmission("nonexistent");

        assertThat(results).isEmpty();
    }

    @Test
    void shouldGenerateDownloadUrl() {
        ResultService service = buildService("");

        var result = ReviewResult.builder()
                .id(UUID.randomUUID())
                .submissionId("sub-1")
                .documentS3Key("reviews/sub-1/final.pdf")
                .completedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(result));
        when(documentStorageService.generatePresignedDownloadUrl("reviews/sub-1/final.pdf"))
                .thenReturn("https://s3.presigned.url/...");

        String url = service.getDocumentDownloadUrl("sub-1");

        assertThat(url).isEqualTo("https://s3.presigned.url/...");
    }

    @Test
    void isAssignedReviewer_returnsTrueWhenSubmissionMatchesContainCallerSub() throws Exception {
        ResultService service = buildService("");

        when(matchesApi.getMatchesBySubmission("sub-1")).thenReturn(
                new SubmissionMatchResponse().matches(List.of(
                        new MatchEntry().examinerId("reviewer-sub").examinerUsername("reviewer-user"))));

        boolean assigned = service.isAssignedReviewer("sub-1", "reviewer-sub", "reviewer-user");

        assertThat(assigned).isTrue();
        verify(matchesApi, never()).getMatchesByExaminer(any());
    }

    @Test
    void isAssignedReviewer_fallsBackToExaminerAssignmentsWhenIdsAreHidden() throws Exception {
        ResultService service = buildService("");

        when(matchesApi.getMatchesBySubmission("sub-1")).thenReturn(
                new SubmissionMatchResponse().matches(List.of(
                        new MatchEntry().examinerId(null).examinerUsername(null))));
        when(matchesApi.getMatchesByExaminer("reviewer-user")).thenReturn(
                new ExaminerMatchResponse().assignments(List.of(
                        new AssignmentEntry().submissionId("sub-1"))));

        boolean assigned = service.isAssignedReviewer("sub-1", "reviewer-sub", "reviewer-user");

        assertThat(assigned).isTrue();
    }
    @Test
    void isAssignedReviewer_returnsFalseWhenCallerSubNull() {
        ResultService service = buildService("");
        assertThat(service.isAssignedReviewer("sub-1", null, "user")).isFalse();
    }

    @Test
    void isAssignedReviewer_returnsFalseWhenMatchesNull() throws Exception {
        ResultService service = buildService("");
        when(matchesApi.getMatchesBySubmission("sub-1")).thenReturn(null);
        assertThat(service.isAssignedReviewer("sub-1", "user", null)).isFalse();
    }

    @Test
    void getDocumentDownloadUrl_throwsIfNoResult() {
        ResultService service = buildService("");
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of());
        assertThatThrownBy(() -> service.getDocumentDownloadUrl("sub-1"))
                .isInstanceOf(IllegalArgumentException.class);
    }
    
    @Test
    void getDocumentDownloadUrl_throwsIfNoDoc() {
        ResultService service = buildService("");
        ReviewResult r = new ReviewResult();
        r.setSubmissionId("sub-1");
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(r));
        assertThatThrownBy(() -> service.getDocumentDownloadUrl("sub-1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void submitReview_throwsConflictIfAlreadyReviewed() {
        ResultService service = buildService("");
        ReviewResult existing = new ReviewResult();
        existing.setReviewerId("rev-1");
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(existing));

        com.fh_wedel.response.model.SubmitReviewRequest req = new com.fh_wedel.response.model.SubmitReviewRequest();
        req.setSubmissionId("sub-1");

        assertThatThrownBy(() -> service.submitReview(req, "rev-1"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("A review by this reviewer for this submission already exists.");
    }

    @Test
    void submitReview_savesResultAndSendsNotification() throws Exception {
        ResultService service = buildService("test-queue");

        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of());

        ReviewQuestionDto q = new ReviewQuestionDto().id("q1").text("Score");
        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-1")).thenReturn(List.of(q));
        
        when(submissionsApi.submissionsSubmissionIdGet("sub-1")).thenReturn(new ModelConfiguration().authorIds(List.of("author-1")));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        com.fh_wedel.response.model.SubmitReviewRequest req = new com.fh_wedel.response.model.SubmitReviewRequest();
        req.setSubmissionId("sub-1");
        req.setFinalGrade("1.0");
        com.fh_wedel.response.model.ReviewAnswer answer = new com.fh_wedel.response.model.ReviewAnswer();
        answer.setQuestionId("q1");
        answer.setAnswer("Great");
        req.setAnswers(List.of(answer));

        ReviewResult result = service.submitReview(req, "rev-1");

        assertThat(result.getReviewerId()).isEqualTo("rev-1");
        assertThat(result.getFinalGrade()).isEqualTo("1.0");
        assertThat(result.getAuthorId()).isEqualTo("author-1");
        assertThat(result.getGradingSchema()).hasSize(1);
        assertThat(result.getGradingSchema().getFirst().getAnswer()).isEqualTo("Great");

        verify(sqsTemplate).send(eq("test-queue"), any(String.class));
    }

    @Test
    void submitReview_handlesMissingApiGracefully() throws Exception {
        ResultService service = buildService("");
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of());
        when(submissionReviewsApi.getFeedbackFormForSubmission("sub-1")).thenThrow(new RuntimeException("API error"));
        when(submissionsApi.submissionsSubmissionIdGet("sub-1")).thenThrow(new RuntimeException("API error"));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        com.fh_wedel.response.model.SubmitReviewRequest req = new com.fh_wedel.response.model.SubmitReviewRequest();
        req.setSubmissionId("sub-1");

        ReviewResult result = service.submitReview(req, "rev-1");

        assertThat(result.getAuthorId()).isNull();
    }

    @Test
    void findResultsBySubmission_backfillsAuthorId() throws Exception {
        ResultService service = buildService("");
        ReviewResult r = new ReviewResult();
        r.setId(UUID.randomUUID());
        r.setSubmissionId("sub-1");
        // missing authorId
        when(repository.findBySubmissionId("sub-1")).thenReturn(List.of(r));
        when(submissionsApi.submissionsSubmissionIdGet("sub-1")).thenReturn(new ModelConfiguration().authorIds(List.of("author-2")));

        List<ReviewResultDto> dtos = service.findResultsBySubmission("sub-1");
        assertThat(dtos).hasSize(1);
        assertThat(r.getAuthorId()).isEqualTo("author-2");
        verify(repository).save(r); // verify save was called to backfill
    }

    @Test
    void isAuthorOfSubmission_returnsTrueIfMatches() throws Exception {
        ResultService service = buildService("");
        when(submissionsApi.submissionsSubmissionIdGet("sub-1")).thenReturn(new ModelConfiguration().authorIds(List.of("author-1")));
        assertThat(service.isAuthorOfSubmission("sub-1", "author-1")).isTrue();
    }

    @Test
    void isAuthorOfSubmission_returnsFalseOnNull() {
        ResultService service = buildService("");
        assertThat(service.isAuthorOfSubmission("sub-1", null)).isFalse();
    }

    @Test
    void isAuthorOfSubmission_returnsFalseOnError() throws Exception {
        ResultService service = buildService("");
        when(submissionsApi.submissionsSubmissionIdGet("sub-1")).thenThrow(new RuntimeException("API error"));
        assertThat(service.isAuthorOfSubmission("sub-1", "author-1")).isFalse();
    }

    @Test
    void isReviewComplete_returnsTrueWhenCountMatches() throws Exception {
        ResultService service = buildService("");
        when(matchesApi.getMatchesBySubmission("sub-1")).thenReturn(new SubmissionMatchResponse().matches(List.of(new MatchEntry(), new MatchEntry())));
        assertThat(service.isReviewComplete("sub-1", 2)).isTrue();
    }

    @Test
    void isReviewComplete_returnsFalseWhenNotMatches() throws Exception {
        ResultService service = buildService("");
        when(matchesApi.getMatchesBySubmission("sub-1")).thenReturn(new SubmissionMatchResponse().matches(List.of(new MatchEntry(), new MatchEntry())));
        assertThat(service.isReviewComplete("sub-1", 1)).isFalse();
    }

    @Test
    void isReviewComplete_returnsFalseOnError() throws Exception {
        ResultService service = buildService("");
        when(matchesApi.getMatchesBySubmission("sub-1")).thenThrow(new RuntimeException("API error"));
        assertThat(service.isReviewComplete("sub-1", 2)).isFalse();
    }
}
