package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailChannel implements NotificationChannel {

    private final JavaMailSender mailSender;
    private final SecretsConfig secretsConfig;

    public EmailChannel(JavaMailSender mailSender, SecretsConfig secretsConfig) {
        this.mailSender = mailSender;
        this.secretsConfig = secretsConfig;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.EMAIL;
    }

    @Override
    public void send(String recipient, String subject, String body) {
        var message = new SimpleMailMessage();
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(secretsConfig.get("email.from.address"));

        mailSender.send(message);
        log.info("Email sent to {}: {}", recipient, subject);
    }

    @Override
    public boolean isEnabled() {
        return !secretsConfig.get("email.smtp.host").isBlank();
    }
}
