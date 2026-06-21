package com.fh_wedel.response.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.client.api.SubmissionsApi;
import com.fh_wedel.configuration.client.model.ModelConfiguration;
import com.fh_wedel.matching.client.api.MatchesApi;
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
    void emitsResultAvailableNotificationOnSave() {
        ResultService service = buildService("notification-request-queue");

        ReviewResult result = ReviewResult.builder()
                .submissionId("sub-9").authorId("author-1").reviewerId("rev-1")
                .completedAt(Instant.now()).build();
        when(repository.save(any(ReviewResult.class))).thenReturn(result);

        service.save(result);

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getValue()).contains("Review Result Available").contains("IN_APP").contains("author-1");
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
    void shouldThrowWhenSubmissionNotFound() {
        ResultService service = buildService("");

        when(repository.findBySubmissionId("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findBySubmission("nonexistent"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No result found");
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

        when(repository.findBySubmissionId("sub-1")).thenReturn(Optional.of(result));
        when(documentStorageService.generatePresignedDownloadUrl("reviews/sub-1/final.pdf"))
                .thenReturn("https://s3.presigned.url/...");

        String url = service.getDocumentDownloadUrl("sub-1");

        assertThat(url).isEqualTo("https://s3.presigned.url/...");
    }
}
