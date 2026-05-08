package com.fh_wedel.template.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.awspring.cloud.sqs.annotation.SqsListener;

@Service
@Slf4j
public class TemplateService {

    private final SqsTemplate sqsTemplate;
    private final String responseQueueName;

    public TemplateService(SqsTemplate sqsTemplate, @Value("${aws.sqs.response.queue-name}") String responseQueueName) {
        this.sqsTemplate = sqsTemplate;
        this.responseQueueName = responseQueueName;
    }

    public String getServiceStatus() {
        return "Template Service is up and running!";
    }


    public void respondToSqsQueue (String messageBody){
        log.info("Responding to Queue {} message {}", responseQueueName, messageBody);

        sqsTemplate.send(responseQueueName, messageBody);
    }

}
