package com.fh_wedel.notification.service;

import com.fh_wedel.notification.model.InAppNotification;
import com.fh_wedel.notification.model.NotificationDto;
import com.fh_wedel.notification.repository.InAppNotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class InAppNotificationService {

    private final InAppNotificationRepository repository;

    public InAppNotificationService(InAppNotificationRepository repository) {
        this.repository = repository;
    }

    public List<NotificationDto> listForUser(String userSub) {
        return repository.findByUserSubOrderByCreatedAtDesc(userSub).stream()
                .map(NotificationDto::from)
                .toList();
    }

    public boolean markRead(String userSub, UUID id) {
        return repository.findById(id)
                .filter(n -> n.getUserSub().equals(userSub))
                .map(n -> {
                    n.setRead(true);
                    repository.save(n);
                    return true;
                })
                .orElse(false);
    }

    public void markAllRead(String userSub) {
        List<InAppNotification> list = repository.findByUserSubOrderByCreatedAtDesc(userSub);
        list.forEach(n -> n.setRead(true));
        repository.saveAll(list);
    }
}
