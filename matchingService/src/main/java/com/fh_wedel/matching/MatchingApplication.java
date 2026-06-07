package com.fh_wedel.matching;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
public class MatchingApplication {

	public static void main(String[] args) {
		SpringApplication.run(MatchingApplication.class, args);
	}

	@Bean
	public CommandLineRunner startupRunner(
			@Value("${aws.sqs.request.queue-name}") String requestQueue,
			@Value("${aws.sqs.response.queue-name}") String responseQueue,
			@Value("${aws.cognito.user-pool-id}") String userPoolId,
			@Value("${aws.cognito.reviewer-group-name}") String reviewerGroup,
			@Value("${aws.dynamodb.table-name}") String dynamoTableName) {

		return args -> {
			log.info("==========================================");
			log.info("  Matching Service has started!           ");
			log.info("==========================================");

			if (requestQueue.isBlank()) {
				log.warn("No request Queue Active!");
			} else {
				log.info("Request Queue: {}", requestQueue);
			}

			if (responseQueue.isBlank()) {
				log.warn("No response Queue Active!");
			} else {
				log.info("Response Queue: {}", responseQueue);
			}

			if (userPoolId.isBlank()) {
				log.warn("No Cognito User Pool ID configured!");
			} else {
				log.info("Cognito User Pool: {} (group: {})", userPoolId, reviewerGroup);
			}

			log.info("DynamoDB Table: {}", dynamoTableName);
			log.info("==========================================");
		};
	}

}
