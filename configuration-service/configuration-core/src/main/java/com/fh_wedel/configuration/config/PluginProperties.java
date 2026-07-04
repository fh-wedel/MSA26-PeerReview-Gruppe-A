package com.fh_wedel.configuration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Configuration properties for the plugin loading system.
 */
@ConfigurationProperties(prefix = "configuration.plugins")
public record PluginProperties(
        @DefaultValue("/app/plugins") String directory
) {
}
