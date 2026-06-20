package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.generated.ReviewTemplatesApi;
import com.fh_wedel.configuration.model.api.ReviewQuestionDto;
import com.fh_wedel.configuration.model.api.ReviewTemplateDto;
import com.fh_wedel.configuration.service.PluginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/configuration")
public class ReviewTemplatesController implements ReviewTemplatesApi {

    private final PluginService pluginService;

    public ReviewTemplatesController(PluginService pluginService) {
        this.pluginService = pluginService;
    }

    @Override
    public ResponseEntity<ReviewTemplateDto> getReviewTemplate(String templateName) {
        return pluginService.getReviewTemplate(templateName)
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

                    ReviewTemplateDto dto = new ReviewTemplateDto();
                    dto.setName(plugin.getName());
                    dto.setTitle(plugin.getTitle());
                    dto.setDescription(plugin.getDescription());
                    dto.setEvaluationCriteriaVisibleToAuthors(plugin.isEvaluationCriteriaVisibleToAuthors());
                    dto.setFeedbackFormTemplate(questions);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<List<ReviewTemplateDto>> listReviewTemplates() {
        List<ReviewTemplateDto> dtos = pluginService.getReviewTemplates().stream()
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

                    ReviewTemplateDto dto = new ReviewTemplateDto();
                    dto.setName(plugin.getName());
                    dto.setTitle(plugin.getTitle());
                    dto.setDescription(plugin.getDescription());
                    dto.setEvaluationCriteriaVisibleToAuthors(plugin.isEvaluationCriteriaVisibleToAuthors());
                    dto.setFeedbackFormTemplate(questions);
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
