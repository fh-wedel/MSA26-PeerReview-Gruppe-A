package com.fh_wedel.submission;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
public class SubmissionApplication {

	public static void main(String[] args) {
		SpringApplication.run(SubmissionApplication.class, args);
	}

	@Bean
	public CommandLineRunner startupRunner(@Value("${aws.sqs.request.queue-name}") String requestQueue,
			@Value("${aws.sqs.response.queue-name}") String responseQueue) {

		return args -> {
			log.info("==========================================");
			log.info("  Submission Microservice has started!    ");
			log.info("  Ready to process requests and SQS msgs! ");
			log.info("==========================================");

			if (requestQueue.isBlank()) {
				log.warn("No request Queue Active!");
			} else {
				log.info("Request Queue {} Active", requestQueue);
			}

			if (responseQueue.isBlank()) {
				log.warn("No response Queue Active!");
			} else {
				log.info("Response Queue {} Active", responseQueue);
			}
		};
	}

	@Bean
	public software.amazon.awssdk.services.s3.presigner.S3Presigner s3Presigner() {
		return software.amazon.awssdk.services.s3.presigner.S3Presigner.builder().build();
	}

}
