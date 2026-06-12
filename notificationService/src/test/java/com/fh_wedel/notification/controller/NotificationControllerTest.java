package com.fh_wedel.notification.controller;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationRequest;
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

    @Test
    void shouldReturnDispatchedResponse() {
        var id = UUID.randomUUID();
        when(dispatcher.dispatch(any())).thenReturn(List.of(id));

        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );

        var response = controller.sendNotification(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().notificationIds()).containsExactly(id);
        assertThat(response.getBody().status()).isEqualTo("DISPATCHED");
    }
}
