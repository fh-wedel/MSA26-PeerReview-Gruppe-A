package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.service.SubmissionService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsRequestListener {

    private final SubmissionService submissionService;

    public SqsRequestListener(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received message from SQS queue: {}", message);
        submissionService.respondToSqsQueue("Hello from the Submission Service");
    }
}
