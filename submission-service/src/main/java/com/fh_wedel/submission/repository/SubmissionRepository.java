package com.fh_wedel.submission.repository;

import com.fh_wedel.submission.model.DocumentRecord;
import com.fh_wedel.submission.model.Submission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;

@Repository
@Slf4j
public class SubmissionRepository {

    private final DynamoDbTable<Submission> submissionTable;
    private final DynamoDbTable<DocumentRecord> documentTable;
    private final DynamoDbIndex<Submission> authorIndex;

    public SubmissionRepository(DynamoDbEnhancedClient enhancedClient,
                                @Value("${aws.dynamodb.table-name}") String tableName) {
        this.submissionTable = enhancedClient.table(tableName, TableSchema.fromBean(Submission.class));
        this.documentTable = enhancedClient.table(tableName, TableSchema.fromBean(DocumentRecord.class));
        this.authorIndex = submissionTable.index("AuthorIndex");
    }

    public void saveSubmission(Submission submission) {
        log.info("Saving submission {}", submission.getSubmissionId());
        submissionTable.putItem(submission);
    }

    public Submission findSubmissionById(String submissionId) {
        Key key = Key.builder()
                .partitionValue(Submission.PK_PREFIX + submissionId)
                .sortValue(Submission.SK_VALUE)
                .build();
        log.info("Querying DynamoDB for submissionId={} (PK={})", submissionId, Submission.PK_PREFIX + submissionId);
        Submission submission = submissionTable.getItem(key);
        if (submission == null) {
            log.warn("Submission {} not found in DynamoDB", submissionId);
        } else {
            log.info("Successfully retrieved submission {} from DynamoDB: status={}", submissionId, submission.getStatus());
        }
        return submission;
    }

    public List<Submission> findSubmissionsByAuthor(String authorId) {
        log.info("Finding submissions for author {}", authorId);
        return authorIndex.query(r -> r.queryConditional(
                QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(authorId).build()
                )
        )).stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }

    public void saveDocument(DocumentRecord document) {
        log.info("Saving document {} for submission {}", document.getDocumentId(), document.getSubmissionId());
        documentTable.putItem(document);
    }

    public List<DocumentRecord> findDocuments(String submissionId) {
        return documentTable.query(r -> r.queryConditional(
                QueryConditional.sortBeginsWith(
                        Key.builder()
                                .partitionValue(Submission.PK_PREFIX + submissionId)
                                .sortValue(DocumentRecord.SK_PREFIX)
                                .build()
                )
        )).stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }

    public DocumentRecord findDocument(String submissionId, String documentId) {
        Key key = Key.builder()
                .partitionValue(Submission.PK_PREFIX + submissionId)
                .sortValue(DocumentRecord.SK_PREFIX + documentId)
                .build();
        return documentTable.getItem(key);
    }
}
