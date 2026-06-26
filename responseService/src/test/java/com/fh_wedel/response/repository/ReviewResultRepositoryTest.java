package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.time.Instant;
import java.util.Optional;
import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;

@ExtendWith(MockitoExtension.class)
class ReviewResultRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<ReviewResult> table;

    @Mock
    private DynamoDbIndex<ReviewResult> authorIndex;

    private ReviewResultRepository repository;

    @SuppressWarnings({"unchecked", "rawtypes"})
    @BeforeEach
    void setUp() {
        lenient().when(enhancedClient.table(anyString(), any(TableSchema.class)))
                .thenReturn((DynamoDbTable) table);
        lenient().when(table.index(ReviewResult.AUTHOR_INDEX)).thenReturn(authorIndex);

        repository = new ReviewResultRepository(enhancedClient, "test-table");
    }

    @Test
    @DisplayName("save generates an id and derives PK/SK from the submission id")
    void save_generatesKeys() {
        ReviewResult result = ReviewResult.builder()
                .submissionId("sub-1")
                .reviewerId("rev-1")
                .authorId("author-1")
                .finalGrade("1.3")
                .reviewComments("Good work")
                .completedAt(Instant.now())
                .build();

        repository.save(result);

        ArgumentCaptor<ReviewResult> captor = ArgumentCaptor.forClass(ReviewResult.class);
        verify(table).putItem(captor.capture());
        ReviewResult stored = captor.getValue();
        assertThat(stored.getId()).isNotNull();
        assertThat(stored.getPk()).isEqualTo("SUBMISSION#sub-1");
        assertThat(stored.getSk()).isEqualTo("RESULT#rev-1");
    }

    @Test
    @DisplayName("findBySubmissionId builds the primary key from the submission id")
    @SuppressWarnings("unchecked")
    void findBySubmissionId_buildsKey() {
        ReviewResult expected = ReviewResult.builder().submissionId("sub-2").authorId("author-2").build();
        PageIterable<ReviewResult> pageIterable = mock(PageIterable.class);
        Page<ReviewResult> page = mock(Page.class);
        when(page.items()).thenReturn(List.of(expected));
        when(pageIterable.stream()).thenReturn(Stream.of(page));
        when(table.query(any(Consumer.class))).thenReturn(pageIterable);

        List<ReviewResult> found = repository.findBySubmissionId("sub-2");

        assertThat(found).containsExactly(expected);
        verify(table).query(any(Consumer.class));
    }

    @Test
    @DisplayName("findBySubmissionId returns empty when no item exists")
    @SuppressWarnings("unchecked")
    void findBySubmissionId_empty() {
        PageIterable<ReviewResult> pageIterable = mock(PageIterable.class);
        when(pageIterable.stream()).thenReturn(Stream.empty());
        when(table.query(any(Consumer.class))).thenReturn(pageIterable);

        assertThat(repository.findBySubmissionId("missing")).isEmpty();
    }
}
