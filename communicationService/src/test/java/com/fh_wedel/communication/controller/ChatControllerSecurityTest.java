package com.fh_wedel.communication.controller;

import com.fh_wedel.communication.model.api.ChatContext;
import com.fh_wedel.communication.model.api.ChatDetailResponse;
import com.fh_wedel.communication.model.api.SendMessageRequest;
import com.fh_wedel.communication.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class ChatControllerSecurityTest {

    @Mock
    private ChatService chatService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private ChatController chatController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSendMessage_General() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-a");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");

        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello");
        req.setRecipientId("user-b");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.GENERAL);
        req.setChatContext(ctx);

        ChatDetailResponse mockRes = new ChatDetailResponse();
        mockRes.setChatId("chat-1");

        when(chatService.sendMessage(eq("user-a"), eq(req))).thenReturn(mockRes);

        ResponseEntity<ChatDetailResponse> response = chatController.sendMessage(req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("chat-1", response.getBody().getChatId());
    }

    @Test
    void testSendMessage_Submission_NoRecipientIdRequired() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-a");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");

        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello group");
        // No recipientId — not required for SUBMISSION chats
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.SUBMISSION);
        ctx.setSubmissionId("sub-123");
        req.setChatContext(ctx);

        ChatDetailResponse mockRes = new ChatDetailResponse();
        mockRes.setChatId("group-chat-1");

        when(chatService.sendMessage(eq("user-a"), eq(req))).thenReturn(mockRes);

        ResponseEntity<ChatDetailResponse> response = chatController.sendMessage(req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("group-chat-1", response.getBody().getChatId());
    }

    @Test
    void testGetChat_Forbidden() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-c");
        
        when(chatService.getChat("user-c", "chat-1", null, null))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden"));

        assertThrows(ResponseStatusException.class, () -> chatController.getChat("chat-1", null, null));
    }

    @Test
    void testGetUserId_DifferentFormats() {
        // Test normal format without quotes
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-1");
        when(chatService.listChats("user-1")).thenReturn(new com.fh_wedel.communication.model.api.ChatListResponse());
        ResponseEntity<?> res = chatController.listChats();
        assertEquals(200, res.getStatusCode().value());

        // Test with quotes
        when(request.getHeader("x-auth-principal-id")).thenReturn("\"user-2\"");
        when(chatService.listChats("user-2")).thenReturn(new com.fh_wedel.communication.model.api.ChatListResponse());
        res = chatController.listChats();
        assertEquals(200, res.getStatusCode().value());

        // Test with pipe
        when(request.getHeader("x-auth-principal-id")).thenReturn("\"eu-central-1_abc|user-3\"");
        when(chatService.listChats("user-3")).thenReturn(new com.fh_wedel.communication.model.api.ChatListResponse());
        res = chatController.listChats();
        assertEquals(200, res.getStatusCode().value());
        
        // Test with peer review
        when(request.getHeader("x-auth-principal-id")).thenReturn("PeerReview::User::\"eu-central-1_abc|user-4\"");
        when(chatService.listChats("user-4")).thenReturn(new com.fh_wedel.communication.model.api.ChatListResponse());
        res = chatController.listChats();
        assertEquals(200, res.getStatusCode().value());
        
        // Test null
        when(request.getHeader("x-auth-principal-id")).thenReturn(null);
        when(chatService.listChats(null)).thenReturn(new com.fh_wedel.communication.model.api.ChatListResponse());
        res = chatController.listChats();
        assertEquals(200, res.getStatusCode().value());
    }
    
    @Test
    void testStreamChats() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-a");
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter();
        when(chatService.subscribe("user-a")).thenReturn(emitter);
        
        ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.SseEmitter> res = chatController.streamChats();
        assertEquals(200, res.getStatusCode().value());
        assertEquals(emitter, res.getBody());
    }
}
