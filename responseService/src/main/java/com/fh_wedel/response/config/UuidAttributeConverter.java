package com.fh_wedel.response.config;

import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.UUID;

/**
 * Maps a {@link UUID} to/from a DynamoDB String attribute. The Enhanced Client
 * has no built-in UUID converter, so entities that keep a {@code UUID} id must
 * reference this via {@code @DynamoDbConvertedBy(UuidAttributeConverter.class)}.
 */
public class UuidAttributeConverter implements AttributeConverter<UUID> {

    @Override
    public AttributeValue transformFrom(UUID input) {
        return AttributeValue.builder()
                .s(input == null ? null : input.toString())
                .build();
    }

    @Override
    public UUID transformTo(AttributeValue input) {
        if (input == null || input.s() == null) {
            return null;
        }
        return UUID.fromString(input.s());
    }

    @Override
    public EnhancedType<UUID> type() {
        return EnhancedType.of(UUID.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.S;
    }
}
