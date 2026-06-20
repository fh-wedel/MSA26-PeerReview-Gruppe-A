package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.generated.SubmissionRulesApi;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.model.api.ReviewRulesDto;
import com.fh_wedel.configuration.service.ConfigurationService;
import com.fh_wedel.configuration.service.PluginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuration")
public class SubmissionRulesController implements SubmissionRulesApi {

    private final ConfigurationService configurationService;
    private final PluginService pluginService;

    public SubmissionRulesController(ConfigurationService configurationService, PluginService pluginService) {
        this.configurationService = configurationService;
        this.pluginService = pluginService;
    }

    @Override
    public ResponseEntity<ReviewRulesDto> getRulesForSubmission(String submissionId) {
        SubmissionConfiguration config = configurationService.getConfiguration(submissionId);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }

        return pluginService.getReviewType(config.getReviewProcessType())
                .map(plugin -> {
                    ReviewRulesDto rules = new ReviewRulesDto();
                    rules.setAuthorAnonymous(plugin.isAuthorAnonymous());
                    rules.setReviewerAnonymous(plugin.isReviewerAnonymous());
                    rules.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());
                    return ResponseEntity.ok(rules);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
