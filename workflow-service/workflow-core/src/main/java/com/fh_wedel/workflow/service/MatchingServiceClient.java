package com.fh_wedel.workflow.service;

import com.fh_wedel.matching.client.api.MatchesApi;
import com.fh_wedel.matching.client.model.MatchEntry;
import com.fh_wedel.matching.client.model.SubmissionMatchResponse;
import com.fh_wedel.workflow.exception.DownstreamServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingServiceClient {

    private final MatchesApi matchesApi;

    public List<String> getMatchedReviewers(String submissionId) {
        try {
            log.info("Fetching matched reviewers for submission: {}", submissionId);
            SubmissionMatchResponse response = matchesApi.getMatchesBySubmission(submissionId);

            if (response != null && response.getMatches() != null) {
                return response.getMatches().stream()
                        .map(MatchEntry::getExaminerId)
                        .toList();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Failed to fetch matched reviewers for submission: {}", submissionId, e);
            throw new DownstreamServiceException("Could not communicate with matching service: " + e.getMessage(), e);
        }
    }
}
