package com.fh_wedel.communication.repository;

import com.fh_wedel.communication.model.db.ChatMetaItem;
import com.fh_wedel.communication.model.db.MessageItem;
import com.fh_wedel.communication.model.db.ParticipantLinkItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.TransactPutItemEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.TransactWriteItemsEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class ChatRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<ChatMetaItem> chatMetaTable;
    private final DynamoDbTable<MessageItem> messageTable;
    private final DynamoDbTable<ParticipantLinkItem> participantLinkTable;

    public ChatRepository(DynamoDbEnhancedClient enhancedClient, 
                          @Value("${aws.dynamodb.table-name}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.chatMetaTable = enhancedClient.table(tableName, TableSchema.fromBean(ChatMetaItem.class));
        this.messageTable = enhancedClient.table(tableName, TableSchema.fromBean(MessageItem.class));
        this.participantLinkTable = enhancedClient.table(tableName, TableSchema.fromBean(ParticipantLinkItem.class));
    }

    public Optional<ChatMetaItem> findChatMeta(String chatId) {
        Key key = Key.builder()
                .partitionValue("CHAT#" + chatId)
                .sortValue("META")
                .build();
        return Optional.ofNullable(chatMetaTable.getItem(key));
    }

    public List<ParticipantLinkItem> findParticipantLinks(String userId) {
        QueryConditional queryConditional = QueryConditional
                .keyEqualTo(Key.builder().partitionValue("USER#" + userId).build());

        PageIterable<ParticipantLinkItem> pages = participantLinkTable.query(
                QueryEnhancedRequest.builder()
                        .queryConditional(queryConditional)
                        .build()
        );

        return pages.items().stream().collect(Collectors.toList());
    }

    public MessagePage findMessages(String chatId, String nextToken, int limit) {
        QueryConditional queryConditional = QueryConditional
                .sortBeginsWith(Key.builder()
                        .partitionValue("CHAT#" + chatId)
                        .sortValue("MSG#")
                        .build());

        QueryEnhancedRequest.Builder requestBuilder = QueryEnhancedRequest.builder()
                .queryConditional(queryConditional)
                .scanIndexForward(false)
                .limit(limit);

        if (nextToken != null && !nextToken.isEmpty()) {
            Map<String, AttributeValue> exclusiveStartKey = new HashMap<>();
            exclusiveStartKey.put("pk", AttributeValue.builder().s("CHAT#" + chatId).build());
            exclusiveStartKey.put("sk", AttributeValue.builder().s(nextToken).build());
            requestBuilder.exclusiveStartKey(exclusiveStartKey);
        }

        var page = messageTable.query(requestBuilder.build()).iterator().next();

        String newNextToken = null;
        if (page.lastEvaluatedKey() != null && page.lastEvaluatedKey().containsKey("sk")) {
            newNextToken = page.lastEvaluatedKey().get("sk").s();
        }

        return new MessagePage(page.items(), newNextToken);
    }

    /** Creates a 1:1 GENERAL chat with two participant links and the first message. */
    public void createChatWithFirstMessage(ChatMetaItem metaItem, ParticipantLinkItem link1, ParticipantLinkItem link2, MessageItem messageItem) {
        TransactWriteItemsEnhancedRequest transaction = TransactWriteItemsEnhancedRequest.builder()
                .addPutItem(chatMetaTable, TransactPutItemEnhancedRequest.builder(ChatMetaItem.class).item(metaItem).build())
                .addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link1).build())
                .addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link2).build())
                .addPutItem(messageTable, TransactPutItemEnhancedRequest.builder(MessageItem.class).item(messageItem).build())
                .build();

        enhancedClient.transactWriteItems(transaction);
    }

    /** Creates a SUBMISSION group chat with N participant links and the first message. */
    public void createGroupChatWithFirstMessage(ChatMetaItem metaItem, List<ParticipantLinkItem> links, MessageItem messageItem) {
        TransactWriteItemsEnhancedRequest.Builder builder = TransactWriteItemsEnhancedRequest.builder()
                .addPutItem(chatMetaTable, TransactPutItemEnhancedRequest.builder(ChatMetaItem.class).item(metaItem).build())
                .addPutItem(messageTable, TransactPutItemEnhancedRequest.builder(MessageItem.class).item(messageItem).build());

        for (ParticipantLinkItem link : links) {
            builder.addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link).build());
        }

        enhancedClient.transactWriteItems(builder.build());
    }

    /** Adds a message to a 1:1 GENERAL chat and updates the two participant links. */
    public void addMessage(MessageItem messageItem, ParticipantLinkItem link1, ParticipantLinkItem link2) {
        TransactWriteItemsEnhancedRequest transaction = TransactWriteItemsEnhancedRequest.builder()
                .addPutItem(messageTable, TransactPutItemEnhancedRequest.builder(MessageItem.class).item(messageItem).build())
                .addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link1).build())
                .addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link2).build())
                .build();

        enhancedClient.transactWriteItems(transaction);
    }

    /** Adds a message to a SUBMISSION group chat and updates all N participant links. */
    public void addGroupMessage(MessageItem messageItem, List<ParticipantLinkItem> links) {
        TransactWriteItemsEnhancedRequest.Builder builder = TransactWriteItemsEnhancedRequest.builder()
                .addPutItem(messageTable, TransactPutItemEnhancedRequest.builder(MessageItem.class).item(messageItem).build());

        for (ParticipantLinkItem link : links) {
            builder.addPutItem(participantLinkTable, TransactPutItemEnhancedRequest.builder(ParticipantLinkItem.class).item(link).build());
        }

        enhancedClient.transactWriteItems(builder.build());
    }

    public static class MessagePage {
        public final List<MessageItem> messages;
        public final String nextToken;

        public MessagePage(List<MessageItem> messages, String nextToken) {
            this.messages = messages;
            this.nextToken = nextToken;
        }
    }
}
