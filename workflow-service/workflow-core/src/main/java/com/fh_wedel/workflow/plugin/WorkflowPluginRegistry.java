package com.fh_wedel.workflow.plugin;

import com.fh_wedel.workflow.api.ReviewWorkflowPlugin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class WorkflowPluginRegistry {

    private final Map<String, ReviewWorkflowPlugin> plugins;

    public WorkflowPluginRegistry() {
        Map<String, ReviewWorkflowPlugin> discovered = new LinkedHashMap<>();
        ServiceLoader<ReviewWorkflowPlugin> loader = ServiceLoader.load(ReviewWorkflowPlugin.class);
        for (ReviewWorkflowPlugin plugin : loader) {
            log.info("Discovered workflow plugin: '{}' - {}", plugin.getName(), plugin.getDescription());
            if (discovered.containsKey(plugin.getName())) {
                log.warn("Duplicate plugin name '{}' — overwriting previous registration", plugin.getName());
            }
            discovered.put(plugin.getName(), plugin);
        }
        this.plugins = Collections.unmodifiableMap(discovered);
        log.info("Workflow plugin registry initialized with {} plugin(s)", plugins.size());
    }

    public Collection<ReviewWorkflowPlugin> getAll() {
        return plugins.values();
    }

    public Optional<ReviewWorkflowPlugin> getByName(String name) {
        return Optional.ofNullable(plugins.get(name));
    }

    public boolean exists(String name) {
        return plugins.containsKey(name);
    }
}
