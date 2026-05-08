package com.fh_wedel.template;

import lombok.extern.slf4j.Slf4j;
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
	public CommandLineRunner startupRunner() {
		return args -> {
			log.info("==========================================");
			log.info("  Template Microservice has started!      ");
			log.info("  Ready to process requests and SQS msgs! ");
			log.info("==========================================");
		};
	}

}
