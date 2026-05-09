package com.fh_wedel.template;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
@Slf4j
public class TemplateApplication {

	static void main(String[] args) {
		SpringApplication.run(TemplateApplication.class, args);
	}

	@Bean
	public CommandLineRunner startupRunner(@Value("${aws.sqs.request.queue-name}") String requestQueue,
                                         @Value("${aws.sqs.response.queue-name}") String responseQueue) {


		return args -> {
			log.info("==========================================");
			log.info("  Template Microservice has started!      ");
			log.info("  Ready to process requests and SQS msgs! ");
			log.info("==========================================");

      if(requestQueue.isBlank()){
          log.warn("No request Queue Active!");
      } else {
          log.info("Request Queue {} Active", requestQueue);
      }

      if (responseQueue.isBlank()){
          log.warn("No response Queue Active!");
      } else {
          log.info("Response Queue {} Active", responseQueue);
      }
		};
	}

}
