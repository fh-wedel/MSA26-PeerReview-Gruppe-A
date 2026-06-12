package com.fh_wedel.notification.repository;

import com.fh_wedel.notification.model.InAppNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, UUID> {
    List<InAppNotification> findByUserSubOrderByCreatedAtDesc(String userSub);
}
