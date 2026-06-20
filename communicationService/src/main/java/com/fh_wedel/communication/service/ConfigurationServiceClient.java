package com.fh_wedel.communication.service;

import com.fh_wedel.configuration.client.api.SubmissionRulesApi;
import com.fh_wedel.configuration.client.model.ReviewRulesDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class ConfigurationServiceClient {

    private final SubmissionRulesApi configurationRulesApi;

    public ConfigurationServiceClient(SubmissionRulesApi configurationRulesApi) {
        this.configurationRulesApi = configurationRulesApi;
    }

    public ReviewRulesDto getSubmissionRules(String submissionId) {
        log.info("Calling Configuration Service to get rules for submission: {}", submissionId);
        try {
            return configurationRulesApi.getRulesForSubmission(submissionId);
        } catch (Exception e) {
            log.error("Failed to fetch configuration rules for {}: {}", submissionId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to fetch configuration rules: " + e.getMessage());
        }
    }
}
