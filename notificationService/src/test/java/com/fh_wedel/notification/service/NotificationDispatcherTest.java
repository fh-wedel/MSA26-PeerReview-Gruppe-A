package com.fh_wedel.notification.service;

import com.fh_wedel.notification.channel.NotificationChannel;
import com.fh_wedel.notification.model.*;
import com.fh_wedel.notification.repository.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

    @Mock
    private NotificationChannel discordChannel;

    @Mock
    private NotificationLogRepository logRepository;

    private NotificationDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        when(discordChannel.getChannelType()).thenReturn(ChannelType.DISCORD);
        lenient().when(logRepository.save(any())).thenAnswer(invocation -> {
            NotificationLog log = invocation.getArgument(0);
            log.setId(UUID.randomUUID());
            return log;
        });
        dispatcher = new NotificationDispatcher(List.of(discordChannel), logRepository);
    }

    @Test
    void shouldDispatchToEnabledChannel() {
        when(discordChannel.isEnabled()).thenReturn(true);
        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Test Subject",
                "Test Body"
        );

        List<NotificationLog> logs = dispatcher.dispatch(request);

        assertThat(logs).hasSize(1);
        verify(discordChannel).send("user@test.com", "Test Subject", "Test Body");

        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.SENT);
    }

    @Test
    void shouldLogFailureWhenChannelThrows() {
        when(discordChannel.isEnabled()).thenReturn(true);
        doThrow(new RuntimeException("Webhook failed")).when(discordChannel)
                .send(any(), any(), any());

        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );

        List<NotificationLog> logs = dispatcher.dispatch(request);

        assertThat(logs).hasSize(1);
        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(captor.getValue().getErrorMessage()).isEqualTo("Webhook failed");
    }

    @Test
    void shouldLogFailedWhenChannelDisabled() {
        when(discordChannel.isEnabled()).thenReturn(false);

        var request = new NotificationRequest(
                List.of(ChannelType.DISCORD),
                List.of("user@test.com"),
                "Subject",
                "Body"
        );

        List<NotificationLog> logs = dispatcher.dispatch(request);

        assertThat(logs).hasSize(1);
        verify(discordChannel, never()).send(any(), any(), any());
        ArgumentCaptor<NotificationLog> captor = ArgumentCaptor.forClass(NotificationLog.class);
        verify(logRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(captor.getValue().getErrorMessage()).isEqualTo("channel disabled or unknown");
    }
}
