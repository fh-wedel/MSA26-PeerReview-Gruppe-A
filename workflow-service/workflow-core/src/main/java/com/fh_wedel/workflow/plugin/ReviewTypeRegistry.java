package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTypePlugin;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ReviewTypeRegistry {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ReviewTypeRegistry.class);



    private final Map<String, ReviewTypePlugin> plugins;

    public ReviewTypeRegistry() {
        Map<String, ReviewTypePlugin> discovered = new LinkedHashMap<>();
        ServiceLoader<ReviewTypePlugin> loader = ServiceLoader.load(ReviewTypePlugin.class);
        for (ReviewTypePlugin plugin : loader) {
            log.info("Discovered review type plugin: '{}'", plugin.getName());
            discovered.put(plugin.getName(), plugin);
        }
        this.plugins = Collections.unmodifiableMap(discovered);
        log.info("Review type registry initialized with {} plugin(s)", plugins.size());
    }

    public Collection<ReviewTypePlugin> getAll() {
        return plugins.values();
    }

    public Optional<ReviewTypePlugin> getByName(String name) {
        return Optional.ofNullable(plugins.get(name));
    }
}
