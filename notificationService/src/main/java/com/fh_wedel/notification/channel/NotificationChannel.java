package com.fh_wedel.notification.channel;

import com.fh_wedel.notification.model.ChannelType;

public interface NotificationChannel {

    ChannelType getChannelType();

    void send(String recipient, String subject, String body);

    boolean isEnabled();
}
