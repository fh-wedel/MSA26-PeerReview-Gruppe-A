package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.model.NotificationStatus;
import com.fh_wedel.notification.service.NotificationDispatcher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationDispatcher dispatcher;

    @InjectMocks
    private NotificationController controller;

    private NotificationLog logWithStatus(NotificationStatus status) {
        return NotificationLog.builder()
                .id(UUID.randomUUID())
                .channel(ChannelType.DISCORD)
                .recipient("user@test.com")
                .status(status)
                .build();
    }

    private NotificationRequest sampleRequest() {
        return new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );
    }

    @Test
    void shouldReturnDispatchedWhenAllSent() {
        var log = logWithStatus(NotificationStatus.SENT);
        when(dispatcher.dispatch(any())).thenReturn(List.of(log));

        var response = controller.sendNotification(sampleRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().notificationIds()).containsExactly(log.getId());
        assertThat(response.getBody().status()).isEqualTo("DISPATCHED");
    }

    @Test
    void shouldReturnPartialWhenMixed() {
        when(dispatcher.dispatch(any())).thenReturn(List.of(
                logWithStatus(NotificationStatus.SENT),
                logWithStatus(NotificationStatus.FAILED)));

        var response = controller.sendNotification(sampleRequest());

        assertThat(response.getBody().status()).isEqualTo("PARTIAL");
        assertThat(response.getBody().notificationIds()).hasSize(2);
    }

    @Test
    void shouldReturnFailedWhenAllFailed() {
        when(dispatcher.dispatch(any())).thenReturn(List.of(
                logWithStatus(NotificationStatus.FAILED)));

        var response = controller.sendNotification(sampleRequest());

        assertThat(response.getBody().status()).isEqualTo("FAILED");
    }

    @Test
    void shouldReturnFailedWhenNothingDispatched() {
        when(dispatcher.dispatch(any())).thenReturn(List.of());

        var response = controller.sendNotification(sampleRequest());

        assertThat(response.getBody().status()).isEqualTo("FAILED");
        assertThat(response.getBody().notificationIds()).isEmpty();
    }
}
