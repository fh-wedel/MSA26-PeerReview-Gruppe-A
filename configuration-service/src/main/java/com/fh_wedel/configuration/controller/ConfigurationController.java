package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.model.CreateConfigurationRequest;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.service.ConfigurationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/configuration")
@Slf4j
public class ConfigurationController {

    private final ConfigurationService configurationService;

    public ConfigurationController(ConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    /**
     * Endpoint for public health and service status checks.
     */
    @GetMapping("/status")
    public String getStatus() {
        log.info("Request received: GET /status");
        return configurationService.getServiceStatus();
    }

    /**
     * Returns server time with authenticated identity details.
     */
    @GetMapping("/time")
    public String getCurrentTime(Authentication authentication) {
        log.info("Request received: GET /time");
        String username = authentication != null ? authentication.getName() : "Guest";
        String groups = authentication != null ? authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList()
                .toString() : "None";
        return String.format("time=%s, username=%s, groups=%s", Instant.now(), username, groups);
    }

    /**
     * Creates a new submission configuration.
     * Accessible by Admin, ExaminationOfficer, Teacher, Reviewer, and Author.
     * Authors can only create configurations for themselves.
     */
    @PostMapping({"", "/"})
    public ResponseEntity<SubmissionConfiguration> createConfiguration(
            @Valid @RequestBody CreateConfigurationRequest request,
            Authentication authentication) {

        log.info("Request received: POST / (title={})", request.getTitle());

        String callerSub = extractSubFromDetails(authentication);
        String callerRole = getPrimaryRole(authentication);

        // Access check: If caller is ONLY an Author, they must be listed in authorIds
        if (isOnlyAuthor(authentication)) {
            if (callerSub == null || !request.getAuthorIds().contains(callerSub)) {
                log.warn("Access Denied: Author '{}' tried to create configuration for other authors: {}",
                        authentication.getName(), request.getAuthorIds());
                throw new AccessDeniedException("Access Denied: You can only create configurations for yourself.");
            }
        }

        SubmissionConfiguration config = configurationService.createConfiguration(
                request.getTitle(),
                request.getReviewProcessType(),
                request.getAuthorIds(),
                callerSub,
                callerRole,
                request.getNumberOfExaminers(),
                request.getSubmissionDeadline(),
                request.getReviewDeadline(),
                request.getEvaluationCriteria(),
                request.isCriteriaVisibleToAuthor()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(config);
    }

    /**
     * Gets details of a configuration by submission ID.
     * Authors can only read configurations where they are an author.
     * Evaluation criteria are masked if not visible to authors.
     */
    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionConfiguration> getConfiguration(
            @PathVariable String submissionId,
            Authentication authentication) {

        log.info("Request received: GET /{}", submissionId);

        SubmissionConfiguration config = configurationService.getConfiguration(submissionId);
        if (config == null) {
            return ResponseEntity.notFound().build();
        }

        String callerSub = extractSubFromDetails(authentication);

        // Access check: If caller is ONLY an Author, verify they are in authorIds
        boolean callerIsAuthor = isOnlyAuthor(authentication);
        if (callerIsAuthor) {
            if (callerSub == null || !config.getAuthorIds().contains(callerSub)) {
                log.warn("Access Denied: Author '{}' tried to access configuration {}",
                        authentication.getName(), submissionId);
                throw new AccessDeniedException("Access Denied: You do not have access to this configuration.");
            }
        }

        // Mask evaluation criteria if not visible to authors
        if (callerIsAuthor && !config.isCriteriaVisibleToAuthor()) {
            config.setEvaluationCriteria(null);
        }

        return ResponseEntity.ok(config);
    }

    /**
     * Gets all configurations for a specific author ID.
     * Authors can only query their own author ID.
     */
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<SubmissionConfiguration>> getConfigurationsByAuthor(
            @PathVariable String authorId,
            Authentication authentication) {

        log.info("Request received: GET /author/{}", authorId);

        String callerSub = extractSubFromDetails(authentication);
        boolean callerIsAuthor = isOnlyAuthor(authentication);

        if (callerIsAuthor) {
            if (callerSub == null || !callerSub.equals(authorId)) {
                log.warn("Access Denied: Author '{}' tried to query configs for authorId {}",
                        authentication.getName(), authorId);
                throw new AccessDeniedException("Access Denied: You can only query your own configurations.");
            }
        }

        List<SubmissionConfiguration> configs = configurationService.getConfigurationsByAuthor(authorId);

        // Mask evaluation criteria for authors if not visible
        if (callerIsAuthor) {
            configs.forEach(config -> {
                if (!config.isCriteriaVisibleToAuthor()) {
                    config.setEvaluationCriteria(null);
                }
            });
        }

        return ResponseEntity.ok(configs);
    }

    /**
     * Lists all submission configurations.
     * Restricted to Admins and Examination Officers.
     */
    @GetMapping({"", "/"})
    public ResponseEntity<List<SubmissionConfiguration>> listAllConfigurations() {
        log.info("Request received: GET / (list all)");
        List<SubmissionConfiguration> configs = configurationService.getAllConfigurations();
        return ResponseEntity.ok(configs);
    }

    // ========================
    // Helper Methods
    // ========================

    private boolean isOnlyAuthor(Authentication auth) {
        if (auth == null) {
            return false;
        } else {
            auth.getAuthorities();
        }
        boolean hasAuthor = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Author"));
        boolean hasHigherRole = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin")
                        || a.getAuthority().equals("ROLE_ExaminationOfficer")
                        || a.getAuthority().equals("ROLE_Teacher")
                        || a.getAuthority().equals("ROLE_Reviewer"));
        return hasAuthor && !hasHigherRole;
    }

    private String getPrimaryRole(Authentication auth) {
        if (auth == null) {
            return "Guest";
        } else {
            auth.getAuthorities();
        }
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).filter(Objects::nonNull)
                .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
                .toList();

        if (roles.contains("Admin")) return "Admin";
        if (roles.contains("ExaminationOfficer")) return "ExaminationOfficer";
        if (roles.contains("Teacher")) return "Teacher";
        if (roles.contains("Reviewer")) return "Reviewer";
        if (roles.contains("Author")) return "Author";
        return roles.isEmpty() ? "Guest" : roles.getFirst();
    }

    private String extractSubFromDetails(Authentication auth) {
        if (auth == null || auth.getDetails() == null) return null;
        String raw = auth.getDetails().toString();

        int firstQuote = raw.indexOf('"');
        int lastQuote = raw.lastIndexOf('"');
        String inner;
        if (firstQuote >= 0 && lastQuote > firstQuote) {
            inner = raw.substring(firstQuote + 1, lastQuote);
        } else {
            inner = raw;
        }

        int pipeIndex = inner.lastIndexOf('|');
        if (pipeIndex >= 0 && pipeIndex < inner.length() - 1) {
            return inner.substring(pipeIndex + 1);
        }
        return inner;
    }
}
