package com.fh_wedel.response.config;

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
        AttributeValue result = converter.transformFrom(uuid);
        assertEquals(uuid.toString(), result.s());
    }

    @Test
    void testTransformFrom_Null() {
        AttributeValue result = converter.transformFrom(null);
        assertNull(result.s());
    }

    @Test
    void testTransformTo() {
        UUID uuid = UUID.randomUUID();
        AttributeValue input = AttributeValue.builder().s(uuid.toString()).build();
        UUID result = converter.transformTo(input);
        assertEquals(uuid, result);
    }

    @Test
    void testTransformTo_NullInput() {
        assertNull(converter.transformTo(null));
    }

    @Test
    void testTransformTo_NullS() {
        AttributeValue input = AttributeValue.builder().build();
        assertNull(converter.transformTo(input));
    }

    @Test
    void testType() {
        assertEquals(EnhancedType.of(UUID.class), converter.type());
    }

    @Test
    void testAttributeValueType() {
        assertEquals(AttributeValueType.S, converter.attributeValueType());
    }
}
