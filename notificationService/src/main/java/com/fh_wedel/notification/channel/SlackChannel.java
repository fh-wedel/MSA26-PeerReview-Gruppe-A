package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@Slf4j
public class SlackChannel implements NotificationChannel {

    private final SecretsConfig secretsConfig;
    private final RestClient restClient;

    public SlackChannel(SecretsConfig secretsConfig) {
        this.secretsConfig = secretsConfig;
        this.restClient = RestClient.create();
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.SLACK;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        String webhookUrl = secretsConfig.get("slack.webhook.url");
        String text = "*" + subject + "*\n" + body;

        restClient.post()
                .uri(webhookUrl)
                .body(Map.of("text", text))
                .retrieve()
                .toBodilessEntity();

        log.info("Slack notification sent: {}", subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("slack.webhook.url").isBlank();
    }
}
