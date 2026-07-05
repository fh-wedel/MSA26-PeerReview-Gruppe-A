package com.fh_wedel.configuration.repository;

import com.fh_wedel.configuration.model.AuthorMapping;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.BatchWriteItemEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfigurationRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;
    @Mock
    private DynamoDbTable<SubmissionConfiguration> configTable;
    @Mock
    private DynamoDbTable<AuthorMapping> authorMappingTable;
    @Mock
    private DynamoDbIndex<AuthorMapping> authorIndex;

    private ConfigurationRepository repository;

    @BeforeEach
    void setUp() {
        when(enhancedClient.table(eq("TestTable"), any())).thenAnswer(invocation -> {
            TableSchema schema = invocation.getArgument(1);
            if (schema.itemType().rawClass().equals(SubmissionConfiguration.class)) {
                return configTable;
            }
            if (schema.itemType().rawClass().equals(AuthorMapping.class)) {
                return authorMappingTable;
            }
            return null;
        });

        when(authorMappingTable.index("AuthorIndex")).thenReturn(authorIndex);

        repository = new ConfigurationRepository(enhancedClient, "TestTable");
    }

    @Test
    void saveConfigurationOnly() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setSubmissionId("sub1");

        repository.saveConfigurationOnly(config);

        verify(configTable).putItem(config);
    }

    @Test
    void findConfigurationById() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        when(configTable.getItem(any(Key.class))).thenReturn(config);

        SubmissionConfiguration result = repository.findConfigurationById("sub1");

        assertNotNull(result);
        verify(configTable).getItem(any(Key.class));
    }

    @Test
    void findAllConfigurations() {
        SubmissionConfiguration config1 = new SubmissionConfiguration();
        config1.setSk(SubmissionConfiguration.SK_VALUE);
        SubmissionConfiguration config2 = new SubmissionConfiguration();
        config2.setSk("OTHER");

        PageIterable<SubmissionConfiguration> pageIterable = mock(PageIterable.class);
        software.amazon.awssdk.core.pagination.sync.SdkIterable<SubmissionConfiguration> sdkIterable = mock(software.amazon.awssdk.core.pagination.sync.SdkIterable.class);
        when(sdkIterable.stream()).thenReturn(java.util.stream.Stream.of(config1, config2));
        when(pageIterable.items()).thenReturn(sdkIterable);
        when(configTable.scan()).thenReturn(pageIterable);

        List<SubmissionConfiguration> results = repository.findAllConfigurations();

        assertEquals(1, results.size());
        assertEquals(config1, results.get(0));
    }

    @Test
    void findConfigurationsByAuthor() {
        AuthorMapping mapping = new AuthorMapping();
        mapping.setSubmissionId("sub1");

        PageIterable<AuthorMapping> pageIterable = mock(PageIterable.class);
        software.amazon.awssdk.enhanced.dynamodb.model.Page<AuthorMapping> page = mock(software.amazon.awssdk.enhanced.dynamodb.model.Page.class);
        when(page.items()).thenReturn(List.of(mapping));
        when(pageIterable.stream()).thenReturn(java.util.stream.Stream.of(page));
        when(authorIndex.query(any(java.util.function.Consumer.class))).thenReturn(pageIterable);

        SubmissionConfiguration config = new SubmissionConfiguration();
        when(configTable.getItem(any(Key.class))).thenReturn(config);

        List<SubmissionConfiguration> results = repository.findConfigurationsByAuthor("author1");

        assertEquals(1, results.size());
        assertEquals(config, results.get(0));
    }

    @Test
    void saveConfiguration() {
        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setSubmissionId("sub1");

        AuthorMapping mapping = new AuthorMapping();
        mapping.setSubmissionId("sub1");
        
        when(configTable.tableSchema()).thenReturn(TableSchema.fromBean(SubmissionConfiguration.class));
        when(authorMappingTable.tableSchema()).thenReturn(TableSchema.fromBean(AuthorMapping.class));

        repository.saveConfiguration(config, List.of(mapping));

        verify(enhancedClient).batchWriteItem(any(BatchWriteItemEnhancedRequest.class));
    }
}
