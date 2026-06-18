package com.fh_wedel.notification.config;

import com.fh_wedel.notification.model.ChannelType;
import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

/**
 * Stores a {@link ChannelType} enum as its {@code name()} in a DynamoDB String
 * attribute. Avoids relying on implicit enum mapping in the Enhanced Client.
 */
public class ChannelTypeConverter implements AttributeConverter<ChannelType> {

    @Override
    public AttributeValue transformFrom(ChannelType input) {
        return AttributeValue.builder()
                .s(input == null ? null : input.name())
                .build();
    }

    @Override
    public ChannelType transformTo(AttributeValue input) {
        if (input == null || input.s() == null) {
            return null;
        }
        return ChannelType.valueOf(input.s());
    }

    @Override
    public EnhancedType<ChannelType> type() {
        return EnhancedType.of(ChannelType.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.S;
    }
}
