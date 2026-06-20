package com.fh_wedel.configuration.model;

import java.util.List;
import java.util.Map;

public record NotificationEvent(
        String eventType,
        List<String> channels,
        String recipientUserId,
        String subject,
        String body,
        Map<String, String> metadata
) {}
