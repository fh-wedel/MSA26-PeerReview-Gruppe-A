package com.fh_wedel.configuration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.configuration.model.ReviewProcessType;
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

@ExtendWith(MockitoExtension.class)
class ConfigurationServiceTest {

    @Mock
    private ConfigurationRepository repository;

    @Mock
    private SqsTemplate sqsTemplate;

    @Test
    void sendsSubmissionCreatedNotificationToAuthor() throws Exception {
        ConfigurationService service = new ConfigurationService(
                repository,
                sqsTemplate,
                new ObjectMapper(),
                "matching-request-queue",
                "notification-request-queue");

        // saveConfiguration does nothing in our mock (void method)
        doNothing().when(repository).saveConfiguration(any(), any());

        service.createConfiguration(
                "My Thesis",
                ReviewProcessType.DOUBLE_BLIND,
                List.of("author-sub"),
                "creator-sub",
                "Author",
                2,
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200),
                List.of("Clarity", "Structure"),
                true);

        // Verify: at least one send to the notification queue with expected content
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(sqsTemplate).send(eq("notification-request-queue"), body.capture());
        assertThat(body.getValue())
                .contains("Submission Created")
                .contains("IN_APP")
                .contains("author-sub");
    }
}
