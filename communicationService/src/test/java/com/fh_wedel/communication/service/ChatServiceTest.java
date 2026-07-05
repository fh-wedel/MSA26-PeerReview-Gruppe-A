package com.fh_wedel.communication.service;

import com.fh_wedel.communication.model.api.*;
import com.fh_wedel.communication.model.db.ChatMetaItem;
import com.fh_wedel.communication.model.db.MessageItem;
import com.fh_wedel.communication.model.db.ParticipantLinkItem;
import com.fh_wedel.communication.repository.ChatRepository;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import com.fh_wedel.matching.client.model.MatchEntry;
import com.fh_wedel.configuration.client.model.ReviewRulesDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Mock
    private MatchingServiceClient matchingServiceClient;

    @Mock
    private ConfigurationServiceClient configurationServiceClient;

    @InjectMocks
    private ChatService chatService;

    @Test
    void testNormalizeUserId() {
        assertEquals("abc-123", ChatService.normalizeUserId("abc-123"));
        assertEquals("abc-123", ChatService.normalizeUserId("eu-central-1_abc|abc-123"));
        assertEquals("abc-123", ChatService.normalizeUserId("PeerReview::User::\"eu-central-1_abc|abc-123\""));
        assertNull(ChatService.normalizeUserId(null));
    }

    @Test
    void testGetChat_NotFound() {
        when(chatRepository.findChatMeta("chatId")).thenReturn(Optional.empty());
        
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> 
            chatService.getChat("userId", "chatId", null, 10));
            
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void testGetChat_SubmissionForbidden() {
        ChatMetaItem meta = ChatMetaItem.builder()
                .chatType("SUBMISSION")
                .participants(List.of("other1", "other2"))
                .build();
        when(chatRepository.findChatMeta("chatId")).thenReturn(Optional.of(meta));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> 
            chatService.getChat("user1", "chatId", null, 10));
            
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void testGetChat_GeneralForbidden() {
        ChatMetaItem meta = ChatMetaItem.builder()
                .chatType("GENERAL")
                .participantA("userA")
                .participantB("userB")
                .build();
        when(chatRepository.findChatMeta("chatId")).thenReturn(Optional.of(meta));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> 
            chatService.getChat("userC", "chatId", null, 10));
            
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void testGetChat_SuccessSubmission() {
        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#chatId")
                .chatType("SUBMISSION")
                .participants(List.of("user1", "user2"))
                .submissionId("sub1")
                .createdAt("2023-01-01T00:00:00Z")
                .build();
        when(chatRepository.findChatMeta("chatId")).thenReturn(Optional.of(meta));
        
        MessageItem msgItem = MessageItem.builder()
                .sk("MSG#2023-01-01T00:00:00Z#msgId")
                .senderId("user2")
                .body("hello")
                .sentAt("2023-01-01T00:00:00Z")
                .build();
        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(msgItem), "next");
        
        when(chatRepository.findMessages(eq("chatId"), eq("token"), anyInt())).thenReturn(page);

        ChatDetailResponse response = chatService.getChat("user1", "chatId", "token", 100);

        assertEquals("chatId", response.getChatId());
        assertEquals(ChatDetailResponse.ChatTypeEnum.SUBMISSION, response.getChatType());
        assertEquals("sub1", response.getSubmissionId());
        assertEquals(List.of("user1", "user2"), response.getParticipants());
        assertEquals("next", response.getNextToken());
        assertEquals(1, response.getMessages().size());
        assertEquals("msgId", response.getMessages().get(0).getMessageId());
        assertEquals("hello", response.getMessages().get(0).getBody());
        assertEquals("user2", response.getMessages().get(0).getSenderId());
    }

    @Test
    void testGetChat_SuccessGeneral() {
        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#chatId")
                .chatType("GENERAL")
                .participantA("user1")
                .participantB("user2")
                .createdAt("2023-01-01T00:00:00Z")
                .build();
        when(chatRepository.findChatMeta("chatId")).thenReturn(Optional.of(meta));

        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(), null);
        
        when(chatRepository.findMessages(eq("chatId"), isNull(), anyInt())).thenReturn(page);

        ChatDetailResponse response = chatService.getChat("user1", "chatId", null, null);

        assertEquals("chatId", response.getChatId());
        assertEquals(ChatDetailResponse.ChatTypeEnum.GENERAL, response.getChatType());
        assertEquals("user1", response.getParticipantA());
        assertEquals("user2", response.getParticipantB());
        assertNull(response.getNextToken());
        assertTrue(response.getMessages().isEmpty());
    }
    
    @Test
    void testSendMessage_GeneralNew() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello there");
        req.setRecipientId("userB");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.GENERAL);
        req.setChatContext(ctx);
        
        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#dummy")
                .chatType("GENERAL")
                .participantA("userA")
                .participantB("userB")
                .createdAt("2023-01-01T00:00:00Z")
                .build();
        
        when(chatRepository.findChatMeta(anyString()))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(meta));
            
        MessageItem msgItem = MessageItem.builder()
                .sk("MSG#2023-01-01T00:00:00Z#msgId")
                .senderId("userA")
                .body("Hello there")
                .sentAt("2023-01-01T00:00:00Z")
                .build();
        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(msgItem), null);
        when(chatRepository.findMessages(anyString(), isNull(), anyInt())).thenReturn(page);
        
        ChatDetailResponse res = chatService.sendMessage("userA", req);
        
        assertNotNull(res);
        verify(chatRepository).createChatWithFirstMessage(any(), any(), any(), any());
    }

    @Test
    void testSendMessage_GeneralExisting() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello there again");
        req.setRecipientId("userB");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.GENERAL);
        req.setChatContext(ctx);

        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#dummy")
                .chatType("GENERAL")
                .participantA("userA")
                .participantB("userB")
                .createdAt("2023-01-01T00:00:00Z")
                .build();

        when(chatRepository.findChatMeta(anyString()))
                .thenReturn(Optional.of(meta));

        MessageItem msgItem = MessageItem.builder()
                .sk("MSG#2023-01-01T00:00:00Z#msgId")
                .senderId("userA")
                .body("Hello there again")
                .sentAt("2023-01-01T00:00:00Z")
                .build();
        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(msgItem), null);
        when(chatRepository.findMessages(anyString(), isNull(), anyInt())).thenReturn(page);

        ChatDetailResponse res = chatService.sendMessage("userA", req);

        assertNotNull(res);
        verify(chatRepository).addMessage(any(), any(), any());
    }

    @Test
    void testSendMessage_GeneralNoRecipientId() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello there");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.GENERAL);
        req.setChatContext(ctx);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> 
            chatService.sendMessage("userA", req));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("recipientId is required"));
    }
    
    @Test
    void testSendMessage_SubmissionNew() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Group hello");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.SUBMISSION);
        ctx.setSubmissionId("sub1");
        req.setChatContext(ctx);
        
        ReviewRulesDto rules = new ReviewRulesDto();
        rules.setAuthorReviewerChatAllowed(true);
        when(configurationServiceClient.getSubmissionRules("sub1")).thenReturn(rules);
        
        SubmissionMatchResponse match = new SubmissionMatchResponse();
        match.setSubmitterIds(List.of("userA"));
        MatchEntry entry = new MatchEntry();
        entry.setExaminerId("userB");
        match.setMatches(List.of(entry));
        when(matchingServiceClient.getSubmissionMatch("sub1")).thenReturn(match);
        
        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#dummy")
                .chatType("SUBMISSION")
                .participants(List.of("userA", "userB"))
                .submissionId("sub1")
                .createdAt("2023-01-01T00:00:00Z")
                .build();
                
        when(chatRepository.findChatMeta(anyString()))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(meta));
            
        MessageItem msgItem = MessageItem.builder()
                .sk("MSG#2023-01-01T00:00:00Z#msgId")
                .senderId("userA")
                .body("Group hello")
                .sentAt("2023-01-01T00:00:00Z")
                .build();
        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(msgItem), null);
        when(chatRepository.findMessages(anyString(), isNull(), anyInt())).thenReturn(page);
        
        ChatDetailResponse res = chatService.sendMessage("userA", req);
        
        assertNotNull(res);
        verify(chatRepository).createGroupChatWithFirstMessage(any(), anyList(), any());
    }

    @Test
    void testSendMessage_SubmissionExisting() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Group hello again");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.SUBMISSION);
        ctx.setSubmissionId("sub1");
        req.setChatContext(ctx);

        ReviewRulesDto rules = new ReviewRulesDto();
        rules.setAuthorReviewerChatAllowed(true);
        when(configurationServiceClient.getSubmissionRules("sub1")).thenReturn(rules);

        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#dummy")
                .chatType("SUBMISSION")
                .participants(List.of("userA", "userB", "userC"))
                .submissionId("sub1")
                .createdAt("2023-01-01T00:00:00Z")
                .build();

        when(chatRepository.findChatMeta(anyString()))
                .thenReturn(Optional.of(meta));

        MessageItem msgItem = MessageItem.builder()
                .sk("MSG#2023-01-01T00:00:00Z#msgId")
                .senderId("userA")
                .body("Group hello again")
                .sentAt("2023-01-01T00:00:00Z")
                .build();
        ChatRepository.MessagePage page = new ChatRepository.MessagePage(List.of(msgItem), null);
        when(chatRepository.findMessages(anyString(), isNull(), anyInt())).thenReturn(page);

        ChatDetailResponse res = chatService.sendMessage("userA", req);

        assertNotNull(res);
        verify(chatRepository).addGroupMessage(any(), anyList());
    }

    @Test
    void testSendMessage_SubmissionForbidden() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Group hello");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.SUBMISSION);
        ctx.setSubmissionId("sub1");
        req.setChatContext(ctx);

        ReviewRulesDto rules = new ReviewRulesDto();
        rules.setAuthorReviewerChatAllowed(false);
        when(configurationServiceClient.getSubmissionRules("sub1")).thenReturn(rules);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage("userA", req));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Chat is not allowed"));
    }

    @Test
    void testSendMessage_SubmissionNotParticipant() {
        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Group hello");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.SUBMISSION);
        ctx.setSubmissionId("sub1");
        req.setChatContext(ctx);

        ReviewRulesDto rules = new ReviewRulesDto();
        rules.setAuthorReviewerChatAllowed(true);
        when(configurationServiceClient.getSubmissionRules("sub1")).thenReturn(rules);

        ChatMetaItem meta = ChatMetaItem.builder()
                .pk("CHAT#dummy")
                .chatType("SUBMISSION")
                .participants(List.of("userB", "userC"))
                .submissionId("sub1")
                .createdAt("2023-01-01T00:00:00Z")
                .build();

        when(chatRepository.findChatMeta(anyString()))
                .thenReturn(Optional.of(meta));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage("userA", req));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("You are not a participant"));
    }

    @Test
    void testSubscribeAndNotify() {
        SseEmitter emitter = chatService.subscribe("userB");
        assertNotNull(emitter);

        Message msg = new Message();
        msg.setMessageId("msg1");
        msg.setBody("hey");

        assertDoesNotThrow(() -> 
            ReflectionTestUtils.invokeMethod(chatService, "notifyUser", "userB", "chat1", msg)
        );
    }
    
    @Test
    void testSubscribe_InvalidUserId() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> 
            chatService.subscribe("   "));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void testBuildParticipantList() {
        SubmissionMatchResponse match = new SubmissionMatchResponse();
        match.setSubmitterIds(List.of("sub1", "sub2", "sub1"));
        MatchEntry entry1 = new MatchEntry();
        entry1.setExaminerId("ex1");
        MatchEntry entry2 = new MatchEntry();
        entry2.setExaminerId("ex2");
        match.setMatches(List.of(entry1, entry2));

        List<String> participants = ReflectionTestUtils.invokeMethod(chatService, "buildParticipantList", match);
        assertNotNull(participants);
        assertEquals(4, participants.size());
        assertTrue(participants.containsAll(List.of("sub1", "sub2", "ex1", "ex2")));
    }
}
