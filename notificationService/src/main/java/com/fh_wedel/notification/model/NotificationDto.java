package com.fh_wedel.notification.model;

import java.time.Instant;

public record NotificationDto(
        String id,
        String title,
        String message,
        boolean read,
        Instant date
) {
    public static NotificationDto from(InAppNotification n) {
        return new NotificationDto(
                n.getId().toString(),
                n.getTitle(),
                n.getBody(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
