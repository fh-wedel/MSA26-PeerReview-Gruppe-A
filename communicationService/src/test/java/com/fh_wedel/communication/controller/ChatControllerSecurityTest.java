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
    void testSendMessage() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-a");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");

        SendMessageRequest req = new SendMessageRequest();
        req.setBody("Hello");
        ChatContext ctx = new ChatContext();
        ctx.setType(ChatContext.TypeEnum.GENERAL);
        req.setChatContext(ctx);
        req.setRecipientId("user-b");

        ChatDetailResponse mockRes = new ChatDetailResponse();
        mockRes.setChatId("chat-1");

        when(chatService.sendMessage(eq("user-a"), eq(req), eq("Bearer token"))).thenReturn(mockRes);

        ResponseEntity<ChatDetailResponse> response = chatController.sendMessage(req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("chat-1", response.getBody().getChatId());
    }

    @Test
    void testGetChat_Forbidden() {
        when(request.getHeader("x-auth-principal-id")).thenReturn("user-c");
        
        when(chatService.getChat("user-c", "chat-1", null, null))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden"));

        assertThrows(ResponseStatusException.class, () -> chatController.getChat("chat-1", null, null));
    }
}
