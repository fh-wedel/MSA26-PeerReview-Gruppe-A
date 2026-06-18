package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Data access layer for in-app notifications in DynamoDB.
 * Uses the AWS SDK v2 Enhanced Client with single-table design.
 * <p>
 * The method names mirror the previous Spring Data JPA repository so the
 * service layer (and its tests) remain unchanged.
 */
@Repository
public class InAppNotificationRepository {

    private final DynamoDbTable<InAppNotification> table;
    private final DynamoDbIndex<InAppNotification> userIndex;

    public InAppNotificationRepository(DynamoDbEnhancedClient enhancedClient,
                                       @Value("${aws.dynamodb.table-name}") String tableName) {
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(InAppNotification.class));
        this.userIndex = table.index(InAppNotification.USER_INDEX);
    }

    /**
     * Persists the notification, generating the id and deriving the PK/SK if needed.
     */
    public InAppNotification save(InAppNotification notification) {
        applyKeys(notification);
        table.putItem(notification);
        return notification;
    }

    /**
     * Persists all given notifications.
     */
    public List<InAppNotification> saveAll(List<InAppNotification> notifications) {
        notifications.forEach(this::save);
        return notifications;
    }

    /**
     * Finds a notification by its id (direct primary-key lookup).
     */
    public Optional<InAppNotification> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        Key key = Key.builder()
                .partitionValue(InAppNotification.PK_PREFIX + id)
                .sortValue(InAppNotification.SK_VALUE)
                .build();
        return Optional.ofNullable(table.getItem(key));
    }

    /**
     * Lists all notifications for a user, newest first, via the UserIndex GSI.
     */
    public List<InAppNotification> findByUserSubOrderByCreatedAtDesc(String userSub) {
        QueryEnhancedRequest request = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userSub).build()))
                .scanIndexForward(false) // descending by createdAt (sort key)
                .build();

        return userIndex.query(request).stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }

    private void applyKeys(InAppNotification notification) {
        if (notification.getId() == null) {
            notification.setId(UUID.randomUUID());
        }
        notification.setPk(InAppNotification.PK_PREFIX + notification.getId());
        notification.setSk(InAppNotification.SK_VALUE);
    }
}
