package com.fh_wedel.submission.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.submission.model.Submission;
import com.fh_wedel.submission.repository.SubmissionRepository;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@ConditionalOnExpression("!'${aws.sqs.request.queue-name:}'.isBlank()")
public class SqsRequestListener {

    private final SubmissionRepository repository;
    private final ObjectMapper objectMapper;

    public SqsRequestListener(SubmissionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void handleMessage(String message) {
        log.info("Received SQS message: {}", message);

        try {
            JsonNode node = objectMapper.readTree(message);
            String submissionId = node.path("submissionId").asText();
            String status = node.path("status").asText();

            if (submissionId.isBlank()) {
                log.warn("Received message without submissionId, ignoring");
                return;
            }

            Submission submission = repository.findSubmissionById(submissionId);
            if (submission != null) {
                log.info("Updating submission {} status based on event: {}", submissionId, status);
            } else {
                log.warn("Received event for unknown submission {}", submissionId);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
        }
    }
}
