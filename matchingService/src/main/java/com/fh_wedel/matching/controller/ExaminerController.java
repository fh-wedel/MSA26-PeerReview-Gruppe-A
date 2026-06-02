package com.fh_wedel.matching.controller;

import com.fh_wedel.matching.model.api.CreateExaminerRequest;
import com.fh_wedel.matching.model.api.ErrorResponse;
import com.fh_wedel.matching.model.api.ExaminerResponse;
import com.fh_wedel.matching.model.api.UpdateExaminerRequest;
import com.fh_wedel.matching.service.CognitoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.InvalidParameterException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

/**
 * REST controller acting as a proxy for Cognito Reviewer user management.
 * Provides CRUD operations for managing reviewers in the Cognito User Pool.
 */
@RestController
@RequestMapping("/api/matching/examiners")
@Slf4j
public class ExaminerController {

    private final CognitoService cognitoService;

    public ExaminerController(CognitoService cognitoService) {
        this.cognitoService = cognitoService;
    }

    /**
     * Lists all reviewers in the Cognito Reviewer group.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<List<ExaminerResponse>> listExaminers() {
        log.info("Request received: GET /examiners");

        List<UserType> reviewers = cognitoService.listReviewers();

        List<ExaminerResponse> response = reviewers.stream()
                .map(u -> mapUserTypeToResponse(u, List.of(cognitoService.getReviewerGroupName())))
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Gets details of a specific reviewer by their Cognito sub (UUID) or username.
     */
    @GetMapping("/{examinerId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<?> getExaminer(@PathVariable String examinerId) {
        log.info("Request received: GET /examiners/{}", examinerId);

        try {
            List<String> groups = cognitoService.getUserGroups(examinerId);
            if (!groups.contains(cognitoService.getReviewerGroupName())) {
                log.warn("User {} is not a reviewer", examinerId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Examiner not found or not a reviewer").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
            }
            AdminGetUserResponse user = cognitoService.getUser(examinerId);
            ExaminerResponse response = mapAdminGetUserToResponse(user, groups);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            log.warn("Examiner not found: {}", examinerId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Examiner not found").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
        }
    }

    /**
     * Promotes an existing user in Cognito to a reviewer by adding them to the Reviewer group.
     * Restricted to Admin and ExaminationOfficer role.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<?> createExaminer(@RequestBody CreateExaminerRequest request) {
        log.info("Request received: POST /examiners (username={})", request.getUsername());

        try {
            AdminGetUserResponse promotedUser = cognitoService.createReviewer(
                    request.getUsername(),
                    request.getCustomAttributes()
            );

            List<String> groups = cognitoService.getUserGroups(request.getUsername());
            ExaminerResponse response = mapAdminGetUserToResponse(promotedUser, groups);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (UserNotFoundException e) {
            log.warn("Examiner not found for creation: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Examiner not found").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
        } catch (InvalidParameterException e) {
            log.warn("Invalid parameter provided for creation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid parameter provided: " + e.getMessage()).code("BAD_REQUEST").timestamp(OffsetDateTime.now()));
        }
    }

    /**
     * Updates custom attributes of a reviewer in Cognito.
     * Restricted to Admin and ExaminationOfficer role.
     */
    @PatchMapping("/{examinerId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<?> updateExaminer(@PathVariable String examinerId,
                                                           @RequestBody UpdateExaminerRequest request) {
        log.info("Request received: PATCH /examiners/{}", examinerId);

        try {
            List<String> groups = cognitoService.getUserGroups(examinerId);
            if (!groups.contains(cognitoService.getReviewerGroupName())) {
                log.warn("User {} is not a reviewer, cannot update", examinerId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Examiner not found or not a reviewer").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
            }

            Map<String, String> attrs = request.getCustomAttributes();
            if (attrs != null && !attrs.isEmpty()) {
                cognitoService.updateReviewerAttributes(examinerId, attrs);
            }

            // Return the updated user
            AdminGetUserResponse updatedUser = cognitoService.getUser(examinerId);
            ExaminerResponse response = mapAdminGetUserToResponse(updatedUser, groups);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            log.warn("Examiner not found for update: {}", examinerId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Examiner not found").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
        } catch (InvalidParameterException e) {
            log.warn("Invalid attribute provided for update: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid attribute provided: " + e.getMessage()).code("BAD_REQUEST").timestamp(OffsetDateTime.now()));
        }
    }

    /**
     * Deletes a reviewer from the Cognito User Pool.
     * Restricted to Admin and ExaminationOfficer role.
     */
    @DeleteMapping("/{examinerId}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<?> deleteExaminer(@PathVariable String examinerId) {
        log.info("Request received: DELETE /examiners/{}", examinerId);

        try {
            List<String> groups = cognitoService.getUserGroups(examinerId);
            if (!groups.contains(cognitoService.getReviewerGroupName())) {
                log.warn("User {} is not a reviewer, cannot delete", examinerId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Examiner not found or not a reviewer").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
            }

            cognitoService.deleteReviewer(examinerId);
            return ResponseEntity.noContent().build();
        } catch (UserNotFoundException e) {
            log.warn("Examiner not found for deletion: {}", examinerId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Examiner not found").code("NOT_FOUND").timestamp(OffsetDateTime.now()));
        }
    }

    // ========================
    // Mapping helpers
    // ========================

    private ExaminerResponse mapUserTypeToResponse(UserType user, List<String> groups) {
        ExaminerResponse response = new ExaminerResponse();
        response.setUserId(CognitoService.extractSub(user));
        response.setUsername(user.username());
        response.setEmail(CognitoService.extractEmail(user));
        response.setEnabled(user.enabled());
        response.setStatus(user.userStatusAsString());
        if (user.userCreateDate() != null) {
            response.setCreatedAt(OffsetDateTime.ofInstant(user.userCreateDate(), ZoneOffset.UTC));
        }
        response.setCustomAttributes(CognitoService.extractCustomAttributes(user));
        response.setGroups(groups);
        return response;
    }

    private ExaminerResponse mapAdminGetUserToResponse(AdminGetUserResponse user, List<String> groups) {
        ExaminerResponse response = new ExaminerResponse();
        response.setUserId(CognitoService.extractAttribute(user, "sub"));
        response.setUsername(user.username());
        response.setEmail(CognitoService.extractAttribute(user, "email"));
        response.setEnabled(user.enabled());
        response.setStatus(user.userStatusAsString());
        if (user.userCreateDate() != null) {
            response.setCreatedAt(OffsetDateTime.ofInstant(user.userCreateDate(), ZoneOffset.UTC));
        }
        response.setCustomAttributes(CognitoService.extractCustomAttributes(user));
        response.setGroups(groups);
        return response;
    }
}
