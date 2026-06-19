package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTemplatePlugin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ReviewTemplateRegistryTest {

    private ReviewTemplateRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new ReviewTemplateRegistry();
    }

    @Test
    void discoversTestPluginViaSpi() {
        assertNotNull(registry);
        Optional<ReviewTemplatePlugin> opt = registry.getByName("test-plugin");
        assertTrue(opt.isPresent(), "Registry should discover 'test-plugin' via ServiceLoader");
    }
}
