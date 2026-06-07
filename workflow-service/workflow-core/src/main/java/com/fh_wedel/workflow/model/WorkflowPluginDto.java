package com.fh_wedel.workflow.model;

public record WorkflowPluginDto(
    String name,
    String title,
    String description,
    WorkflowRulesDto rules
) {}
