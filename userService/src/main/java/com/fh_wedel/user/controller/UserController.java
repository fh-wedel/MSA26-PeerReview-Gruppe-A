package com.fh_wedel.user.controller;

import com.fh_wedel.user.model.api.*;
import com.fh_wedel.user.service.CachedUserService;
import com.fh_wedel.user.service.CognitoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

    private final CachedUserService userService;

    public UserController(CachedUserService userService) {
        this.userService = userService;
    }

    /**
     * Search users by prefix. Accessible by all authenticated users.
     */
    @GetMapping("/search")
    public ResponseEntity<UserSearchResponse> searchUsers(@RequestParam(name = "q", required = false) String query) {
        log.info("Request received: GET /search (q={})", query);
        List<UserType> users = userService.searchUsers(query);
        
        List<UserSummary> summaries = users.stream().map(u -> {
            UserSummary summary = new UserSummary();
            summary.setSub(CognitoService.extractSub(u));
            summary.setUsername(u.username());
            return summary;
        }).collect(Collectors.toList());

        UserSearchResponse response = new UserSearchResponse();
        response.setUsers(summaries);
        return ResponseEntity.ok(response);
    }

    /**
     * Get a user by Cognito sub UUID. Accessible by all authenticated users.
     */
    @GetMapping("/{sub}")
    public ResponseEntity<UserSummary> getUserBySub(@PathVariable("sub") String sub) {
        log.info("Request received: GET /{}", sub);
        UserType user = userService.getUserBySub(sub);
        
        UserSummary summary = new UserSummary();
        summary.setSub(CognitoService.extractSub(user));
        summary.setUsername(user.username());
        return ResponseEntity.ok(summary);
    }

    /**
     * Bulk resolve sub UUIDs to usernames.
     */
    @PostMapping("/bulk")
    public ResponseEntity<BulkResolveResponse> bulkResolveUsers(@RequestBody BulkResolveRequest request) {
        log.info("Request received: POST /bulk (count={})", request.getSubs().size());
        
        Map<String, String> resolved = new HashMap<>();
        for (String sub : request.getSubs()) {
            try {
                UserType user = userService.getUserBySub(sub);
                resolved.put(sub, user.username());
            } catch (UserNotFoundException e) {
                log.warn("Bulk resolve: user with sub {} not found", sub);
            }
        }
        
        BulkResolveResponse response = new BulkResolveResponse();
        response.setUsers(resolved);
        return ResponseEntity.ok(response);
    }

    /**
     * List members of a specific group. Admin/ExaminationOfficer only.
     */
    @GetMapping("/groups/{groupName}/members")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<UserProfileListResponse> listGroupMembers(@PathVariable("groupName") String groupName) {
        log.info("Request received: GET /groups/{}/members", groupName);
        List<UserType> users = userService.listGroupMembers(groupName);
        
        List<UserProfile> profiles = users.stream()
                .map(u -> mapUserTypeToProfile(u, List.of(groupName)))
                .collect(Collectors.toList());
                
        UserProfileListResponse response = new UserProfileListResponse();
        response.setUsers(profiles);
        return ResponseEntity.ok(response);
    }

    /**
     * Add an existing user to a group. Admin/ExaminationOfficer only.
     */
    @PostMapping("/groups/{groupName}/members")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<UserProfile> addGroupMember(
            @PathVariable("groupName") String groupName,
            @RequestBody AddGroupMemberRequest request) {
        log.info("Request received: POST /groups/{}/members (username={})", groupName, request.getUsername());
        
        userService.addUserToGroup(request.getUsername(), groupName, request.getCustomAttributes());
        
        AdminGetUserResponse user = userService.getUserByUsername(request.getUsername());
        List<String> groups = userService.getUserGroups(request.getUsername());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(mapAdminUserToProfile(user, groups));
    }

    /**
     * Remove a user from a group. Admin/ExaminationOfficer only.
     */
    @DeleteMapping("/groups/{groupName}/members/{username}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<Void> removeGroupMember(
            @PathVariable("groupName") String groupName,
            @PathVariable("username") String username) {
        log.info("Request received: DELETE /groups/{}/members/{}", groupName, username);
        
        List<String> groups = userService.getUserGroups(username);
        if (!groups.contains(groupName)) {
            log.warn("User {} is not in group {}", username, groupName);
            throw UserNotFoundException.builder().message("User not in group").build();
        }
        
        userService.removeUserFromGroup(username, groupName);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get full user details. Admin/ExaminationOfficer only.
     */
    @GetMapping("/details/{username}")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<UserProfile> getUserDetails(@PathVariable("username") String username) {
        log.info("Request received: GET /details/{}", username);
        
        AdminGetUserResponse user = userService.getUserByUsername(username);
        List<String> groups = userService.getUserGroups(username);
        return ResponseEntity.ok(mapAdminUserToProfile(user, groups));
    }

    /**
     * Update custom attributes of a group member. Admin/ExaminationOfficer only.
     */
    @PatchMapping("/groups/{groupName}/members/{username}/attributes")
    @PreAuthorize("hasAnyRole('Admin', 'ExaminationOfficer')")
    public ResponseEntity<UserProfile> updateUserAttributes(
            @PathVariable("groupName") String groupName,
            @PathVariable("username") String username,
            @RequestBody UpdateAttributesRequest request) {
        log.info("Request received: PATCH /groups/{}/members/{}/attributes", groupName, username);
        
        List<String> groups = userService.getUserGroups(username);
        if (!groups.contains(groupName)) {
            log.warn("User {} is not in group {}, cannot update attributes", username, groupName);
            throw UserNotFoundException.builder().message("User not in group").build();
        }
        
        if (request.getCustomAttributes() != null && !request.getCustomAttributes().isEmpty()) {
            userService.updateUserAttributes(username, request.getCustomAttributes());
        }
        
        AdminGetUserResponse user = userService.getUserByUsername(username);
        return ResponseEntity.ok(mapAdminUserToProfile(user, groups));
    }

    // ==========================================
    // Mapping Helpers
    // ==========================================

    private UserProfile mapUserTypeToProfile(UserType user, List<String> groups) {
        UserProfile profile = new UserProfile();
        profile.setSub(CognitoService.extractSub(user));
        profile.setUsername(user.username());
        profile.setEmail(CognitoService.extractEmail(user));
        profile.setEnabled(user.enabled());
        profile.setStatus(user.userStatusAsString());
        if (user.userCreateDate() != null) {
            profile.setCreatedAt(OffsetDateTime.ofInstant(user.userCreateDate(), ZoneOffset.UTC));
        }
        profile.setGroups(groups);
        profile.setCustomAttributes(CognitoService.extractCustomAttributes(user.attributes()));
        return profile;
    }

    private UserProfile mapAdminUserToProfile(AdminGetUserResponse user, List<String> groups) {
        UserProfile profile = new UserProfile();
        profile.setSub(CognitoService.extractSub(user));
        profile.setUsername(user.username());
        profile.setEmail(CognitoService.extractEmail(user));
        profile.setEnabled(user.enabled());
        profile.setStatus(user.userStatusAsString());
        if (user.userCreateDate() != null) {
            profile.setCreatedAt(OffsetDateTime.ofInstant(user.userCreateDate(), ZoneOffset.UTC));
        }
        profile.setGroups(groups);
        profile.setCustomAttributes(CognitoService.extractCustomAttributes(user.userAttributes()));
        return profile;
    }
}
