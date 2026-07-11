package com.fh_wedel.communication.repository;

import com.fh_wedel.communication.model.db.ChatMetaItem;
import com.fh_wedel.communication.model.db.MessageItem;
import com.fh_wedel.communication.model.db.ParticipantLinkItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.TransactWriteItemsEnhancedRequest;

import java.util.Iterator;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatRepositoryTest {

    @Mock
    private DynamoDbEnhancedClient enhancedClient;

    @Mock
    private DynamoDbTable<ChatMetaItem> chatMetaTable;

    @Mock
    private DynamoDbTable<MessageItem> messageTable;

    @Mock
    private DynamoDbTable<ParticipantLinkItem> participantLinkTable;

    private ChatRepository chatRepository;

    @BeforeEach
    void setUp() {
        lenient().when(enhancedClient.table(anyString(), any(TableSchema.class)))
                .thenReturn((DynamoDbTable) chatMetaTable)
                .thenReturn((DynamoDbTable) messageTable)
                .thenReturn((DynamoDbTable) participantLinkTable);

        lenient().when(chatMetaTable.tableName()).thenReturn("TestTable");
        lenient().when(chatMetaTable.tableSchema()).thenReturn(TableSchema.fromBean(ChatMetaItem.class));
        lenient().when(messageTable.tableName()).thenReturn("TestTable");
        lenient().when(messageTable.tableSchema()).thenReturn(TableSchema.fromBean(MessageItem.class));
        lenient().when(participantLinkTable.tableName()).thenReturn("TestTable");
        lenient().when(participantLinkTable.tableSchema()).thenReturn(TableSchema.fromBean(ParticipantLinkItem.class));

        chatRepository = new ChatRepository(enhancedClient, "TestTable");
    }

    @Test
    void testFindChatMeta() {
        ChatMetaItem expected = new ChatMetaItem();
        when(chatMetaTable.getItem(any(Key.class))).thenReturn(expected);

        Optional<ChatMetaItem> result = chatRepository.findChatMeta("chatId");
        assertTrue(result.isPresent());
        assertEquals(expected, result.get());
        
        ArgumentCaptor<Key> keyCaptor = ArgumentCaptor.forClass(Key.class);
        verify(chatMetaTable).getItem(keyCaptor.capture());
        Key key = keyCaptor.getValue();
        assertEquals("CHAT#chatId", key.partitionKeyValue().s());
        assertEquals("META", key.sortKeyValue().get().s());
    }

    @Test
    void testFindParticipantLinks() {
        PageIterable<ParticipantLinkItem> pageIterable = mock(PageIterable.class);
        when(participantLinkTable.query(any(QueryEnhancedRequest.class))).thenReturn(pageIterable);
        
        List<ParticipantLinkItem> expected = List.of(new ParticipantLinkItem());
        software.amazon.awssdk.core.pagination.sync.SdkIterable<ParticipantLinkItem> sdkIterable = () -> expected.iterator();
        when(pageIterable.items()).thenReturn(sdkIterable);

        List<ParticipantLinkItem> result = chatRepository.findParticipantLinks("userId");
        assertEquals(1, result.size());
        assertEquals(expected.get(0), result.get(0));
    }
    
    @Test
    void testFindMessages() {
        PageIterable<MessageItem> pageIterable = mock(PageIterable.class);
        Iterator<Page<MessageItem>> pageIterator = mock(Iterator.class);
        Page<MessageItem> page = mock(Page.class);

        when(messageTable.query(any(QueryEnhancedRequest.class))).thenReturn(pageIterable);
        when(pageIterable.iterator()).thenReturn(pageIterator);
        when(pageIterator.next()).thenReturn(page);
        
        List<MessageItem> items = List.of(new MessageItem());
        when(page.items()).thenReturn(items);
        when(page.lastEvaluatedKey()).thenReturn(null);

        ChatRepository.MessagePage result = chatRepository.findMessages("chatId", "nextToken", 10);
        
        assertNotNull(result);
        assertEquals(1, result.messages.size());
        assertNull(result.nextToken);
    }
    
    @Test
    void testCreateChatWithFirstMessage() {
        ChatMetaItem meta = new ChatMetaItem();
        ParticipantLinkItem link1 = new ParticipantLinkItem();
        ParticipantLinkItem link2 = new ParticipantLinkItem();
        MessageItem msg = new MessageItem();

        chatRepository.createChatWithFirstMessage(meta, link1, link2, msg);
        
        verify(enhancedClient).transactWriteItems(any(TransactWriteItemsEnhancedRequest.class));
    }
    
    @Test
    void testCreateGroupChatWithFirstMessage() {
        ChatMetaItem meta = new ChatMetaItem();
        ParticipantLinkItem link1 = new ParticipantLinkItem();
        MessageItem msg = new MessageItem();

        chatRepository.createGroupChatWithFirstMessage(meta, List.of(link1), msg);
        
        verify(enhancedClient).transactWriteItems(any(TransactWriteItemsEnhancedRequest.class));
    }
    
    @Test
    void testAddMessage() {
        ParticipantLinkItem link1 = new ParticipantLinkItem();
        ParticipantLinkItem link2 = new ParticipantLinkItem();
        MessageItem msg = new MessageItem();

        chatRepository.addMessage(msg, link1, link2);
        
        verify(enhancedClient).transactWriteItems(any(TransactWriteItemsEnhancedRequest.class));
    }
    
    @Test
    void testAddGroupMessage() {
        ParticipantLinkItem link1 = new ParticipantLinkItem();
        MessageItem msg = new MessageItem();

        chatRepository.addGroupMessage(msg, List.of(link1));
        
        verify(enhancedClient).transactWriteItems(any(TransactWriteItemsEnhancedRequest.class));
    }
}
