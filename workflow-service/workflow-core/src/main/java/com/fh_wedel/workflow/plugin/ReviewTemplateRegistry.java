package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewTemplatePlugin;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ReviewTemplateRegistry {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ReviewTemplateRegistry.class);



    private final Map<String, ReviewTemplatePlugin> plugins;

    public ReviewTemplateRegistry() {
        Map<String, ReviewTemplatePlugin> discovered = new LinkedHashMap<>();
        ServiceLoader<ReviewTemplatePlugin> loader = ServiceLoader.load(ReviewTemplatePlugin.class);
        for (ReviewTemplatePlugin plugin : loader) {
            log.info("Discovered review template plugin: '{}'", plugin.getName());
            discovered.put(plugin.getName(), plugin);
        }
        this.plugins = Collections.unmodifiableMap(discovered);
        log.info("Review template registry initialized with {} plugin(s)", plugins.size());
    }

    public Collection<ReviewTemplatePlugin> getAll() {
        return plugins.values();
    }

    public Optional<ReviewTemplatePlugin> getByName(String name) {
        return Optional.ofNullable(plugins.get(name));
    }
}
