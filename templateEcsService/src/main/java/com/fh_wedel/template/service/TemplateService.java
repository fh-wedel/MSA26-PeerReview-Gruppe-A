package com.fh_wedel.template.service;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


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
        if(responseQueueName == null || responseQueueName.isBlank()){
            log.error("No SQS response queue defined. Skipping sending Message {}", messageBody);
            return;
        }
        log.info("Responding to Queue {} message {}", responseQueueName, messageBody);

        sqsTemplate.send(responseQueueName, messageBody);
    }

}
