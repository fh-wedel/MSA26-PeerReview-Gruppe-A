package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.generated.ReviewTypesApi;
import com.fh_wedel.configuration.model.api.ReviewRulesDto;
import com.fh_wedel.configuration.model.api.ReviewTypeDto;
import com.fh_wedel.configuration.service.PluginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ReviewTypesController implements ReviewTypesApi {

    private final PluginService pluginService;

    public ReviewTypesController(PluginService pluginService) {
        this.pluginService = pluginService;
    }

    @Override
    public ResponseEntity<ReviewTypeDto> getReviewType(String typeName) {
        return pluginService.getReviewType(typeName)
                .map(plugin -> {
                    ReviewRulesDto rules = new ReviewRulesDto();
                    rules.setAuthorAnonymous(plugin.isAuthorAnonymous());
                    rules.setReviewerAnonymous(plugin.isReviewerAnonymous());
                    rules.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());

                    ReviewTypeDto dto = new ReviewTypeDto();
                    dto.setName(plugin.getName());
                    dto.setTitle(plugin.getTitle());
                    dto.setDescription(plugin.getDescription());
                    dto.setRules(rules);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<ReviewRulesDto> getReviewTypeRules(String typeName) {
        return pluginService.getReviewType(typeName)
                .map(plugin -> {
                    ReviewRulesDto rules = new ReviewRulesDto();
                    rules.setAuthorAnonymous(plugin.isAuthorAnonymous());
                    rules.setReviewerAnonymous(plugin.isReviewerAnonymous());
                    rules.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());
                    return ResponseEntity.ok(rules);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Override
    public ResponseEntity<List<ReviewTypeDto>> listReviewTypes() {
        List<ReviewTypeDto> dtos = pluginService.getReviewTypes().stream()
                .map(plugin -> {
                    ReviewRulesDto rules = new ReviewRulesDto();
                    rules.setAuthorAnonymous(plugin.isAuthorAnonymous());
                    rules.setReviewerAnonymous(plugin.isReviewerAnonymous());
                    rules.setAuthorReviewerChatAllowed(plugin.isAuthorReviewerChatAllowed());

                    ReviewTypeDto dto = new ReviewTypeDto();
                    dto.setName(plugin.getName());
                    dto.setTitle(plugin.getTitle());
                    dto.setDescription(plugin.getDescription());
                    dto.setRules(rules);
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
