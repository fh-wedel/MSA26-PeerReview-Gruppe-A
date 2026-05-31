package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.service.MatchingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matching")
@Slf4j
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping("/status")
    public String getStatus() {
        log.info("Request received for Status endpoint");
        return matchingService.getServiceStatus();
    }

    @GetMapping("/time")
    public String getCurrentTime(
            @RequestHeader(value = "x-auth-username", required = false) String username,
            @RequestHeader(value = "x-auth-groups", required = false) String groups) {
        log.info("Request received for Time endpoint");
        return matchingService.getCurrentTimeWithIdentity(username, groups);
    }
}
