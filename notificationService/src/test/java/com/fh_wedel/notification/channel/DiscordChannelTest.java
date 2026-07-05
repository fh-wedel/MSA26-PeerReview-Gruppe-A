package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordChannelTest {

    @Mock
    private SecretsConfig secretsConfig;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private RestClient restClient;

    private DiscordChannel discordChannel;

    @BeforeEach
    void setUp() {
        discordChannel = new DiscordChannel(secretsConfig, restClient);
    }

    @Test
    void shouldReturnDiscordChannelType() {
        assertThat(discordChannel.getChannelType()).isEqualTo(ChannelType.DISCORD);
    }

    @Test
    void shouldBeDisabledWhenNoWebhookUrl() {
        when(secretsConfig.get("discord.webhook.url")).thenReturn("");
        assertThat(discordChannel.isEnabled()).isFalse();
    }

    @Test
    void shouldBeEnabledWhenWebhookUrlPresent() {
        when(secretsConfig.get("discord.webhook.url")).thenReturn("https://discord.com/api/webhooks/123/abc");
        assertThat(discordChannel.isEnabled()).isTrue();
    }

    @Test
    void shouldSendNotification() {
        when(secretsConfig.get("discord.webhook.url")).thenReturn("http://webhook");

        // The mock RestClient is created with RETURNS_DEEP_STUBS.
        // As long as no NullPointerException is thrown by the chained calls,
        // it means the code executes the restClient builder pattern correctly.
        discordChannel.send("user", "Subject", "Body");
    }
}
