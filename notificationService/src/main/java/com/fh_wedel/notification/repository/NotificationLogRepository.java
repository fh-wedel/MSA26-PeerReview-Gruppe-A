package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.UUID;

/**
 * Data access layer for notification dispatch logs in DynamoDB.
 * Uses the AWS SDK v2 Enhanced Client with single-table design.
 * <p>
 * The method names mirror the previous Spring Data JPA repository so the
 * service layer (and its tests) remain unchanged.
 */
@Repository
public class NotificationLogRepository {

    private final DynamoDbTable<NotificationLog> table;
    private final DynamoDbIndex<NotificationLog> statusIndex;

    public NotificationLogRepository(DynamoDbEnhancedClient enhancedClient,
                                     @Value("${aws.dynamodb.table-name}") String tableName) {
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(NotificationLog.class));
        this.statusIndex = table.index(NotificationLog.STATUS_INDEX);
    }

    /**
     * Persists the log, generating the id and deriving the PK/SK if needed.
     */
    public NotificationLog save(NotificationLog log) {
        if (log.getId() == null) {
            log.setId(UUID.randomUUID());
        }
        log.setPk(NotificationLog.PK_PREFIX + log.getId());
        log.setSk(NotificationLog.SK_VALUE);
        table.putItem(log);
        return log;
    }

    /**
     * Finds all logs with the given status via the StatusIndex GSI.
     */
    public List<NotificationLog> findByStatus(NotificationStatus status) {
        return statusIndex.query(r -> r.queryConditional(
                        QueryConditional.keyEqualTo(
                                Key.builder().partitionValue(status.name()).build())))
                .stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }
}
