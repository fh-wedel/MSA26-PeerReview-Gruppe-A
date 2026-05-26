package com.fh_wedel.workflow.model;

public record WorkflowPluginDto(
    String name,
    String description,
    WorkflowRulesDto rules
) {}
