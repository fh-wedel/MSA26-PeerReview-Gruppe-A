package com.fh_wedel.workflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WorkflowApplication {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WorkflowApplication.class);


    public static void main(String[] args) {
        SpringApplication.run(WorkflowApplication.class, args);
    }
}
