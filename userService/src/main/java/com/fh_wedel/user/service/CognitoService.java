package com.fh_wedel.user.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for interacting directly with the AWS Cognito API.
 */
@Service
@Slf4j
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;

    public CognitoService(CognitoIdentityProviderClient cognitoClient,
                          @Value("${aws.cognito.user-pool-id}") String userPoolId) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
    }

    /**
     * Lists users matching the given username prefix. If the prefix is empty, lists all.
     */
    public List<UserType> searchUsers(String queryPrefix) {
        log.debug("Searching users with prefix: '{}'", queryPrefix);
        
        if (userPoolId == null || userPoolId.isEmpty()) {
            log.warn("Cognito user pool ID is not configured. Returning empty list.");
            return List.of();
        }

        ListUsersRequest.Builder requestBuilder = ListUsersRequest.builder()
                .userPoolId(userPoolId)
                .limit(20);

        if (queryPrefix != null && !queryPrefix.isEmpty()) {
            requestBuilder.filter("username ^= \"" + queryPrefix + "\"");
        }

        ListUsersResponse response = cognitoClient.listUsers(requestBuilder.build());
        return response.users();
    }

    /**
     * Gets a single user by their Cognito sub UUID. Uses filter on ListUsers.
     */
    public UserType getUserBySub(String sub) {
        log.debug("Fetching user by sub: {}", sub);
        ListUsersRequest request = ListUsersRequest.builder()
                .userPoolId(userPoolId)
                .filter("sub = \"" + sub + "\"")
                .limit(1)
                .build();
        ListUsersResponse response = cognitoClient.listUsers(request);
        if (response.users().isEmpty()) {
            throw UserNotFoundException.builder().message("User with sub " + sub + " not found").build();
        }
        return response.users().get(0);
    }

    /**
     * Gets a single user by their username (AdminGetUser).
     */
    public AdminGetUserResponse getUserByUsername(String username) {
        log.debug("Fetching user by username: {}", username);
        AdminGetUserRequest request = AdminGetUserRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .build();
        return cognitoClient.adminGetUser(request);
    }

    /**
     * Lists all users in a given Cognito group.
     */
    public List<UserType> listGroupMembers(String groupName) {
        log.debug("Listing users in group: {}", groupName);
        List<UserType> allUsers = new ArrayList<>();
        String nextToken = null;

        do {
            ListUsersInGroupRequest request = ListUsersInGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .groupName(groupName)
                    .nextToken(nextToken)
                    .build();

            ListUsersInGroupResponse response = cognitoClient.listUsersInGroup(request);
            allUsers.addAll(response.users());
            nextToken = response.nextToken();
        } while (nextToken != null);

        return allUsers;
    }

    /**
     * Gets the groups a given user (by username) belongs to.
     */
    public List<String> getUserGroups(String username) {
        AdminListGroupsForUserRequest request = AdminListGroupsForUserRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .build();
        AdminListGroupsForUserResponse response = cognitoClient.adminListGroupsForUser(request);
        return response.groups().stream()
                .map(GroupType::groupName)
                .collect(Collectors.toList());
    }

    /**
     * Adds an existing user to a group. Updates attributes if provided.
     */
    public void addUserToGroup(String username, String groupName, Map<String, String> customAttributes) {
        log.info("Adding user '{}' to group '{}'", username, groupName);

        AdminAddUserToGroupRequest request = AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .groupName(groupName)
                .build();
        cognitoClient.adminAddUserToGroup(request);

        if (customAttributes != null && !customAttributes.isEmpty()) {
            updateUserAttributes(username, customAttributes);
        }
    }

    /**
     * Removes a user from a group.
     */
    public void removeUserFromGroup(String username, String groupName) {
        log.info("Removing user '{}' from group '{}'", username, groupName);
        AdminRemoveUserFromGroupRequest request = AdminRemoveUserFromGroupRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .groupName(groupName)
                .build();
        cognitoClient.adminRemoveUserFromGroup(request);
    }

    /**
     * Updates custom attributes for a given user.
     */
    public void updateUserAttributes(String username, Map<String, String> customAttributes) {
        log.info("Updating custom attributes for user '{}': {}", username, customAttributes);

        List<AttributeType> attributes = new ArrayList<>();
        for (Map.Entry<String, String> entry : customAttributes.entrySet()) {
            String key = entry.getKey();
            if (!key.startsWith("custom:")) {
                key = "custom:" + key;
            }
            attributes.add(AttributeType.builder().name(key).value(entry.getValue()).build());
        }

        AdminUpdateUserAttributesRequest updateReq = AdminUpdateUserAttributesRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .userAttributes(attributes)
                .build();

        cognitoClient.adminUpdateUserAttributes(updateReq);
    }

    // ========================
    // Utility extractors
    // ========================

    public static String extractSub(UserType user) {
        return extractAttribute(user.attributes(), "sub");
    }

    public static String extractSub(AdminGetUserResponse user) {
        return extractAttribute(user.userAttributes(), "sub");
    }

    public static String extractEmail(UserType user) {
        return extractAttribute(user.attributes(), "email");
    }

    public static String extractEmail(AdminGetUserResponse user) {
        return extractAttribute(user.userAttributes(), "email");
    }

    public static String extractAttribute(List<AttributeType> attributes, String key) {
        if (attributes == null) return null;
        return attributes.stream()
                .filter(a -> a.name().equals(key))
                .findFirst()
                .map(AttributeType::value)
                .orElse(null);
    }

    public static Map<String, String> extractCustomAttributes(List<AttributeType> attributes) {
        Map<String, String> customAttrs = new HashMap<>();
        if (attributes != null) {
            for (AttributeType attr : attributes) {
                if (attr.name().startsWith("custom:")) {
                    customAttrs.put(attr.name().substring(7), attr.value());
                }
            }
        }
        return customAttrs;
    }
}
