package com.fh_wedel.matching.repository;

import com.fh_wedel.matching.model.MatchRecord;
import com.fh_wedel.matching.model.SubmissionStatusRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.BatchWriteItemEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.WriteBatch;

import java.util.List;

/**
 * Data access layer for match records and submission status in DynamoDB.
 * Uses the AWS SDK v2 Enhanced Client with single-table design.
 */
@Repository
@Slf4j
public class MatchRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<MatchRecord> matchTable;
    private final DynamoDbTable<SubmissionStatusRecord> statusTable;
    private final DynamoDbIndex<MatchRecord> examinerIndex;

    public MatchRepository(DynamoDbEnhancedClient enhancedClient,
                           @Value("${aws.dynamodb.table-name}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.matchTable = enhancedClient.table(tableName, TableSchema.fromBean(MatchRecord.class));
        this.statusTable = enhancedClient.table(tableName, TableSchema.fromBean(SubmissionStatusRecord.class));
        this.examinerIndex = matchTable.index("ExaminerIndex");
    }

    /**
     * Persists a batch of match records and a status record atomically (best-effort via DynamoDB batch write).
     */
    public void saveMatchBatch(List<MatchRecord> matches, SubmissionStatusRecord statusRecord) {
        log.info("Saving batch of {} match records and status for submission {}",
                matches.size(), statusRecord.getSubmissionId());

        var matchWriteBatchBuilder = WriteBatch.builder(MatchRecord.class)
                .mappedTableResource(matchTable);
        for (MatchRecord match : matches) {
            matchWriteBatchBuilder.addPutItem(match);
        }

        var statusWriteBatch = WriteBatch.builder(SubmissionStatusRecord.class)
                .mappedTableResource(statusTable)
                .addPutItem(statusRecord)
                .build();

        var batchRequest = BatchWriteItemEnhancedRequest.builder()
                .writeBatches(matchWriteBatchBuilder.build(), statusWriteBatch)
                .build();

        enhancedClient.batchWriteItem(batchRequest);
    }

    /**
     * Persists a status-only record (used for failed matches where no match records are created).
     */
    public void saveStatus(SubmissionStatusRecord statusRecord) {
        log.info("Saving status record for submission {}: {}", statusRecord.getSubmissionId(), statusRecord.getStatus());
        statusTable.putItem(statusRecord);
    }

    /**
     * Finds all match records for a given submission.
     */
    public List<MatchRecord> findMatchesBySubmission(String submissionId) {
        String pk = MatchRecord.PK_PREFIX + submissionId;

        return matchTable.query(r -> r.queryConditional(
                QueryConditional.sortBeginsWith(
                        Key.builder().partitionValue(pk).sortValue(MatchRecord.SK_PREFIX).build()
                )
        )).items().stream().toList();
    }

    /**
     * Finds the status record for a given submission.
     */
    public SubmissionStatusRecord findStatusBySubmission(String submissionId) {
        String pk = MatchRecord.PK_PREFIX + submissionId;
        Key key = Key.builder()
                .partitionValue(pk)
                .sortValue(SubmissionStatusRecord.SK_VALUE)
                .build();

        return statusTable.getItem(key);
    }

    /**
     * Finds all match records assigned to a specific examiner via the GSI.
     */
    public List<MatchRecord> findMatchesByExaminer(String examinerId) {
        return examinerIndex.query(r -> r.queryConditional(
                QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(examinerId).build()
                )
        )).stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }
}
