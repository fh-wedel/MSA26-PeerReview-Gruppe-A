package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.generated.SubmissionReviewsApi;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.model.api.ReviewQuestionDto;
import com.fh_wedel.configuration.service.ConfigurationService;
import com.fh_wedel.configuration.service.PluginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/configuration")
public class SubmissionReviewsController implements SubmissionReviewsApi {

    private final ConfigurationService configurationService;
    private final PluginService pluginService;

    public SubmissionReviewsController(ConfigurationService configurationService, PluginService pluginService) {
        this.configurationService = configurationService;
        this.pluginService = pluginService;
    }

    @Override
    public ResponseEntity<List<ReviewQuestionDto>> getFeedbackFormForSubmission(String submissionId) {
        SubmissionConfiguration config = configurationService.getConfiguration(submissionId);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }

        return pluginService.getReviewTemplate(config.getReviewTemplateType())
                .map(plugin -> {
                    List<ReviewQuestionDto> questions = plugin.getFeedbackFormTemplate().stream()
                            .map(q -> {
                                ReviewQuestionDto qDto = new ReviewQuestionDto();
                                qDto.setId(q.id());
                                qDto.setText(q.text());
                                qDto.setType(ReviewQuestionDto.TypeEnum.fromValue(q.type().name()));
                                qDto.setMaxPoints(q.maxPoints());
                                qDto.setRequired(q.required());
                                qDto.setOptions(q.options());
                                return qDto;
                            })
                            .toList();
                    return ResponseEntity.ok(questions);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
