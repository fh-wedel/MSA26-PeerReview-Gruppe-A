package com.fh_wedel.response.controller;

import com.fh_wedel.response.model.SubmissionReadyEvent;
import com.fh_wedel.response.service.AiReviewOrchestrator;
import io.awspring.cloud.sqs.annotation.SqsListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "cloud.aws.sqs.enabled", havingValue = "true", matchIfMissing = true)
public class SqsSubmissionReadyListener {

    private static final Logger logger = LoggerFactory.getLogger(SqsSubmissionReadyListener.class);
    
    private final AiReviewOrchestrator aiReviewOrchestrator;

    public SqsSubmissionReadyListener(AiReviewOrchestrator aiReviewOrchestrator) {
        this.aiReviewOrchestrator = aiReviewOrchestrator;
    }

    @SqsListener("${aws.sqs.submission-ready.queue-name}")
    public void receiveMessage(SubmissionReadyEvent event) {
        logger.info("Received SubmissionReadyEvent for submissionId: {}", event.getSubmissionId());
        
        if (event.isRequestAiReview()) {
            try {
                logger.info("Submission {} requested AI review, triggering it.", event.getSubmissionId());
                aiReviewOrchestrator.requestReview(event.getSubmissionId());
            } catch (Exception e) {
                logger.error("Failed to automatically trigger AI Review for submission {}", event.getSubmissionId(), e);
            }
        }
    }
}
