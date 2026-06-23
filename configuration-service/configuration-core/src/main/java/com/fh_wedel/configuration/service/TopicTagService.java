package com.fh_wedel.configuration.service;

import com.fh_wedel.configuration.api.model.CreateTopicTagRequest;
import com.fh_wedel.configuration.api.model.TopicTagDto;
import com.fh_wedel.configuration.model.TopicTag;
import com.fh_wedel.configuration.repository.TopicTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TopicTagService {

    private final TopicTagRepository topicTagRepository;

    public List<TopicTagDto> getAllTags() {
        return topicTagRepository.findAll().stream()
                .sorted(Comparator.comparing(TopicTag::getTagName))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TopicTagDto addTag(CreateTopicTagRequest request) {
        String tagName = request.getTagName().trim();
        if (tagName.isEmpty()) {
            throw new IllegalArgumentException("Tag name cannot be empty");
        }

        if (topicTagRepository.findByTagName(tagName).isPresent()) {
            throw new IllegalArgumentException("Tag already exists: " + tagName);
        }

        TopicTag tag = TopicTag.builder()
                .pk(TopicTag.PK_VALUE)
                .sk(TopicTag.SK_PREFIX + tagName)
                .tagName(tagName)
                .createdAt(Instant.now())
                .build();

        topicTagRepository.save(tag);
        log.info("Created new topic tag: {}", tagName);
        return mapToDto(tag);
    }

    public void deleteTag(String tagName) {
        if (topicTagRepository.findByTagName(tagName).isEmpty()) {
            throw new IllegalArgumentException("Tag not found: " + tagName);
        }
        topicTagRepository.delete(tagName);
        log.info("Deleted topic tag: {}", tagName);
    }

    public void validateTag(String tagName) {
        if (tagName == null || tagName.trim().isEmpty()) {
            throw new IllegalArgumentException("Topic tag must be provided");
        }
        if (topicTagRepository.findByTagName(tagName).isEmpty()) {
            throw new IllegalArgumentException("Invalid topic tag: " + tagName + ". Not found in predefined list.");
        }
    }

    private TopicTagDto mapToDto(TopicTag tag) {
        TopicTagDto dto = new TopicTagDto();
        dto.setTagName(tag.getTagName());
        dto.setCreatedAt(tag.getCreatedAt() != null ? 
            OffsetDateTime.ofInstant(tag.getCreatedAt(), ZoneOffset.UTC) : null);
        return dto;
    }
}
