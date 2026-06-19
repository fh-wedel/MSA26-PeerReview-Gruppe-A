package com.fh_wedel.communication.service;

import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.MatchEntry;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class MatchingServiceClient {

    private final MatchesApi matchesApi;

    public MatchingServiceClient(MatchesApi matchesApi) {
        this.matchesApi = matchesApi;
    }

    public SubmissionMatchResponse getSubmissionMatch(String submissionId) {
        try {
            log.info("Calling Matching Service to validate submission: {}", submissionId);
            return matchesApi.getMatchesBySubmission(submissionId);
        } catch (Exception e) {
            log.error("Failed to fetch submission match from Matching Service for {}: {}", submissionId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch submission match from Matching Service", e);
        }
    }
}
