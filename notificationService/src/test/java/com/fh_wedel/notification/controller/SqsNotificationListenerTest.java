package com.fh_wedel.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fh_wedel.notification.model.ChannelType;
import com.fh_wedel.notification.model.NotificationRequest;
import com.fh_wedel.notification.service.NotificationDispatcher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SqsNotificationListenerTest {

    @Mock
    private NotificationDispatcher dispatcher;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SqsNotificationListener listener;

    @Test
    void shouldParseEventAndDispatch() {
        when(dispatcher.dispatch(any())).thenReturn(List.of(UUID.randomUUID()));

        String json = """
                {
                    "eventType": "REVIEW_COMPLETED",
                    "channels": ["DISCORD", "EMAIL"],
                    "recipientUserId": "author-123",
                    "subject": "Review Complete",
                    "body": "Your submission has been reviewed.",
                    "metadata": {"submissionId": "sub-456"}
                }
                """;

        listener.receiveMessage(json);

        ArgumentCaptor<NotificationRequest> captor = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(dispatcher).dispatch(captor.capture());

        NotificationRequest request = captor.getValue();
        assertThat(request.channels()).containsExactly(ChannelType.DISCORD, ChannelType.EMAIL);
        assertThat(request.recipients()).containsExactly("author-123");
        assertThat(request.subject()).isEqualTo("Review Complete");
    }
}
