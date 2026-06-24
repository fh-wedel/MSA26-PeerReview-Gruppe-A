package com.fh_wedel.configuration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.repository.ConfigurationRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class ConfigurationServiceTest {

    @Mock
    private ConfigurationRepository repository;

    @Mock
    private PluginService pluginService;

    @Mock
    private SqsTemplate sqsTemplate;

    @Mock
    private TopicTagService topicTagService;

    @Test
    void sendsSubmissionCreatedNotificationToAuthor() throws Exception {
        ConfigurationService service = new ConfigurationService(
                repository,
                pluginService,
                topicTagService,
                sqsTemplate,
                new ObjectMapper(),
                "matching-request-queue",
                "notification-request-queue");

        // saveConfiguration does nothing in our mock (void method)
        doNothing().when(repository).saveConfiguration(any(), any());

        ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(ReviewTemplatePlugin.class);
        when(mockPlugin.getMinAuthors()).thenReturn(1);
        when(mockPlugin.getMaxAuthors()).thenReturn(5);
        when(mockPlugin.getMinReviewers()).thenReturn(1);
        when(mockPlugin.getMaxReviewers()).thenReturn(5);
        when(pluginService.getReviewTemplate("STANDARD")).thenReturn(Optional.of(mockPlugin));

        service.createConfiguration(
                "My Thesis",
                "DOUBLE_BLIND",
                "STANDARD",
                2,
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200),
                List.of("author-sub"),
                "creator-sub",
                "Author",
                "Java");

        // Verify: at least one send to the notification queue with expected content
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getValue())
                .contains("Submission Created")
                .contains("IN_APP")
                .contains("author-sub");
    }
}
