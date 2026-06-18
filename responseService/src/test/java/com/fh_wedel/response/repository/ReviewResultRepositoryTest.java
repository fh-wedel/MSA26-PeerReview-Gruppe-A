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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

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
        assertThat(stored.getSk()).isEqualTo("RESULT");
    }

    @Test
    @DisplayName("findBySubmissionId builds the primary key from the submission id")
    void findBySubmissionId_buildsKey() {
        ReviewResult expected = ReviewResult.builder().submissionId("sub-2").authorId("author-2").build();
        when(table.getItem(any(Key.class))).thenReturn(expected);

        Optional<ReviewResult> found = repository.findBySubmissionId("sub-2");

        assertThat(found).containsSame(expected);
        ArgumentCaptor<Key> keyCaptor = ArgumentCaptor.forClass(Key.class);
        verify(table).getItem(keyCaptor.capture());
        assertThat(keyCaptor.getValue().partitionKeyValue().s()).isEqualTo("SUBMISSION#sub-2");
    }

    @Test
    @DisplayName("findBySubmissionId returns empty when no item exists")
    void findBySubmissionId_empty() {
        when(table.getItem(any(Key.class))).thenReturn(null);
        assertThat(repository.findBySubmissionId("missing")).isEmpty();
    }
}
