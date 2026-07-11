package com.fh_wedel.notification.config;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UuidAttributeConverterTest {

    private final UuidAttributeConverter converter = new UuidAttributeConverter();

    @Test
    void testTransformFrom() {
        UUID uuid = UUID.randomUUID();
        AttributeValue val = converter.transformFrom(uuid);
        assertNotNull(val);
        assertEquals(uuid.toString(), val.s());

        AttributeValue nullVal = converter.transformFrom(null);
        assertNull(nullVal.s());
    }

    @Test
    void testTransformTo() {
        UUID uuid = UUID.randomUUID();
        UUID result = converter.transformTo(AttributeValue.builder().s(uuid.toString()).build());
        assertEquals(uuid, result);

        assertNull(converter.transformTo(null));
        assertNull(converter.transformTo(AttributeValue.builder().build()));
    }

    @Test
    void testType() {
        EnhancedType<UUID> type = converter.type();
        assertEquals(UUID.class, type.rawClass());
    }

    @Test
    void testAttributeValueType() {
        assertEquals(AttributeValueType.S, converter.attributeValueType());
    }
}
