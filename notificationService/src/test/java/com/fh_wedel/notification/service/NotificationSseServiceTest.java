package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.NotificationDto;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class NotificationSseServiceTest {

    @Test
    void testSubscribeAndPush() {
        NotificationSseService sseService = new NotificationSseService();
        String userSub = "user-123";

        SseEmitter emitter = sseService.subscribe(userSub);
        assertNotNull(emitter);

        NotificationDto dto = new NotificationDto("1", "Test", "Message", false, java.time.Instant.now());
        assertDoesNotThrow(() -> sseService.push(userSub, dto));
    }
    
    @Test
    void testPushNoSubscriber() {
        NotificationSseService sseService = new NotificationSseService();
        NotificationDto dto = new NotificationDto("1", "Test", "Message", false, java.time.Instant.now());
        
        assertDoesNotThrow(() -> sseService.push("non-existent-user", dto));
    }
}
