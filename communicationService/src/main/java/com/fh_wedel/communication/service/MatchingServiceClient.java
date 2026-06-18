package com.fh_wedel.communication.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;

@Service
public class MatchingServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MatchingServiceClient.class);
    private final RestClient restClient;

    public MatchingServiceClient(@Value("${aws.matching-service.url:http://matching.internal.services:8081}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public static class MatchEntry {
        public String examinerId;
        public String examinerUsername;
        public String assignedAt;
    }

    public static class SubmissionMatchDto {
        public String submissionId;
        public String status;
        public String submitterId;
        public String submitterUsername;
        public List<MatchEntry> matches;
    }

    public SubmissionMatchDto getSubmissionMatch(String submissionId, String authHeader) {
        log.info("Calling Matching Service to validate submission: {}", submissionId);
        try {
            return restClient.get()
                    .uri("/api/matching/matches/submissions/{submissionId}", submissionId)
                    .header("Authorization", authHeader)
                    .retrieve()
                    .body(SubmissionMatchDto.class);
        } catch (Exception e) {
            log.error("Failed to fetch submission match from Matching Service for {}: {}", submissionId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to validate submission match: " + e.getMessage());
        }
    }
}
