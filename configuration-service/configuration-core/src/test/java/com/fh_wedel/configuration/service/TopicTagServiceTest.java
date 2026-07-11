package com.fh_wedel.configuration.service;

import com.fh_wedel.configuration.model.TopicTag;
import com.fh_wedel.configuration.model.api.CreateTopicTagRequest;
import com.fh_wedel.configuration.model.api.TopicTagDto;
import com.fh_wedel.configuration.repository.TopicTagRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicTagServiceTest {

    @Mock
    private TopicTagRepository topicTagRepository;

    @Mock
    private SqsTemplate sqsTemplate;

    @InjectMocks
    private TopicTagService topicTagService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(topicTagService, "cacheInvalidationQueueName", "queue");
    }

    @Test
    void testGetAllTags() {
        TopicTag tag1 = TopicTag.builder().tagName("B").createdAt(Instant.now()).build();
        TopicTag tag2 = TopicTag.builder().tagName("A").createdAt(Instant.now()).build();
        when(topicTagRepository.findAll()).thenReturn(List.of(tag1, tag2));

        List<TopicTagDto> dtos = topicTagService.getAllTags();
        assertEquals(2, dtos.size());
        assertEquals("A", dtos.get(0).getTagName());
        assertEquals("B", dtos.get(1).getTagName());
    }

    @Test
    void testAddTag_Success() {
        CreateTopicTagRequest req = new CreateTopicTagRequest();
        req.setTagName("NewTag");

        when(topicTagRepository.findByTagName("NewTag")).thenReturn(Optional.empty());

        TopicTagDto result = topicTagService.addTag(req);
        assertNotNull(result);
        assertEquals("NewTag", result.getTagName());
        verify(topicTagRepository).save(any(TopicTag.class));
        verify(sqsTemplate).send(eq("queue"), anyString());
    }

    @Test
    void testAddTag_EmptyName() {
        CreateTopicTagRequest req = new CreateTopicTagRequest();
        req.setTagName("   ");

        assertThrows(IllegalArgumentException.class, () -> topicTagService.addTag(req));
    }

    @Test
    void testAddTag_AlreadyExists() {
        CreateTopicTagRequest req = new CreateTopicTagRequest();
        req.setTagName("ExistingTag");

        when(topicTagRepository.findByTagName("ExistingTag")).thenReturn(Optional.of(TopicTag.builder().build()));

        assertThrows(IllegalArgumentException.class, () -> topicTagService.addTag(req));
    }

    @Test
    void testDeleteTag_Success() {
        when(topicTagRepository.findByTagName("Tag")).thenReturn(Optional.of(TopicTag.builder().build()));

        topicTagService.deleteTag("Tag");

        verify(topicTagRepository).delete("Tag");
        verify(sqsTemplate).send(eq("queue"), anyString());
    }

    @Test
    void testDeleteTag_NotFound() {
        when(topicTagRepository.findByTagName("Tag")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> topicTagService.deleteTag("Tag"));
    }

    @Test
    void testValidateTag_Success() {
        when(topicTagRepository.findByTagName("Tag")).thenReturn(Optional.of(TopicTag.builder().build()));

        assertDoesNotThrow(() -> topicTagService.validateTag("Tag"));
    }

    @Test
    void testValidateTag_NullOrEmpty() {
        assertThrows(IllegalArgumentException.class, () -> topicTagService.validateTag(null));
        assertThrows(IllegalArgumentException.class, () -> topicTagService.validateTag("   "));
    }

    @Test
    void testValidateTag_NotFound() {
        when(topicTagRepository.findByTagName("Tag")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> topicTagService.validateTag("Tag"));
    }
}
