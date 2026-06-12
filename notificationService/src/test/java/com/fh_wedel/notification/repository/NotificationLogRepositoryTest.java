package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationLog;
import com.fh_wedel.notification.model.NotificationStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NotificationLogRepositoryTest {

    @Autowired
    private NotificationLogRepository repository;

    @Test
    void shouldSaveAndFindByStatus() {
        var log = NotificationLog.builder()
                .channel(ChannelType.DISCORD)
                .recipient("user@example.com")
                .subject("Test")
                .body("Hello")
                .status(NotificationStatus.SENT)
                .build();

        repository.save(log);

        List<NotificationLog> sent = repository.findByStatus(NotificationStatus.SENT);
        assertThat(sent).hasSize(1);
        assertThat(sent.getFirst().getRecipient()).isEqualTo("user@example.com");
    }
}
