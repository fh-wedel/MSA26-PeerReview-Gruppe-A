package com.fh_wedel.communication.controller;

import com.fh_wedel.communication.api.ChatsApi;
import com.fh_wedel.communication.model.api.ChatDetailResponse;
import com.fh_wedel.communication.model.api.ChatListResponse;
import com.fh_wedel.communication.model.api.SendMessageRequest;
import com.fh_wedel.communication.service.ChatService;
import com.fh_wedel.communication.security.PrincipalNormalizer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/communication")
public class ChatController implements ChatsApi {

    private final ChatService chatService;
    private final HttpServletRequest request;

    public ChatController(ChatService chatService, HttpServletRequest request) {
        this.chatService = chatService;
        this.request = request;
    }

    private String getUserId() {
        String raw = request.getHeader("x-auth-principal-id");
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing x-auth-principal-id header");
        }
        return PrincipalNormalizer.normalize(raw);
    }

    @Override
    public ResponseEntity<ChatDetailResponse> getChat(String chatId, String nextToken, Integer limit) {
        return ResponseEntity.ok(chatService.getChat(getUserId(), chatId, nextToken, limit));
    }

    @Override
    public ResponseEntity<ChatListResponse> listChats() {
        return ResponseEntity.ok(chatService.listChats(getUserId()));
    }

    @Override
    public ResponseEntity<ChatDetailResponse> sendMessage(SendMessageRequest sendMessageRequest) {
        String authHeader = request.getHeader("Authorization");
        return ResponseEntity.ok(chatService.sendMessage(getUserId(), sendMessageRequest, authHeader));
    }

    @GetMapping(value = "/chats/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChats() {
        return chatService.subscribe(getUserId());
    }
}
