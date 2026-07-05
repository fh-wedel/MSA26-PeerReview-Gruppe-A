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
                "Java",
                null);

        // Verify: at least one send to the notification queue with expected content
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getValue())
                .contains("Submission Created")
                .contains("IN_APP")
                .contains("author-sub");
    }

    @Test
    void createConfiguration_allowsCustomReviewersForTeacher() throws Exception {
        ConfigurationService service = new ConfigurationService(
                repository,
                pluginService,
                topicTagService,
                sqsTemplate,
                new ObjectMapper(),
                "matching-request-queue",
                "notification-request-queue");

        org.mockito.Mockito.doNothing().when(repository).saveConfiguration(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());

        com.fh_wedel.configuration.api.ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(com.fh_wedel.configuration.api.ReviewTemplatePlugin.class);
        org.mockito.Mockito.when(mockPlugin.getMinAuthors()).thenReturn(1);
        org.mockito.Mockito.when(mockPlugin.getMaxAuthors()).thenReturn(5);
        org.mockito.Mockito.when(mockPlugin.getMinReviewers()).thenReturn(1);
        org.mockito.Mockito.when(mockPlugin.getMaxReviewers()).thenReturn(5);
        org.mockito.Mockito.when(pluginService.getReviewTemplate("STANDARD")).thenReturn(java.util.Optional.of(mockPlugin));

        com.fh_wedel.configuration.model.SubmissionConfiguration config = service.createConfiguration(
                "My Thesis",
                "DOUBLE_BLIND",
                "STANDARD",
                2,
                java.time.Instant.now().plusSeconds(3600),
                java.time.Instant.now().plusSeconds(7200),
                java.util.List.of("author-sub"),
                "creator-sub",
                "Teacher",
                "Java",
                java.util.List.of("reviewer1"));

        org.assertj.core.api.Assertions.assertThat(config).isNotNull();
    }

    @Test
    void createConfiguration_deniesCustomReviewersForAuthorWhenNotAllowed() throws Exception {
        ConfigurationService service = new ConfigurationService(
                repository,
                pluginService,
                topicTagService,
                sqsTemplate,
                new ObjectMapper(),
                "matching-request-queue",
                "notification-request-queue");

        com.fh_wedel.configuration.api.ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(com.fh_wedel.configuration.api.ReviewTemplatePlugin.class);
        org.mockito.Mockito.when(mockPlugin.getMinAuthors()).thenReturn(1);
        org.mockito.Mockito.when(mockPlugin.getMaxAuthors()).thenReturn(5);
        org.mockito.Mockito.when(mockPlugin.isAllowAuthorCustomReviewer()).thenReturn(false);
        org.mockito.Mockito.when(pluginService.getReviewTemplate("STANDARD")).thenReturn(java.util.Optional.of(mockPlugin));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
            service.createConfiguration(
                    "My Thesis",
                    "DOUBLE_BLIND",
                    "STANDARD",
                    2,
                    java.time.Instant.now().plusSeconds(3600),
                    java.time.Instant.now().plusSeconds(7200),
                    java.util.List.of("author-sub"),
                    "creator-sub",
                    "Author",
                    "Java",
                    java.util.List.of("reviewer1"));
        }).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Authors are not allowed to specify custom reviewers");
    }

    @Test
    void createConfiguration_allowsCustomReviewersForAuthorWhenAllowed() throws Exception {
        ConfigurationService service = new ConfigurationService(
                repository,
                pluginService,
                topicTagService,
                sqsTemplate,
                new ObjectMapper(),
                "matching-request-queue",
                "notification-request-queue");

        org.mockito.Mockito.doNothing().when(repository).saveConfiguration(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());

        com.fh_wedel.configuration.api.ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(com.fh_wedel.configuration.api.ReviewTemplatePlugin.class);
        org.mockito.Mockito.when(mockPlugin.getMinAuthors()).thenReturn(1);
        org.mockito.Mockito.when(mockPlugin.getMaxAuthors()).thenReturn(5);
        org.mockito.Mockito.when(mockPlugin.getMinReviewers()).thenReturn(1);
        org.mockito.Mockito.when(mockPlugin.getMaxReviewers()).thenReturn(5);
        org.mockito.Mockito.when(mockPlugin.isAllowAuthorCustomReviewer()).thenReturn(true);
        org.mockito.Mockito.when(pluginService.getReviewTemplate("STANDARD")).thenReturn(java.util.Optional.of(mockPlugin));

        com.fh_wedel.configuration.model.SubmissionConfiguration config = service.createConfiguration(
                "My Thesis",
                "DOUBLE_BLIND",
                "STANDARD",
                2,
                java.time.Instant.now().plusSeconds(3600),
                java.time.Instant.now().plusSeconds(7200),
                java.util.List.of("author-sub"),
                "creator-sub",
                "Author",
                "Java",
                java.util.List.of("reviewer1"));

        org.assertj.core.api.Assertions.assertThat(config).isNotNull();
    }

    @Test
    void getConfiguration_returnsConfig() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        com.fh_wedel.configuration.model.SubmissionConfiguration config = new com.fh_wedel.configuration.model.SubmissionConfiguration();
        when(repository.findConfigurationById("sub1")).thenReturn(config);
        assertThat(service.getConfiguration("sub1")).isEqualTo(config);
    }

    @Test
    void getConfigurationsByAuthor_returnsList() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        List<com.fh_wedel.configuration.model.SubmissionConfiguration> list = List.of(new com.fh_wedel.configuration.model.SubmissionConfiguration());
        when(repository.findConfigurationsByAuthor("auth1")).thenReturn(list);
        assertThat(service.getConfigurationsByAuthor("auth1")).isEqualTo(list);
    }

    @Test
    void getAllConfigurations_returnsList() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        List<com.fh_wedel.configuration.model.SubmissionConfiguration> list = List.of(new com.fh_wedel.configuration.model.SubmissionConfiguration());
        when(repository.findAllConfigurations()).thenReturn(list);
        assertThat(service.getAllConfigurations()).isEqualTo(list);
    }

    @Test
    void getServiceStatus_returnsString() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        assertThat(service.getServiceStatus()).isNotNull();
    }

    @Test
    void createConfiguration_throwsIfAuthorIdsNull() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
            service.createConfiguration("Title", "DB", "STD", 2, Instant.now(), Instant.now(), null, "creator", "Author", "Tag", null);
        }).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("At least one author must be specified");
    }

    @Test
    void createConfiguration_throwsIfTemplateUnknown() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        when(pluginService.getReviewTemplate("UNKNOWN")).thenReturn(Optional.empty());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
            service.createConfiguration("Title", "DB", "UNKNOWN", 2, Instant.now(), Instant.now(), List.of("a"), "creator", "Author", "Tag", null);
        }).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Unknown review template type");
    }

    @Test
    void createConfiguration_skipsQueuesIfNull() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), null, "");
        doNothing().when(repository).saveConfiguration(any(), any());

        ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(ReviewTemplatePlugin.class);
        when(mockPlugin.getMinAuthors()).thenReturn(1);
        when(mockPlugin.getMaxAuthors()).thenReturn(5);
        when(mockPlugin.getMinReviewers()).thenReturn(1);
        when(mockPlugin.getMaxReviewers()).thenReturn(5);
        when(pluginService.getReviewTemplate("STANDARD")).thenReturn(Optional.of(mockPlugin));

        com.fh_wedel.configuration.model.SubmissionConfiguration config = service.createConfiguration(
                "My Thesis", "DOUBLE_BLIND", "STANDARD", 2, Instant.now(), Instant.now(), List.of("a"), "creator", "Teacher", "Tag", null);

        assertThat(config).isNotNull();
        org.mockito.Mockito.verifyNoInteractions(sqsTemplate);
    }

    @Test
    void createConfiguration_usesPluginDurations() {
        ConfigurationService service = new ConfigurationService(
                repository, pluginService, topicTagService, sqsTemplate, new ObjectMapper(), "matching", "notification");
        doNothing().when(repository).saveConfiguration(any(), any());

        ReviewTemplatePlugin mockPlugin = org.mockito.Mockito.mock(ReviewTemplatePlugin.class);
        when(mockPlugin.getMinAuthors()).thenReturn(1);
        when(mockPlugin.getMaxAuthors()).thenReturn(5);
        when(mockPlugin.getMinReviewers()).thenReturn(1);
        when(mockPlugin.getMaxReviewers()).thenReturn(5);
        when(mockPlugin.getSubmissionDurationDays()).thenReturn(10);
        when(mockPlugin.getReviewDurationDays()).thenReturn(20);
        when(pluginService.getReviewTemplate("STANDARD")).thenReturn(Optional.of(mockPlugin));

        com.fh_wedel.configuration.model.SubmissionConfiguration config = service.createConfiguration(
                "My Thesis", "DOUBLE_BLIND", "STANDARD", 2, Instant.now(), Instant.now(), List.of("a"), "creator", "Teacher", "Tag", null);

        assertThat(config.getSubmissionDeadline()).isAfter(Instant.now().plus(9, java.time.temporal.ChronoUnit.DAYS));
        assertThat(config.getReviewDeadline()).isAfter(config.getSubmissionDeadline().plus(19, java.time.temporal.ChronoUnit.DAYS));
    }
}
