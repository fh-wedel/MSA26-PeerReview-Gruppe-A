package com.fh_wedel.notification.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record NotificationRequest(
        @NotEmpty List<ChannelType> channels,
        @NotEmpty List<String> recipients,
        @NotBlank String subject,
        @NotBlank String body
) {}
