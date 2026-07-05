package com.fh_wedel.notification.config;

import com.fh_wedel.notification.model.NotificationStatus;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import static org.junit.jupiter.api.Assertions.*;

class NotificationStatusConverterTest {

    private final NotificationStatusConverter converter = new NotificationStatusConverter();

    @Test
    void testTransformFrom() {
        AttributeValue val = converter.transformFrom(NotificationStatus.PENDING);
        assertNotNull(val);
        assertEquals("PENDING", val.s());

        AttributeValue nullVal = converter.transformFrom(null);
        assertNull(nullVal.s());
    }

    @Test
    void testTransformTo() {
        NotificationStatus type = converter.transformTo(AttributeValue.builder().s("SENT").build());
        assertEquals(NotificationStatus.SENT, type);

        assertNull(converter.transformTo(null));
        assertNull(converter.transformTo(AttributeValue.builder().build()));
    }

    @Test
    void testType() {
        EnhancedType<NotificationStatus> type = converter.type();
        assertEquals(NotificationStatus.class, type.rawClass());
    }

    @Test
    void testAttributeValueType() {
        assertEquals(AttributeValueType.S, converter.attributeValueType());
    }
}
