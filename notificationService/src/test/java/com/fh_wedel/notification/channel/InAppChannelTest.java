package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import com.fh_wedel.notification.service.NotificationSseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppChannelTest {

    @Mock private InAppNotificationRepository repository;
    @Mock private NotificationSseService sseService;
    @InjectMocks private InAppChannel channel;

    @Test
    void returnsInAppChannelTypeAndIsEnabled() {
        assertThat(channel.getChannelType()).isEqualTo(ChannelType.IN_APP);
        assertThat(channel.isEnabled()).isTrue();
    }

    @Test
    void persistsNotificationAndPushesSse() {
        when(repository.save(any(InAppNotification.class))).thenAnswer(inv -> {
            InAppNotification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        channel.send("sub-1", "Review Assigned", "You have been assigned");

        ArgumentCaptor<InAppNotification> captor = ArgumentCaptor.forClass(InAppNotification.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUserSub()).isEqualTo("sub-1");
        assertThat(captor.getValue().getTitle()).isEqualTo("Review Assigned");
        assertThat(captor.getValue().isRead()).isFalse();

        verify(sseService).push(eq("sub-1"), any());
    }
}
