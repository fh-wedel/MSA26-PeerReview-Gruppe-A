package com.fh_wedel.notification.config;

import com.fh_wedel.notification.model.NotificationStatus;
import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

/**
 * Stores a {@link NotificationStatus} enum as its {@code name()} in a DynamoDB
 * String attribute. Doubles as the partition key of the {@code StatusIndex}
 * GSI, so the value must remain a plain string.
 */
public class NotificationStatusConverter implements AttributeConverter<NotificationStatus> {

    @Override
    public AttributeValue transformFrom(NotificationStatus input) {
        return AttributeValue.builder()
                .s(input == null ? null : input.name())
                .build();
    }

    @Override
    public NotificationStatus transformTo(AttributeValue input) {
        if (input == null || input.s() == null) {
            return null;
        }
        return NotificationStatus.valueOf(input.s());
    }

    @Override
    public EnhancedType<NotificationStatus> type() {
        return EnhancedType.of(NotificationStatus.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.S;
    }
}
