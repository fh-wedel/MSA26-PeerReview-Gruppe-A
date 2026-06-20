package com.fh_wedel.configuration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.model.AuthorMapping;
import com.fh_wedel.configuration.model.MatchingRequestEvent;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.repository.ConfigurationRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fh_wedel.configuration.model.NotificationEvent;

@Service
@Slf4j
public class ConfigurationService {

    private final ConfigurationRepository repository;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String matchingQueueName;
    private final String notificationQueueName;

    public ConfigurationService(ConfigurationRepository repository,
                                SqsTemplate sqsTemplate,
                                ObjectMapper objectMapper,
                                @Value("${aws.sqs.matching-request-queue-name}") String matchingQueueName,
                                @Value("${aws.sqs.notification-queue-name}") String notificationQueueName) {
        this.repository = repository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.matchingQueueName = matchingQueueName;
        this.notificationQueueName = notificationQueueName;
    }

    /**
     * Creates a new submission configuration, persists it in DynamoDB, and publishes
     * a MatchingRequestEvent to the matching-request SQS queue.
     */
    public SubmissionConfiguration createConfiguration(String title, String reviewProcessType,
                                                       String reviewTemplateType, int numberOfExaminers,
                                                       Instant submissionDeadline, Instant reviewDeadline,
                                                       List<String> authorIds, String creatorId, String creatorRole) {

        if (authorIds == null || authorIds.isEmpty()) {
            throw new IllegalArgumentException("At least one author must be specified.");
        }

        String submissionId = UUID.randomUUID().toString();
        log.info("Creating submission configuration: id={}, title={}, creatorId={}", submissionId, title, creatorId);



        // 1. Instantiate metadata record
        SubmissionConfiguration config = new SubmissionConfiguration(
                submissionId, title, reviewProcessType, reviewTemplateType, authorIds, creatorId, creatorRole,
                numberOfExaminers, submissionDeadline, reviewDeadline
        );

        // 2. Instantiate author mappings (one for each author ID for indexed query lookup)
        List<AuthorMapping> mappings = authorIds.stream()
                .map(authorId -> new AuthorMapping(submissionId, authorId))
                .toList();

        // 3. Persist to database
        repository.saveConfiguration(config, mappings);

        // Notify the author that their submission was created.
        sendSubmissionCreatedNotification(submissionId, authorIds.get(0), title);

        // 4. Publish SQS matching request event
        sendMatchingRequest(submissionId, authorIds, numberOfExaminers);

        return config;
    }

    /**
     * Gets a configuration by submission ID.
     */
    public SubmissionConfiguration getConfiguration(String submissionId) {
        return repository.findConfigurationById(submissionId);
    }

    /**
     * Gets all configurations for a specific author.
     */
    public List<SubmissionConfiguration> getConfigurationsByAuthor(String authorId) {
        return repository.findConfigurationsByAuthor(authorId);
    }

    /**
     * Gets all configurations (for administrators/examination officers).
     */
    public List<SubmissionConfiguration> getAllConfigurations() {
        return repository.findAllConfigurations();
    }

    /**
     * Returns service status.
     */
    public String getServiceStatus() {
        return "Configuration Service is up and running!";
    }

    private void sendSubmissionCreatedNotification(String submissionId, String authorSub, String title) {
        if (notificationQueueName == null || notificationQueueName.isBlank()) {
            log.warn("No notification queue configured. Skipping submission-created notification for {}", submissionId);
            return;
        }
        NotificationEvent event = new NotificationEvent(
                "SUBMISSION_CREATED",
                List.of("IN_APP"),
                authorSub,
                "Submission Created",
                "Your submission '" + title + "' was submitted.",
                Map.of("submissionId", submissionId));
        try {
            sqsTemplate.send(notificationQueueName, objectMapper.writeValueAsString(event));
            log.info("Sent submission-created notification to '{}' for submission {}", authorSub, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize submission-created notification for {}", submissionId, e);
        }
    }

    /**
     * Sends an SQS event to the Matching Service request queue.
     */
    private void sendMatchingRequest(String submissionId, List<String> submitterIds, int numberOfExaminers) {
        if (matchingQueueName == null || matchingQueueName.isBlank()) {
            log.warn("No Matching SQS request queue name defined. Skipping sending matching request event for submission {}", submissionId);
            return;
        }

        MatchingRequestEvent event = new MatchingRequestEvent(submissionId, submitterIds, numberOfExaminers);

        try {
            String messageBody = objectMapper.writeValueAsString(event);
            sqsTemplate.send(matchingQueueName, messageBody);
            log.info("Sent MatchingRequestEvent to queue '{}' for submission {}", matchingQueueName, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize MatchingRequestEvent for submission {}", submissionId, e);
        }
    }
}
