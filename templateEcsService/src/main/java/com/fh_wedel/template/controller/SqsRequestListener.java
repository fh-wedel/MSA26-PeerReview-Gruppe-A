package com.fh_wedel.template.controller;

import com.fh_wedel.template.service.TemplateService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsRequestListener {

    private final TemplateService templateService;

    public SqsRequestListener(TemplateService templateService) {
        this.templateService = templateService;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received message from SQS queue: {}", message);
        templateService.respondToSqsQueue("Hello from the Service");
    }
}