package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ReviewResultRepositoryTest {

    @Autowired
    private ReviewResultRepository repository;

    @Test
    void shouldFindByAuthorId() {
        var result = ReviewResult.builder()
                .submissionId("sub-1")
                .reviewerId("rev-1")
                .authorId("author-1")
                .finalGrade("1.3")
                .reviewComments("Good work")
                .completedAt(Instant.now())
                .build();

        repository.save(result);

        List<ReviewResult> found = repository.findByAuthorId("author-1");
        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getSubmissionId()).isEqualTo("sub-1");
    }

    @Test
    void shouldFindBySubmissionId() {
        var result = ReviewResult.builder()
                .submissionId("sub-2")
                .reviewerId("rev-2")
                .authorId("author-2")
                .finalGrade("2.0")
                .completedAt(Instant.now())
                .build();

        repository.save(result);

        var found = repository.findBySubmissionId("sub-2");
        assertThat(found).isPresent();
        assertThat(found.get().getAuthorId()).isEqualTo("author-2");
    }
}
