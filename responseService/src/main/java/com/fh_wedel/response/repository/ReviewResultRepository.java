package com.fh_wedel.response.repository;

import com.fh_wedel.response.model.ReviewResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Data access layer for review results in DynamoDB.
 * Uses the AWS SDK v2 Enhanced Client with single-table design.
 * <p>
 * The method names mirror the previous Spring Data JPA repository so the
 * service layer (and its tests) remain unchanged.
 */
@Repository
public class ReviewResultRepository {

    private final DynamoDbTable<ReviewResult> table;
    private final DynamoDbIndex<ReviewResult> authorIndex;

    public ReviewResultRepository(DynamoDbEnhancedClient enhancedClient,
                                  @Value("${aws.dynamodb.table-name}") String tableName) {
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(ReviewResult.class));
        this.authorIndex = table.index(ReviewResult.AUTHOR_INDEX);
    }

    /**
     * Persists the result, generating the id and deriving the PK/SK if needed.
     * One result is stored per submission (PK {@code SUBMISSION#{submissionId}}).
     */
    public ReviewResult save(ReviewResult result) {
        if (result.getId() == null) {
            result.setId(UUID.randomUUID());
        }
        result.setPk(ReviewResult.PK_PREFIX + result.getSubmissionId());
        result.setSk(ReviewResult.SK_VALUE + "#" + result.getReviewerId());
        table.putItem(result);
        return result;
    }

    /**
     * Finds all results that belong to an author via the AuthorIndex GSI.
     */
    public List<ReviewResult> findByAuthorId(String authorId) {
        return authorIndex.query(r -> r.queryConditional(
                        QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(authorId).build())))
                .stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }

    /**
     * Finds all results for a submission via a primary-key lookup prefix.
     */
    public List<ReviewResult> findBySubmissionId(String submissionId) {
        return table.query(r -> r.queryConditional(
                        QueryConditional.sortBeginsWith(
                                Key.builder()
                                        .partitionValue(ReviewResult.PK_PREFIX + submissionId)
                                        .sortValue(ReviewResult.SK_VALUE + "#")
                                        .build())))
                .stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }
}
