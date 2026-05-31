package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.service.MatchingService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsRequestListener {

    private final MatchingService matchingService;

    public SqsRequestListener(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received message from SQS queue: {}", message);
        matchingService.respondToSqsQueue("Hello from the Service");
    }
}