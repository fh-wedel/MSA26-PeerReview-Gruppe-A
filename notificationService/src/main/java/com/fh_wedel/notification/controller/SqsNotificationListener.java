package com.fh_wedel.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.notification.model.NotificationEvent;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.service.NotificationDispatcher;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsNotificationListener {

    private final NotificationDispatcher dispatcher;
    private final ObjectMapper objectMapper;

    public SqsNotificationListener(NotificationDispatcher dispatcher, ObjectMapper objectMapper) {
        this.dispatcher = dispatcher;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received notification event from SQS");
        try {
            NotificationEvent event = objectMapper.readValue(message, NotificationEvent.class);
            var request = new NotificationRequest(
                    event.channels(),
                    List.of(event.recipientUserId()),
                    event.subject(),
                    event.body()
            );
            dispatcher.dispatch(request);
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", e.getMessage(), e);
        }
    }
}
