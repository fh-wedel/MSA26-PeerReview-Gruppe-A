package com.fh_wedel.submission.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
@Slf4j
public class SubmissionService {

    private final SqsTemplate sqsTemplate;
    private final String responseQueueName;

    public SubmissionService(SqsTemplate sqsTemplate, @Value("${aws.sqs.response.queue-name}") String responseQueueName) {
        this.sqsTemplate = sqsTemplate;
        this.responseQueueName = responseQueueName;
    }

    public String getServiceStatus() {
        return "Submission Service is up and running!";
    }

    public String getCurrentTime() {
        return Instant.now().toString();
    }

    public String getCurrentTimeWithIdentity(String username, String groups) {
        String resolvedUsername = (username == null || username.isBlank()) ? "unknown" : username;
        String resolvedGroups = (groups == null || groups.isBlank()) ? "unknown" : groups;
        return String.format(
                "time=%s, username=%s, groups=%s",
                getCurrentTime(),
                resolvedUsername,
                resolvedGroups);
    }

    public void respondToSqsQueue(String messageBody) {
        if (responseQueueName == null || responseQueueName.isBlank()) {
            log.error("No SQS response queue defined. Skipping sending Message {}", messageBody);
            return;
        }
        log.info("Responding to Queue {} message {}", responseQueueName, messageBody);

        sqsTemplate.send(responseQueueName, messageBody);
    }

}
