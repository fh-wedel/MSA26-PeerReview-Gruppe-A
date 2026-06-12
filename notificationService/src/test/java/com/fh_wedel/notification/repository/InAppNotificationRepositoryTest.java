package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class InAppNotificationRepositoryTest {

    @Autowired
    private InAppNotificationRepository repository;

    @Test
    void findsByUserSubNewestFirst() {
        repository.save(InAppNotification.builder().userSub("u1").title("old").body("b")
                .createdAt(Instant.parse("2020-01-01T00:00:00Z")).build());
        repository.save(InAppNotification.builder().userSub("u1").title("new").body("b")
                .createdAt(Instant.parse("2021-01-01T00:00:00Z")).build());
        repository.save(InAppNotification.builder().userSub("other").title("x").body("b").build());

        List<InAppNotification> result = repository.findByUserSubOrderByCreatedAtDesc("u1");

        assertThat(result).extracting(InAppNotification::getTitle).containsExactly("new", "old");
    }
}
