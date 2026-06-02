package com.fh_wedel.matching.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.matching.model.events.MatchingRequestEvent;
import com.fh_wedel.matching.service.MatchingService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * SQS listener that receives matching requests from the Creation Service.
 * Deserializes the JSON payload into a {@link MatchingRequestEvent} and
 * delegates to the {@link MatchingService} for processing.
 */
@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsRequestListener {

    private final MatchingService matchingService;
    private final ObjectMapper objectMapper;

    public SqsRequestListener(MatchingService matchingService, ObjectMapper objectMapper) {
        this.matchingService = matchingService;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received matching request from SQS: {}", message);

        try {
            MatchingRequestEvent event = objectMapper.readValue(message, MatchingRequestEvent.class);

            log.info("Parsed matching request: submissionId={}, submitterId={}, numberOfExaminers={}",
                    event.getSubmissionId(), event.getSubmitterId(), event.getNumberOfExaminers());

            matchingService.processMatchingRequest(event);

        } catch (Exception e) {
            log.error("Failed to process matching request: {}", message, e);
            // In MVP, we don't have a DLQ — just log the error.
            // The message will be retried by SQS visibility timeout, then discarded.
        }
    }
}