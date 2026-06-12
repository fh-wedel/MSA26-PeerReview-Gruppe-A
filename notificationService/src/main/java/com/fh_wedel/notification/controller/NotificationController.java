package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.model.NotificationResponse;
import com.fh_wedel.notification.service.NotificationDispatcher;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/notification")
@Slf4j
public class NotificationController {

    private final NotificationDispatcher dispatcher;

    public NotificationController(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody NotificationRequest request) {
        log.info("Received notification request for channels: {}", request.channels());
        List<UUID> ids = dispatcher.dispatch(request);
        return ResponseEntity.ok(new NotificationResponse(ids, "DISPATCHED"));
    }
}
