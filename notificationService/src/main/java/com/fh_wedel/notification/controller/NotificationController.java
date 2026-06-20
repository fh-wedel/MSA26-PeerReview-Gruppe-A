package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.model.NotificationResponse;
import com.fh_wedel.notification.model.NotificationStatus;
import com.fh_wedel.notification.service.NotificationDispatcher;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
        List<NotificationLog> logs = dispatcher.dispatch(request);

        List<UUID> ids = logs.stream().map(NotificationLog::getId).toList();
        return ResponseEntity.ok(new NotificationResponse(ids, aggregateStatus(logs)));
    }

    /**
     * Derives the overall dispatch status from the individual log results:
     * all SENT → DISPATCHED, mixed → PARTIAL, all FAILED (or nothing
     * dispatched) → FAILED.
     */
    private String aggregateStatus(List<NotificationLog> logs) {
        if (logs.isEmpty()) {
            return "FAILED";
        }
        long sent = logs.stream().filter(l -> l.getStatus() == NotificationStatus.SENT).count();
        if (sent == 0) {
            return "FAILED";
        }
        if (sent == logs.size()) {
            return "DISPATCHED";
        }
        return "PARTIAL";
    }
}
