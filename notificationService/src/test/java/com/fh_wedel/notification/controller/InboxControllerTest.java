package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.service.InAppNotificationService;
import com.fh_wedel.notification.service.NotificationSseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InboxControllerTest {

    @Mock private InAppNotificationService service;
    @Mock private NotificationSseService sseService;
    @InjectMocks private InboxController controller;

    private static final String PRINCIPAL = "PeerReview::User::\"pool|sub-1\"";

    @Test
    void returnsNotificationsForCaller() {
        when(service.listForUser("sub-1"))
                .thenReturn(List.of(new NotificationDto("id", "t", "m", false, Instant.now())));

        List<NotificationDto> result = controller.myNotifications(PRINCIPAL);

        assertThat(result).hasSize(1);
    }

    @Test
    void rejectsMissingPrincipalHeader() {
        assertThatThrownBy(() -> controller.myNotifications(null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void markReadReturns404WhenNotOwned() {
        UUID id = UUID.randomUUID();
        when(service.markRead("sub-1", id)).thenReturn(false);

        assertThat(controller.markRead(id, PRINCIPAL).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void markReadReturns204WhenOwned() {
        UUID id = UUID.randomUUID();
        when(service.markRead("sub-1", id)).thenReturn(true);

        assertThat(controller.markRead(id, PRINCIPAL).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
