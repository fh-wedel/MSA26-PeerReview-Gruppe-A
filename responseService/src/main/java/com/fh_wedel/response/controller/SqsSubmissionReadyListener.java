package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.SubmissionReadyEvent;
import io.awspring.cloud.sqs.annotation.SqsListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "cloud.aws.sqs.enabled", havingValue = "true", matchIfMissing = true)
public class SqsSubmissionReadyListener {

    private static final Logger logger = LoggerFactory.getLogger(SqsSubmissionReadyListener.class);

    @SqsListener("${aws.sqs.submission-ready.queue-name}")
    public void receiveMessage(SubmissionReadyEvent event) {
        logger.info("Received SubmissionReadyEvent for submissionId: {}", event.getSubmissionId());
        // Currently just logging as requested
    }
}
