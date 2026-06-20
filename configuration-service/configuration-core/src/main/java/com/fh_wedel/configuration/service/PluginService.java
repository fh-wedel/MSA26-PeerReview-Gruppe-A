package com.fh_wedel.configuration.service;

import com.fh_wedel.configuration.api.ReviewTemplatePlugin;
import com.fh_wedel.configuration.api.ReviewTypePlugin;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.ServiceLoader;
import java.util.stream.StreamSupport;

@Service
public class PluginService {

    public List<ReviewTypePlugin> getReviewTypes() {
        return StreamSupport.stream(ServiceLoader.load(ReviewTypePlugin.class).spliterator(), false).toList();
    }

    public Optional<ReviewTypePlugin> getReviewType(String name) {
        return getReviewTypes().stream().filter(p -> p.getName().equals(name)).findFirst();
    }

    public List<ReviewTemplatePlugin> getReviewTemplates() {
        return StreamSupport.stream(ServiceLoader.load(ReviewTemplatePlugin.class).spliterator(), false).toList();
    }

    public Optional<ReviewTemplatePlugin> getReviewTemplate(String name) {
        return getReviewTemplates().stream().filter(p -> p.getName().equals(name)).findFirst();
    }
}
