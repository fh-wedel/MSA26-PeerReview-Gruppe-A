package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.NotificationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class NotificationSseService {

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userSub) {
        // Timeout < API Gateway 29s, damit idle Verbindungen sauber schließen.
        SseEmitter emitter = new SseEmitter(25000L);
        emitters.computeIfAbsent(userSub, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable onDetach = () -> {
            CopyOnWriteArrayList<SseEmitter> list = emitters.get(userSub);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    emitters.remove(userSub);
                }
            }
        };
        emitter.onCompletion(onDetach);
        emitter.onTimeout(onDetach);
        emitter.onError(e -> onDetach.run());
        return emitter;
    }

    public void push(String userSub, NotificationDto dto) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(userSub);
        if (list == null || list.isEmpty()) {
            log.debug("No active SSE emitters for user '{}'", userSub);
            return;
        }
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(dto));
                // Sofort schließen, damit der Lambda-Proxy die Response auflöst (< 29s).
                emitter.complete();
            } catch (Exception e) {
                log.warn("Failed to push SSE notification to '{}': {}", userSub, e.getMessage());
                emitter.completeWithError(e);
            }
        }
    }
}
