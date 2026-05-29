package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.service.SubmissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/submission")
@Slf4j
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/status")
    public String getStatus() {
        log.info("Request received for Status endpoint");
        return submissionService.getServiceStatus();
    }

    @GetMapping("/time")
    public String getCurrentTime(
            @RequestHeader(value = "x-auth-username", required = false) String username,
            @RequestHeader(value = "x-auth-groups", required = false) String groups) {
        log.info("Request received for Time endpoint");
        return submissionService.getCurrentTimeWithIdentity(username, groups);
    }
}
