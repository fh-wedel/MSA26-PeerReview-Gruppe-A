package com.fh_wedel.notification.model;

import java.util.List;
import java.util.UUID;

public record NotificationResponse(
        List<UUID> notificationIds,
        String status
) {}
