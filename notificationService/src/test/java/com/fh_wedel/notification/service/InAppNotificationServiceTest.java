package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InAppNotificationServiceTest {

    @Mock private InAppNotificationRepository repository;
    @InjectMocks private InAppNotificationService service;

    @Test
    void markReadOnlyWhenOwnerMatches() {
        UUID id = UUID.randomUUID();
        InAppNotification n = InAppNotification.builder().id(id).userSub("owner").title("t").body("b").build();
        when(repository.findById(id)).thenReturn(Optional.of(n));

        assertThat(service.markRead("owner", id)).isTrue();
        verify(repository).save(any(InAppNotification.class));
        assertThat(n.isRead()).isTrue();
    }

    @Test
    void markReadFailsForForeignUser() {
        UUID id = UUID.randomUUID();
        InAppNotification n = InAppNotification.builder().id(id).userSub("owner").title("t").body("b").build();
        when(repository.findById(id)).thenReturn(Optional.of(n));

        assertThat(service.markRead("intruder", id)).isFalse();
        verify(repository, never()).save(any());
    }

    @Test
    void markReadFailsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        assertThat(service.markRead("owner", id)).isFalse();
    }

    @Test
    void listForUserReturnsMappedDtos() {
        InAppNotification n = InAppNotification.builder()
                .id(UUID.randomUUID())
                .title("T")
                .body("B")
                .createdAt(java.time.Instant.now())
                .read(false)
                .build();
        when(repository.findByUserSubOrderByCreatedAtDesc("user1")).thenReturn(java.util.List.of(n));

        java.util.List<com.fh_wedel.notification.model.NotificationDto> result = service.listForUser("user1");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().title()).isEqualTo("T");
    }

    @Test
    void markAllReadUpdatesAll() {
        InAppNotification n1 = InAppNotification.builder().read(false).build();
        InAppNotification n2 = InAppNotification.builder().read(false).build();
        when(repository.findByUserSubOrderByCreatedAtDesc("user1")).thenReturn(java.util.List.of(n1, n2));

        service.markAllRead("user1");

        assertThat(n1.isRead()).isTrue();
        assertThat(n2.isRead()).isTrue();
        verify(repository).saveAll(java.util.List.of(n1, n2));
    }
}
