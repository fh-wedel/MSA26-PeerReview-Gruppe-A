package com.fh_wedel.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
public class ConfigurationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigurationApplication.class, args);
    }

    @Bean
    public CommandLineRunner startupRunner(
            @Value("${aws.sqs.matching-request-queue-name}") String matchingRequestQueue,
            @Value("${aws.dynamodb.table-name}") String dynamoTableName) {

        return args -> {
            log.info("==========================================");
            log.info("  Configuration Service has started!      ");
            log.info("==========================================");
            log.info("Matching SQS Queue: {}", matchingRequestQueue);
            log.info("DynamoDB Table: {}", dynamoTableName);
            log.info("==========================================");
        };
    }
}
