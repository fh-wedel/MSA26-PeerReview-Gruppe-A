package com.fh_wedel.submission.controller;

import com.fh_wedel.submission.service.ConfigurationServiceClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submission/configurations")
@Slf4j
public class ConfigurationProxyController {

    private final ConfigurationServiceClient configurationServiceClient;

    public ConfigurationProxyController(ConfigurationServiceClient configurationServiceClient) {
        this.configurationServiceClient = configurationServiceClient;
    }

    @PostMapping({"", "/"})
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<String> createConfiguration(@RequestBody String body, HttpServletRequest request) {
        log.info("Proxying POST /api/submission/configurations to configuration-service");

        String result = configurationServiceClient.createConfiguration(
                body,
                request.getHeader("x-auth-username"),
                request.getHeader("x-auth-groups"),
                request.getHeader("x-auth-principal-id")
        );

        return ResponseEntity.status(201)
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }

    @GetMapping("/{configurationId}/grading-form")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author')")
    public ResponseEntity<String> getGradingForm(@PathVariable String configurationId, HttpServletRequest request) {
        log.info("Proxying GET /api/submission/configurations/{}/grading-form to configuration-service", configurationId);

        String result = configurationServiceClient.getGradingForm(
                configurationId,
                request.getHeader("x-auth-username"),
                request.getHeader("x-auth-groups"),
                request.getHeader("x-auth-principal-id")
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }
}
