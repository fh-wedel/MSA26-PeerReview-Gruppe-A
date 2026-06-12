package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscordChannelTest {

    @Mock
    private SecretsConfig secretsConfig;

    @InjectMocks
    private DiscordChannel discordChannel;

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
}
