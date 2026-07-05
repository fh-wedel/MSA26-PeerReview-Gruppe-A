package com.fh_wedel.configuration.service;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.ReviewTypePlugin;
import com.fh_wedel.configuration.config.PluginProperties;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.ServiceLoader;
import java.util.stream.Stream;

/**
 * Discovers and caches SPI plugin implementations from external JAR files.
 *
 * <p>At startup, scans the configured plugin directory for {@code *.jar} files,
 * creates a {@link URLClassLoader} with those JARs, and uses
 * {@link ServiceLoader} to discover all {@link ReviewTypePlugin} and
 * {@link ReviewTemplatePlugin} implementations. Results are cached for the
 * lifetime of the application.</p>
 *
 * <p>The service fails fast if no plugins are found for either SPI,
 * preventing a misconfigured deployment from silently running without
 * review capabilities.</p>
 */
@Service
@Slf4j
public class PluginService {

    private final PluginProperties pluginProperties;

    private List<ReviewTypePlugin> reviewTypes;
    private List<ReviewTemplatePlugin> reviewTemplates;

    public PluginService(PluginProperties pluginProperties) {
        this.pluginProperties = pluginProperties;
    }

    @PostConstruct
    void loadPlugins() {
        Path pluginDir = Path.of(pluginProperties.directory());
        log.info("Scanning for plugin JARs in: {}", pluginDir.toAbsolutePath());

        if (!Files.isDirectory(pluginDir)) {
            throw new IllegalStateException(
                    "Plugin directory does not exist or is not a directory: " + pluginDir.toAbsolutePath());
        }

        URL[] jarUrls;
        try (Stream<Path> paths = Files.list(pluginDir)) {
            jarUrls = paths
                    .filter(p -> p.toString().endsWith(".jar"))
                    .map(p -> {
                        try {
                            return p.toUri().toURL();
                        } catch (java.net.MalformedURLException e) {
                            throw new UncheckedIOException(
                                    new IOException("Failed to convert plugin path to URL: " + p, e));
                        }
                    })
                    .toArray(URL[]::new);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to list plugin directory: " + pluginDir, e);
        }

        if (jarUrls.length == 0) {
            throw new IllegalStateException(
                    "No JAR files found in plugin directory: " + pluginDir.toAbsolutePath());
        }

        log.info("Found {} plugin JAR(s):", jarUrls.length);
        for (URL url : jarUrls) {
            log.info("  - {}", url);
        }

        URLClassLoader pluginClassLoader = new URLClassLoader(jarUrls, getClass().getClassLoader());

        this.reviewTypes = ServiceLoader.load(ReviewTypePlugin.class, pluginClassLoader)
                .stream()
                .map(ServiceLoader.Provider::get)
                .toList();

        this.reviewTemplates = ServiceLoader.load(ReviewTemplatePlugin.class, pluginClassLoader)
                .stream()
                .map(ServiceLoader.Provider::get)
                .toList();

        log.info("Loaded {} ReviewTypePlugin(s): {}", reviewTypes.size(),
                reviewTypes.stream().map(ReviewTypePlugin::getName).toList());
        log.info("Loaded {} ReviewTemplatePlugin(s): {}", reviewTemplates.size(),
                reviewTemplates.stream().map(ReviewTemplatePlugin::getName).toList());

        if (reviewTypes.isEmpty()) {
            throw new IllegalStateException(
                    "No ReviewTypePlugin implementations found in " + pluginDir.toAbsolutePath()
                            + ". Ensure plugin JARs contain META-INF/services/"
                            + ReviewTypePlugin.class.getName());
        }
        if (reviewTemplates.isEmpty()) {
            throw new IllegalStateException(
                    "No ReviewTemplatePlugin implementations found in " + pluginDir.toAbsolutePath()
                            + ". Ensure plugin JARs contain META-INF/services/"
                            + ReviewTemplatePlugin.class.getName());
        }
    }

    public List<ReviewTypePlugin> getReviewTypes() {
        return reviewTypes;
    }

    public Optional<ReviewTypePlugin> getReviewType(String name) {
        return reviewTypes.stream().filter(p -> p.getName().equals(name)).findFirst();
    }

    public List<ReviewTemplatePlugin> getReviewTemplates() {
        return reviewTemplates;
    }

    public Optional<ReviewTemplatePlugin> getReviewTemplate(String name) {
        return reviewTemplates.stream().filter(p -> p.getName().equals(name)).findFirst();
    }
}
