package com.fh_wedel.notification.config;

import com.fh_wedel.notification.model.ChannelType;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import static org.junit.jupiter.api.Assertions.*;

class ChannelTypeConverterTest {

    private final ChannelTypeConverter converter = new ChannelTypeConverter();

    @Test
    void testTransformFrom() {
        AttributeValue val = converter.transformFrom(ChannelType.IN_APP);
        assertNotNull(val);
        assertEquals("IN_APP", val.s());

        AttributeValue nullVal = converter.transformFrom(null);
        assertNull(nullVal.s());
    }

    @Test
    void testTransformTo() {
        ChannelType type = converter.transformTo(AttributeValue.builder().s("EMAIL").build());
        assertEquals(ChannelType.EMAIL, type);

        assertNull(converter.transformTo(null));
        assertNull(converter.transformTo(AttributeValue.builder().build()));
    }

    @Test
    void testType() {
        EnhancedType<ChannelType> type = converter.type();
        assertEquals(ChannelType.class, type.rawClass());
    }

    @Test
    void testAttributeValueType() {
        assertEquals(AttributeValueType.S, converter.attributeValueType());
    }
}
