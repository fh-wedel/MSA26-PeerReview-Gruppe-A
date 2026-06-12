package com.fh_wedel.communication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CommunicationApplication {

    private static final Logger log = LoggerFactory.getLogger(CommunicationApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(CommunicationApplication.class, args);
        log.info("Communication Service started successfully.");
    }
}
