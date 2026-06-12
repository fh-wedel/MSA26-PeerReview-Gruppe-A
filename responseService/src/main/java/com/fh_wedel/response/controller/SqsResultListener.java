package com.fh_wedel.response.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.response.model.ReviewCompletedEvent;
import com.fh_wedel.response.model.ReviewResult;
import com.fh_wedel.response.service.ResultService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("!'${aws.sqs.request.queue-name}'.isBlank()")
@Slf4j
public class SqsResultListener {

    private final ResultService resultService;
    private final ObjectMapper objectMapper;

    public SqsResultListener(ResultService resultService, ObjectMapper objectMapper) {
        this.resultService = resultService;
        this.objectMapper = objectMapper;
    }

    @SqsListener("${aws.sqs.request.queue-name}")
    public void receiveMessage(String message) {
        log.info("Received review completed event from SQS");
        try {
            ReviewCompletedEvent event = objectMapper.readValue(message, ReviewCompletedEvent.class);

            var result = ReviewResult.builder()
                    .submissionId(event.submissionId())
                    .reviewerId(event.reviewerId())
                    .authorId(event.authorId())
                    .finalGrade(event.finalGrade())
                    .reviewComments(event.reviewComments())
                    .documentS3Key(event.documentS3Key())
                    .completedAt(event.completedAt())
                    .build();

            resultService.save(result);
            log.info("Stored review result for submission: {}", event.submissionId());
        } catch (Exception e) {
            log.error("Failed to process review completed event: {}", e.getMessage(), e);
        }
    }
}
