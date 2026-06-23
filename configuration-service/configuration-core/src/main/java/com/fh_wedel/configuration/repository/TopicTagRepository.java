package com.fh_wedel.configuration.repository;

import com.fh_wedel.configuration.model.TopicTag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TopicTagRepository {

    private final DynamoDbTable<TopicTag> table;

    public TopicTagRepository(DynamoDbEnhancedClient enhancedClient,
                              @Value("${aws.dynamodb.table-name}") String tableName) {
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(TopicTag.class));
    }

    public void save(TopicTag tag) {
        table.putItem(tag);
    }

    public void delete(String tagName) {
        Key key = Key.builder()
                .partitionValue(TopicTag.PK_VALUE)
                .sortValue(TopicTag.SK_PREFIX + tagName)
                .build();
        table.deleteItem(key);
    }

    public Optional<TopicTag> findByTagName(String tagName) {
        Key key = Key.builder()
                .partitionValue(TopicTag.PK_VALUE)
                .sortValue(TopicTag.SK_PREFIX + tagName)
                .build();
        return Optional.ofNullable(table.getItem(key));
    }

    public List<TopicTag> findAll() {
        QueryConditional queryConditional = QueryConditional.keyEqualTo(Key.builder()
                .partitionValue(TopicTag.PK_VALUE)
                .build());

        return table.query(r -> r.queryConditional(queryConditional))
                .items()
                .stream()
                .collect(Collectors.toList());
    }
}
