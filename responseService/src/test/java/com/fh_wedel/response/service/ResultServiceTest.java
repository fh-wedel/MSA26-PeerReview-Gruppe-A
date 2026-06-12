package com.fh_wedel.response.service;

import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.model.ReviewResultDto;
import com.fh_wedel.response.repository.ReviewResultRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock
    private ReviewResultRepository repository;

    @Mock
    private DocumentStorageService documentStorageService;

    @InjectMocks
    private ResultService resultService;

    @Test
    void shouldFindResultsByAuthor() {
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

        List<ReviewResultDto> results = resultService.findByAuthor("author-1");

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().finalGrade()).isEqualTo("1.7");
    }

    @Test
    void shouldThrowWhenSubmissionNotFound() {
        when(repository.findBySubmissionId("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resultService.findBySubmission("nonexistent"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No result found");
    }

    @Test
    void shouldGenerateDownloadUrl() {
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

        String url = resultService.getDocumentDownloadUrl("sub-1");

        assertThat(url).isEqualTo("https://s3.presigned.url/...");
    }
}
