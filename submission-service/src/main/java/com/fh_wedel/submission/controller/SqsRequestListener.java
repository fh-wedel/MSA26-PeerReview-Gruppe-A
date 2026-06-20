package com.fh_wedel.submission.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.submission.model.Submission;
import com.fh_wedel.submission.model.SubmissionConfiguration;
import com.fh_wedel.submission.model.SubmissionStatus;
import com.fh_wedel.submission.service.ConfigurationServiceClient;
import com.fh_wedel.submission.repository.SubmissionRepository;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@ConditionalOnExpression("!'${aws.sqs.request.queue-name:}'.isBlank()")
public class SqsRequestListener {

    private final SubmissionRepository repository;
    private final ObjectMapper objectMapper;
    private final ConfigurationServiceClient configurationServiceClient;

    public SqsRequestListener(SubmissionRepository repository,
                              ObjectMapper objectMapper,
                              ConfigurationServiceClient configurationServiceClient) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.configurationServiceClient = configurationServiceClient;
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

            if (!"MATCHED".equalsIgnoreCase(status)) {
                log.warn("Received event status '{}' for submission {}, but expected 'MATCHED'. Ignoring.", status, submissionId);
                return;
            }

            Submission submission = repository.findSubmissionById(submissionId);
            if (submission == null) {
                // Read authorIds array if present
                List<String> authorIds = new java.util.ArrayList<>();
                if (node.has("authorIds") && node.get("authorIds").isArray()) {
                    for (JsonNode authorNode : node.get("authorIds")) {
                        authorIds.add(authorNode.asText());
                    }
                }
                
                // Fallback to legacy single authorId property
                if (authorIds.isEmpty() && node.has("authorId")) {
                    String authorId = node.path("authorId").asText();
                    if (!authorId.isBlank()) {
                        authorIds.add(authorId);
                    }
                }

                if (authorIds.isEmpty()) {
                    log.info("Submission {} not found in database. authorIds not present in SQS message. Fetching configuration from configuration-service.", submissionId);
                    SubmissionConfiguration config = configurationServiceClient.getConfiguration(submissionId);
                    if (config != null) {
                        authorIds = config.getAuthorIds() != null ? config.getAuthorIds() : java.util.Collections.emptyList();
                        
                        submission = new Submission(submissionId, submissionId, authorIds);
                        submission.setStatus(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
                        repository.saveSubmission(submission);
                        log.info("Created new submission {} with status '{}' via configuration-service", submissionId, submission.getStatus());
                    } else {
                        log.error("Failed to retrieve configuration for submission {} from configuration-service", submissionId);
                    }
                } else {
                    log.info("Submission {} not found in database. Creating it using authorIds={} from SQS message.", submissionId, authorIds);
                    submission = new Submission(submissionId, submissionId, authorIds);
                    submission.setStatus(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
                    repository.saveSubmission(submission);
                    log.info("Created new submission {} with status '{}' and authorIds={} directly from SQS message", submissionId, submission.getStatus(), authorIds);
                }
            } else {
                log.info("Updating existing submission {} status from {} to '{}'", submissionId, submission.getStatus(), SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
                submission.setStatus(SubmissionStatus.WAITING_FOR_SUBMISSION.getDbValue());
                repository.saveSubmission(submission);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
        }
    }
}
