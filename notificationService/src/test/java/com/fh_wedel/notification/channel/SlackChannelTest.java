package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class SlackChannelTest {

    private SecretsConfig secretsConfig;
    private RestClient.Builder restClientBuilder;
    private RestClient restClient;
    private SlackChannel slackChannel;

    @BeforeEach
    void setUp() {
        secretsConfig = Mockito.mock(SecretsConfig.class);
        restClientBuilder = Mockito.mock(RestClient.Builder.class);
        restClient = Mockito.mock(RestClient.class, Mockito.RETURNS_DEEP_STUBS);
        when(restClientBuilder.build()).thenReturn(restClient);

        slackChannel = new SlackChannel(secretsConfig, restClientBuilder);
    }

    @Test
    void getChannelType() {
        assertEquals(ChannelType.SLACK, slackChannel.getChannelType());
    }

    @Test
    void isEnabled() {
        when(secretsConfig.get("slack.webhook.url")).thenReturn("http://slack.test");
        assertTrue(slackChannel.isEnabled());

        when(secretsConfig.get("slack.webhook.url")).thenReturn("");
        assertFalse(slackChannel.isEnabled());
    }

    @Test
    void send() {
        when(secretsConfig.get("slack.webhook.url")).thenReturn("http://slack.test");

        assertDoesNotThrow(() -> slackChannel.send("user", "Subject", "Body"));
        
        verify(restClient, times(1)).post();
    }
}
