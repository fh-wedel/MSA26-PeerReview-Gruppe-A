package com.fh_wedel.communication.controller;

import com.fh_wedel.communication.api.ChatsApi;
import com.fh_wedel.communication.model.api.ChatDetailResponse;
import com.fh_wedel.communication.model.api.ChatListResponse;
import com.fh_wedel.communication.model.api.SendMessageRequest;
import com.fh_wedel.communication.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
        if (raw == null) return null;
        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner = (firstQuote >= 0 && lastQuote > firstQuote) ? raw.substring(firstQuote + 1, lastQuote) : raw;
        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }

    @Override
    public ResponseEntity<ChatDetailResponse> getChat(String chatId, String nextToken, Integer limit) {
        return ResponseEntity.ok()
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .body(chatService.getChat(getUserId(), chatId, nextToken, limit));
    }

    @Override
    public ResponseEntity<ChatListResponse> listChats() {
        return ResponseEntity.ok()
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .body(chatService.listChats(getUserId()));
    }

    @Override
    public ResponseEntity<ChatDetailResponse> sendMessage(SendMessageRequest sendMessageRequest) {
        return ResponseEntity.ok(chatService.sendMessage(getUserId(), sendMessageRequest));
    }

    @GetMapping(value = "/chats/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamChats() {
        return ResponseEntity.ok()
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .body(chatService.subscribe(getUserId()));
    }
}
