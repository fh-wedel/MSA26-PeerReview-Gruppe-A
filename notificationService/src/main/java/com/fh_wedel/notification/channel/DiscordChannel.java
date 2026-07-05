package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@Slf4j
public class DiscordChannel implements NotificationChannel {

    private final SecretsConfig secretsConfig;
    private final RestClient restClient;

    public DiscordChannel(SecretsConfig secretsConfig) {
        this(secretsConfig, RestClient.create());
    }

    DiscordChannel(SecretsConfig secretsConfig, RestClient restClient) {
        this.secretsConfig = secretsConfig;
        this.restClient = restClient;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.DISCORD;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        String webhookUrl = secretsConfig.get("discord.webhook.url");
        String content = "**" + subject + "**\n" + body;

        restClient.post()
                .uri(webhookUrl)
                .body(Map.of("content", content))
                .retrieve()
                .toBodilessEntity();

        log.info("Discord notification sent: {}", subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("discord.webhook.url").isBlank();
    }
}
