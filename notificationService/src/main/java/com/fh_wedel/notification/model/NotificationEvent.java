package com.fh_wedel.notification.model;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<ChannelType> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
