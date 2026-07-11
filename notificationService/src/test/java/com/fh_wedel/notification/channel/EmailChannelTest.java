package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.config.SecretsConfig;
import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class EmailChannelTest {

    private JavaMailSender mailSender;
    private SecretsConfig secretsConfig;
    private EmailChannel emailChannel;

    @BeforeEach
    void setUp() {
        mailSender = Mockito.mock(JavaMailSender.class);
        secretsConfig = Mockito.mock(SecretsConfig.class);
        emailChannel = new EmailChannel(mailSender, secretsConfig);
    }

    @Test
    void getChannelType() {
        assertEquals(ChannelType.EMAIL, emailChannel.getChannelType());
    }

    @Test
    void isEnabled() {
        when(secretsConfig.get("email.smtp.host")).thenReturn("smtp.example.com");
        assertTrue(emailChannel.isEnabled());

        when(secretsConfig.get("email.smtp.host")).thenReturn("");
        assertFalse(emailChannel.isEnabled());
    }

    @Test
    void send() {
        when(secretsConfig.get("email.from.address")).thenReturn("noreply@example.com");

        emailChannel.send("user@example.com", "Test Subject", "Test Body");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();
        assertEquals("user@example.com", Objects.requireNonNull(message.getTo())[0]);
        assertEquals("Test Subject", message.getSubject());
        assertEquals("Test Body", message.getText());
        assertEquals("noreply@example.com", message.getFrom());
    }
}
