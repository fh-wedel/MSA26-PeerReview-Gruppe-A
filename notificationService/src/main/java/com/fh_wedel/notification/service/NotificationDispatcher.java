package com.fh_wedel.notification.service;

import com.fh_wedel.notification.channel.NotificationChannel;
import com.fh_wedel.notification.model.*;
import com.fh_wedel.notification.repository.NotificationLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationDispatcher {

    private final Map<ChannelType, NotificationChannel> channelMap;
    private final NotificationLogRepository logRepository;

    public NotificationDispatcher(List<NotificationChannel> channels, NotificationLogRepository logRepository) {
        this.channelMap = channels.stream()
                .collect(Collectors.toMap(NotificationChannel::getChannelType, Function.identity()));
        this.logRepository = logRepository;
    }

    /**
     * Sends the notification over every requested channel/recipient combination
     * and persists a {@link NotificationLog} for each attempt — including
     * disabled/unknown channels (recorded as {@code FAILED}). Returns the
     * persisted logs so callers can derive an aggregate status.
     */
    public List<NotificationLog> dispatch(NotificationRequest request) {
        List<NotificationLog> logs = new ArrayList<>();

        for (ChannelType channelType : request.channels()) {
            NotificationChannel channel = channelMap.get(channelType);
            if (channel == null || !channel.isEnabled()) {
                log.warn("Channel {} is not available or disabled", channelType);
                // Record a FAILED log entry per recipient so the history stays
                // complete and the ids surface in the REST response.
                for (String recipient : request.recipients()) {
                    var skipped = NotificationLog.builder()
                            .channel(channelType)
                            .recipient(recipient)
                            .subject(request.subject())
                            .body(request.body())
                            .status(NotificationStatus.FAILED)
                            .errorMessage("channel disabled or unknown")
                            .build();
                    logRepository.save(skipped);
                    logs.add(skipped);
                }
                continue;
            }

            for (String recipient : request.recipients()) {
                var logEntry = NotificationLog.builder()
                        .channel(channelType)
                        .recipient(recipient)
                        .subject(request.subject())
                        .body(request.body())
                        .status(NotificationStatus.PENDING)
                        .build();

                try {
                    channel.send(recipient, request.subject(), request.body());
                    logEntry.setStatus(NotificationStatus.SENT);
                    logEntry.setSentAt(Instant.now());
                } catch (Exception e) {
                    log.error("Failed to send {} notification to {}: {}", channelType, recipient, e.getMessage());
                    logEntry.setStatus(NotificationStatus.FAILED);
                    logEntry.setErrorMessage(e.getMessage());
                }

                logRepository.save(logEntry);
                logs.add(logEntry);
            }
        }

        return logs;
    }
}
