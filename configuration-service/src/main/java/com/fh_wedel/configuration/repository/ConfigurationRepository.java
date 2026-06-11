package com.fh_wedel.configuration.repository;

import com.fh_wedel.configuration.model.AuthorMapping;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Repository
@Slf4j
public class ConfigurationRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<SubmissionConfiguration> configTable;
    private final DynamoDbTable<AuthorMapping> authorMappingTable;
    private final DynamoDbIndex<AuthorMapping> authorIndex;

    public ConfigurationRepository(DynamoDbEnhancedClient enhancedClient,
                                   @Value("${aws.dynamodb.table-name}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.configTable = enhancedClient.table(tableName, TableSchema.fromBean(SubmissionConfiguration.class));
        this.authorMappingTable = enhancedClient.table(tableName, TableSchema.fromBean(AuthorMapping.class));
        this.authorIndex = authorMappingTable.index("AuthorIndex");
    }

    /**
     * Persists the submission configuration and all author mappings inside a batch write.
     */
    public void saveConfiguration(SubmissionConfiguration config, List<AuthorMapping> mappings) {
        log.info("Saving configuration for submission {} and {} author mappings",
                config.getSubmissionId(), mappings.size());

        var configWriteBatch = WriteBatch.builder(SubmissionConfiguration.class)
                .mappedTableResource(configTable)
                .addPutItem(config)
                .build();

        var authorWriteBatchBuilder = WriteBatch.builder(AuthorMapping.class)
                .mappedTableResource(authorMappingTable);
        for (AuthorMapping mapping : mappings) {
            authorWriteBatchBuilder.addPutItem(mapping);
        }

        var batchRequest = BatchWriteItemEnhancedRequest.builder()
                .writeBatches(configWriteBatch, authorWriteBatchBuilder.build())
                .build();

        enhancedClient.batchWriteItem(batchRequest);
    }

    /**
     * Persists the submission configuration only.
     */
    public void saveConfigurationOnly(SubmissionConfiguration config) {
        log.info("Saving configuration for submission {}", config.getSubmissionId());
        configTable.putItem(config);
    }

    /**
     * Retrieves the submission configuration by submission ID.
     */
    public SubmissionConfiguration findConfigurationById(String submissionId) {
        String pk = SubmissionConfiguration.PK_PREFIX + submissionId;
        Key key = Key.builder()
                .partitionValue(pk)
                .sortValue(SubmissionConfiguration.SK_VALUE)
                .build();
        return configTable.getItem(key);
    }

    /**
     * Finds all author mappings for a given author via GSI,
     * then resolves and returns the corresponding SubmissionConfigurations.
     */
    public List<SubmissionConfiguration> findConfigurationsByAuthor(String authorId) {
        log.info("Finding configurations for author {}", authorId);
        
        List<AuthorMapping> mappings = authorIndex.query(r -> r.queryConditional(
                QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(authorId).build()
                )
        )).stream()
                .flatMap(page -> page.items().stream())
                .toList();

        List<SubmissionConfiguration> configs = new ArrayList<>();
        for (AuthorMapping mapping : mappings) {
            SubmissionConfiguration config = findConfigurationById(mapping.getSubmissionId());
            if (config != null) {
                configs.add(config);
            }
        }
        return configs;
    }

    /**
     * Lists all submission configurations in the table.
     * Performs a Scan operation filtering for the SK "METADATA".
     */
    public List<SubmissionConfiguration> findAllConfigurations() {
        log.info("Scanning for all submission configurations");
        return configTable.scan().items().stream()
                .filter(c -> Objects.equals(c.getSk(), SubmissionConfiguration.SK_VALUE))
                .toList();
    }
}
