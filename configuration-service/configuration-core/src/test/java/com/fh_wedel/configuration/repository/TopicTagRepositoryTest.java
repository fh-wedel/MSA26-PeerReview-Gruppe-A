package com.fh_wedel.configuration.repository;

import com.fh_wedel.configuration.model.TopicTag;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicTagRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;
    @Mock
    private DynamoDbTable<TopicTag> table;

    private TopicTagRepository repository;

    @BeforeEach
    void setUp() {
        when(enhancedClient.table(eq("TestTable"), any(TableSchema.class))).thenReturn(table);
        repository = new TopicTagRepository(enhancedClient, "TestTable");
    }

    @Test
    void save() {
        TopicTag tag = new TopicTag();
        tag.setTagName("Java");

        repository.save(tag);

        verify(table).putItem(tag);
    }

    @Test
    void delete() {
        repository.delete("Java");

        verify(table).deleteItem(any(Key.class));
    }

    @Test
    void findByTagName_found() {
        TopicTag tag = new TopicTag();
        tag.setTagName("Java");
        when(table.getItem(any(Key.class))).thenReturn(tag);

        Optional<TopicTag> result = repository.findByTagName("Java");

        assertTrue(result.isPresent());
        assertEquals("Java", result.get().getTagName());
        verify(table).getItem(any(Key.class));
    }

    @Test
    void findByTagName_notFound() {
        when(table.getItem(any(Key.class))).thenReturn(null);

        Optional<TopicTag> result = repository.findByTagName("Java");

        assertFalse(result.isPresent());
        verify(table).getItem(any(Key.class));
    }

    @Test
    void findAll() {
        TopicTag tag1 = new TopicTag();
        tag1.setTagName("Java");
        TopicTag tag2 = new TopicTag();
        tag2.setTagName("Spring");

        PageIterable<TopicTag> pageIterable = mock(PageIterable.class);
        software.amazon.awssdk.core.pagination.sync.SdkIterable<TopicTag> sdkIterable = mock(software.amazon.awssdk.core.pagination.sync.SdkIterable.class);
        when(sdkIterable.stream()).thenReturn(java.util.stream.Stream.of(tag1, tag2));
        when(pageIterable.items()).thenReturn(sdkIterable);
        
        when(table.query(any(java.util.function.Consumer.class))).thenReturn(pageIterable);

        List<TopicTag> results = repository.findAll();

        assertEquals(2, results.size());
        assertEquals("Java", results.get(0).getTagName());
    }
}
