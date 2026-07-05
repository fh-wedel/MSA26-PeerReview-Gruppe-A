package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationStatus;
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
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationLogRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<NotificationLog> table;

    @Mock
    private DynamoDbIndex<NotificationLog> statusIndex;

    private NotificationLogRepository repository;

    @SuppressWarnings({"unchecked", "rawtypes"})
    @BeforeEach
    void setUp() {
        lenient().when(enhancedClient.table(anyString(), any(TableSchema.class)))
                .thenReturn((DynamoDbTable) table);
        lenient().when(table.index(NotificationLog.STATUS_INDEX)).thenReturn(statusIndex);

        repository = new NotificationLogRepository(enhancedClient, "test-table");
    }

    @Test
    @DisplayName("save generates an id and derives PK/SK")
    void save_generatesKeys() {
        var log = NotificationLog.builder()
                .channel(ChannelType.DISCORD)
                .recipient("user@example.com")
                .subject("Test")
                .body("Hello")
                .status(NotificationStatus.SENT)
                .build();

        repository.save(log);

        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(table).putItem(captor.capture());
        NotificationLog stored = captor.getValue();
        assertThat(stored.getId()).isNotNull();
        assertThat(stored.getPk()).isEqualTo("LOG#" + stored.getId());
        assertThat(stored.getSk()).isEqualTo("META");
        assertThat(stored.getRecipient()).isEqualTo("user@example.com");
    }

    @Test
    void findByStatus_queriesGsi() {
        software.amazon.awssdk.enhanced.dynamodb.model.PageIterable<NotificationLog> mockIterable = mock(software.amazon.awssdk.enhanced.dynamodb.model.PageIterable.class);
        software.amazon.awssdk.enhanced.dynamodb.model.Page<NotificationLog> mockPage = mock(software.amazon.awssdk.enhanced.dynamodb.model.Page.class);
        
        when(statusIndex.query(any(java.util.function.Consumer.class))).thenAnswer(invocation -> {
            java.util.function.Consumer<software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest.Builder> consumer = invocation.getArgument(0);
            consumer.accept(software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest.builder());
            return mockIterable;
        });
        
        when(mockIterable.stream()).thenReturn(java.util.stream.Stream.of(mockPage));
        when(mockPage.items()).thenReturn(java.util.List.of(NotificationLog.builder().id(java.util.UUID.randomUUID()).build()));

        java.util.List<NotificationLog> results = repository.findByStatus(NotificationStatus.SENT);

        assertThat(results).hasSize(1);
        verify(statusIndex).query(any(java.util.function.Consumer.class));
    }
}
