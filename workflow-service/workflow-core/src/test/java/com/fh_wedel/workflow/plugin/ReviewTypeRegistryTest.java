package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTypePlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ReviewTypeRegistryTest {

    private ReviewTypeRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new ReviewTypeRegistry();
    }

    @Test
    void discoversTestPluginViaSpi() {
        assertNotNull(registry);
        Optional<ReviewTypePlugin> opt = registry.getByName("test-plugin");
        assertTrue(opt.isPresent(), "Registry should discover 'test-plugin' via ServiceLoader");
    }
}
