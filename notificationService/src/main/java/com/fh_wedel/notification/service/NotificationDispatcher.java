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
import java.util.UUID;
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

    public List<UUID> dispatch(NotificationRequest request) {
        List<UUID> ids = new ArrayList<>();

        for (ChannelType channelType : request.channels()) {
            NotificationChannel channel = channelMap.get(channelType);
            if (channel == null || !channel.isEnabled()) {
                log.warn("Channel {} is not available or disabled", channelType);
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
                ids.add(logEntry.getId());
            }
        }

        return ids;
    }
}
