package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
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

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppNotificationRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<InAppNotification> table;

    @Mock
    private DynamoDbIndex<InAppNotification> userIndex;

    private InAppNotificationRepository repository;

    @SuppressWarnings({"unchecked", "rawtypes"})
    @BeforeEach
    void setUp() {
        lenient().when(enhancedClient.table(anyString(), any(TableSchema.class)))
                .thenReturn((DynamoDbTable) table);
        lenient().when(table.index(InAppNotification.USER_INDEX)).thenReturn(userIndex);

        repository = new InAppNotificationRepository(enhancedClient, "test-table");
    }

    @Test
    @DisplayName("save generates an id and derives PK/SK")
    void save_generatesKeys() {
        InAppNotification n = InAppNotification.builder()
                .userSub("u1").title("t").body("b").build();

        repository.save(n);

        ArgumentCaptor<InAppNotification> captor = ArgumentCaptor.forClass(InAppNotification.class);
        verify(table).putItem(captor.capture());
        InAppNotification stored = captor.getValue();
        assertThat(stored.getId()).isNotNull();
        assertThat(stored.getPk()).isEqualTo("NOTIFICATION#" + stored.getId());
        assertThat(stored.getSk()).isEqualTo("META");
    }

    @Test
    @DisplayName("findById builds the primary key from the id")
    void findById_buildsKey() {
        UUID id = UUID.randomUUID();
        InAppNotification expected = InAppNotification.builder().id(id).userSub("u1").build();
        when(table.getItem(any(Key.class))).thenReturn(expected);

        Optional<InAppNotification> result = repository.findById(id);

        assertThat(result).containsSame(expected);
        ArgumentCaptor<Key> keyCaptor = ArgumentCaptor.forClass(Key.class);
        verify(table).getItem(keyCaptor.capture());
        assertThat(keyCaptor.getValue().partitionKeyValue().s()).isEqualTo("NOTIFICATION#" + id);
    }

    @Test
    @DisplayName("findById returns empty for a null id without touching DynamoDB")
    void findById_nullId() {
        assertThat(repository.findById(null)).isEmpty();
        verify(table, never()).getItem(any(Key.class));
    }
}
