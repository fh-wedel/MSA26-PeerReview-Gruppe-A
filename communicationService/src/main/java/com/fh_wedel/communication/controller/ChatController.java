package com.fh_wedel.communication.controller;

import com.fh_wedel.communication.api.ChatsApi;
import com.fh_wedel.communication.model.api.ChatDetailResponse;
import com.fh_wedel.communication.model.api.ChatListResponse;
import com.fh_wedel.communication.model.api.SendMessageRequest;
import com.fh_wedel.communication.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class ChatController implements ChatsApi {

    private final ChatService chatService;
    private final HttpServletRequest request;

    public ChatController(ChatService chatService, HttpServletRequest request) {
        this.chatService = chatService;
        this.request = request;
    }

    private String getUserId() {
        return request.getHeader("x-auth-principal-id");
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
        return ResponseEntity.ok(chatService.sendMessage(getUserId(), sendMessageRequest));
    }

    @GetMapping(value = "/chats/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChats() {
        return chatService.subscribe(getUserId());
    }
}
