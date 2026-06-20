package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import com.fh_wedel.notification.service.NotificationSseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class InAppChannel implements NotificationChannel {

    private final InAppNotificationRepository repository;
    private final NotificationSseService sseService;

    public InAppChannel(InAppNotificationRepository repository, NotificationSseService sseService) {
        this.repository = repository;
        this.sseService = sseService;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.IN_APP;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        InAppNotification saved = repository.save(InAppNotification.builder()
                .userSub(recipient)
                .title(subject)
                .body(body)
                .read(false)
                .build());
        log.info("Stored in-app notification {} for user {}", saved.getId(), recipient);
        sseService.push(recipient, NotificationDto.from(saved));
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
