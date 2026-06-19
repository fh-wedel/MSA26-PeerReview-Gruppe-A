package com.fh_wedel.configuration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.model.AuthorMapping;
import com.fh_wedel.configuration.model.MatchingRequestEvent;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.repository.ConfigurationRepository;
import com.fh_wedel.workflow.client.ApiException;
import com.fh_wedel.workflow.client.api.WorkflowPluginsApi;
import com.fh_wedel.workflow.client.model.WorkflowPluginDto;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ConfigurationService {

    private final ConfigurationRepository repository;
    private final SqsTemplate sqsTemplate;
    private final ObjectMapper objectMapper;
    private final String matchingQueueName;
    private final WorkflowPluginsApi workflowPluginsApi;

    public ConfigurationService(ConfigurationRepository repository,
                                SqsTemplate sqsTemplate,
                                ObjectMapper objectMapper,
                                @Value("${aws.sqs.matching-request-queue-name}") String matchingQueueName,
                                WorkflowPluginsApi workflowPluginsApi) {
        this.repository = repository;
        this.sqsTemplate = sqsTemplate;
        this.objectMapper = objectMapper;
        this.matchingQueueName = matchingQueueName;
        this.workflowPluginsApi = workflowPluginsApi;
    }

    /**
     * Creates a new submission configuration, persists it in DynamoDB, and publishes
     * a MatchingRequestEvent to the matching-request SQS queue.
     */
    public SubmissionConfiguration createConfiguration(String title, String reviewProcessType,
                                                       List<String> authorIds, String creatorId, String creatorRole) throws ApiException {

        if (authorIds == null || authorIds.isEmpty()) {
            throw new IllegalArgumentException("At least one author must be specified.");
        }

        String submissionId = UUID.randomUUID().toString();
        log.info("Creating submission configuration: id={}, title={}, creatorId={}", submissionId, title, creatorId);

        // Fetch workflow plugin
        WorkflowPluginDto plugin = workflowPluginsApi.getPlugin(reviewProcessType);
        Duration subDur = Duration.parse(plugin.getSubmissionDeadlineDuration());
        Duration revDur = Duration.parse(plugin.getReviewDeadlineDuration());
        int examiners = plugin.getNumberOfReviewers();

        Instant now = Instant.now();
        Instant submissionDeadline = now.plus(subDur);
        Instant reviewDeadline = submissionDeadline.plus(revDur);

        // 1. Instantiate metadata record
        SubmissionConfiguration config = new SubmissionConfiguration(
                submissionId, title, reviewProcessType, authorIds, creatorId, creatorRole,
                examiners, submissionDeadline, reviewDeadline
        );

        // 2. Instantiate author mappings (one for each author ID for indexed query lookup)
        List<AuthorMapping> mappings = authorIds.stream()
                .map(authorId -> new AuthorMapping(submissionId, authorId))
                .toList();

        // 3. Persist to database
        repository.saveConfiguration(config, mappings);

        // 4. Publish SQS matching request event
        sendMatchingRequest(submissionId, authorIds.get(0), examiners);

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

    /**
     * Sends an SQS event to the Matching Service request queue.
     */
    private void sendMatchingRequest(String submissionId, String submitterId, int numberOfExaminers) {
        if (matchingQueueName == null || matchingQueueName.isBlank()) {
            log.warn("No Matching SQS request queue name defined. Skipping sending matching request event for submission {}", submissionId);
            return;
        }

        MatchingRequestEvent event = new MatchingRequestEvent(submissionId, submitterId, numberOfExaminers);

        try {
            String messageBody = objectMapper.writeValueAsString(event);
            sqsTemplate.send(matchingQueueName, messageBody);
            log.info("Sent MatchingRequestEvent to queue '{}' for submission {}", matchingQueueName, submissionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize MatchingRequestEvent for submission {}", submissionId, e);
        }
    }
}
