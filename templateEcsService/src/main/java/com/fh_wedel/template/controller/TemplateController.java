package com.fh_wedel.template.controller;

import com.fh_wedel.template.service.TemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/template")
@Slf4j
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping("/status")
    public String getStatus() {
        log.info("Request received for Status endpoint");
        return templateService.getServiceStatus();
    }

    @GetMapping("/time")
    public String getCurrentTime() {
        log.info("Request received for Time endpoint");
        return templateService.getCurrentTime();
    }
}
