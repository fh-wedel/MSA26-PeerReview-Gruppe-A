package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.security.PrincipalNormalizer;
import com.fh_wedel.notification.service.InAppNotificationService;
import com.fh_wedel.notification.service.NotificationSseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notification")
@Slf4j
public class InboxController {

    private final InAppNotificationService service;
    private final NotificationSseService sseService;

    public InboxController(InAppNotificationService service, NotificationSseService sseService) {
        this.service = service;
        this.sseService = sseService;
    }

    private String requireSub(String principalId) {
        if (principalId == null || principalId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing x-auth-principal-id header");
        }
        return PrincipalNormalizer.normalize(principalId);
    }

    @GetMapping("/me")
    public List<NotificationDto> myNotifications(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        return service.listForUser(requireSub(principalId));
    }

    @GetMapping(value = "/me/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        return sseService.subscribe(requireSub(principalId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable UUID id,
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        boolean ok = service.markRead(requireSub(principalId), id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/me/read-all")
    public ResponseEntity<Void> markAllRead(
            @RequestHeader(value = "x-auth-principal-id", required = false) String principalId) {
        service.markAllRead(requireSub(principalId));
        return ResponseEntity.noContent().build();
    }
}
