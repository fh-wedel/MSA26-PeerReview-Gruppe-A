package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.api.generated.TopicTagsApi;
import com.fh_wedel.configuration.model.api.CreateTopicTagRequest;
import com.fh_wedel.configuration.model.api.TopicTagDto;
import com.fh_wedel.configuration.service.TopicTagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/configuration")
@RequiredArgsConstructor
@Slf4j
public class TopicTagController implements TopicTagsApi {

    private final TopicTagService topicTagService;

    @Override
    public ResponseEntity<List<TopicTagDto>> listTopicTags() {
        return ResponseEntity.ok(topicTagService.getAllTags());
    }

    @Override
    public ResponseEntity<TopicTagDto> addTopicTag(CreateTopicTagRequest createTopicTagRequest) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (!isAdminOrOfficer(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            TopicTagDto dto = topicTagService.addTag(createTopicTagRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to add tag: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @Override
    public ResponseEntity<Void> deleteTopicTag(String tagName) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (!isAdminOrOfficer(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            topicTagService.deleteTag(tagName);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete tag: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isAdminOrOfficer(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_Admin") || role.equals("ROLE_ExaminationOffice"));
    }
}
