package com.fh_wedel.matching.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Proxy service for Cognito admin operations on reviewers.
 * Acts as a thin wrapper around the AWS Cognito Identity Provider Admin API.
 */
@Service
@Slf4j
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;
    private final String reviewerGroupName;

    public CognitoService(CognitoIdentityProviderClient cognitoClient,
                          @Value("${aws.cognito.user-pool-id}") String userPoolId,
                          @Value("${aws.cognito.reviewer-group-name}") String reviewerGroupName) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
        this.reviewerGroupName = reviewerGroupName;
    }

    /**
     * Lists all users in the Reviewer Cognito group.
     *
     * @return list of user details from the Reviewer group
     */
    public List<UserType> listReviewers() {
        log.info("Listing all users in Cognito group '{}'", reviewerGroupName);

        List<UserType> allUsers = new ArrayList<>();
        String nextToken = null;

        do {
            ListUsersInGroupRequest.Builder requestBuilder = ListUsersInGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .groupName(reviewerGroupName);

            if (nextToken != null) {
                requestBuilder.nextToken(nextToken);
            }

            ListUsersInGroupResponse response = cognitoClient.listUsersInGroup(requestBuilder.build());
            allUsers.addAll(response.users());
            nextToken = response.nextToken();
        } while (nextToken != null);

        log.info("Found {} users in group '{}'", allUsers.size(), reviewerGroupName);
        return allUsers;
    }

    /**
     * Gets a specific user by their Cognito username.
     *
     * @param username the Cognito username
     * @return user details
     */
    public AdminGetUserResponse getUser(String username) {
        log.info("Getting user details for '{}'", username);

        return cognitoClient.adminGetUser(AdminGetUserRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .build());
    }

    /**
     * Creates a new user in Cognito and adds them to the Reviewer group.
     *
     * @param username         the desired username
     * @param email            the user's email
     * @param temporaryPassword optional temporary password (Cognito generates one if null)
     * @param customAttributes  optional custom attributes
     * @return the created user
     */
    public AdminCreateUserResponse createReviewer(String username, String email,
                                                   String temporaryPassword,
                                                   Map<String, String> customAttributes) {
        log.info("Creating new reviewer '{}' with email '{}'", username, email);

        List<AttributeType> attributes = new ArrayList<>();
        attributes.add(AttributeType.builder().name("email").value(email).build());
        attributes.add(AttributeType.builder().name("email_verified").value("true").build());

        if (customAttributes != null) {
            customAttributes.forEach((key, value) ->
                    attributes.add(AttributeType.builder().name("custom:" + key).value(value).build()));
        }

        AdminCreateUserRequest.Builder requestBuilder = AdminCreateUserRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .userAttributes(attributes)
                .desiredDeliveryMediums(DeliveryMediumType.EMAIL);

        if (temporaryPassword != null && !temporaryPassword.isBlank()) {
            requestBuilder.temporaryPassword(temporaryPassword);
        }

        AdminCreateUserResponse response = cognitoClient.adminCreateUser(requestBuilder.build());

        // Add the new user to the Reviewer group
        cognitoClient.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .groupName(reviewerGroupName)
                .build());

        log.info("Created reviewer '{}' and added to group '{}'", username, reviewerGroupName);
        return response;
    }

    /**
     * Updates custom attributes of an existing user.
     *
     * @param username         the Cognito username
     * @param customAttributes the attributes to update
     */
    public void updateReviewerAttributes(String username, Map<String, String> customAttributes) {
        log.info("Updating attributes for reviewer '{}'", username);

        List<AttributeType> attributes = customAttributes.entrySet().stream()
                .map(entry -> AttributeType.builder()
                        .name("custom:" + entry.getKey())
                        .value(entry.getValue())
                        .build())
                .toList();

        cognitoClient.adminUpdateUserAttributes(AdminUpdateUserAttributesRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .userAttributes(attributes)
                .build());

        log.info("Updated {} attributes for reviewer '{}'", attributes.size(), username);
    }

    /**
     * Deletes a user from Cognito.
     *
     * @param username the Cognito username
     */
    public void deleteReviewer(String username) {
        log.info("Deleting reviewer '{}'", username);

        cognitoClient.adminDeleteUser(AdminDeleteUserRequest.builder()
                .userPoolId(userPoolId)
                .username(username)
                .build());

        log.info("Deleted reviewer '{}'", username);
    }

    /**
     * Extracts the Cognito 'sub' attribute from a UserType.
     *
     * @param user the Cognito user
     * @return the sub (UUID) or null if not found
     */
    public static String extractSub(UserType user) {
        return user.attributes().stream()
                .filter(attr -> "sub".equals(attr.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElse(null);
    }

    /**
     * Extracts the email attribute from a UserType.
     */
    public static String extractEmail(UserType user) {
        return user.attributes().stream()
                .filter(attr -> "email".equals(attr.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElse(null);
    }

    /**
     * Extracts custom attributes from a UserType.
     */
    public static Map<String, String> extractCustomAttributes(UserType user) {
        return user.attributes().stream()
                .filter(attr -> attr.name().startsWith("custom:"))
                .collect(Collectors.toMap(
                        attr -> attr.name().substring("custom:".length()),
                        AttributeType::value
                ));
    }

    /**
     * Extracts custom attributes from an AdminGetUserResponse.
     */
    public static Map<String, String> extractCustomAttributes(AdminGetUserResponse user) {
        return user.userAttributes().stream()
                .filter(attr -> attr.name().startsWith("custom:"))
                .collect(Collectors.toMap(
                        attr -> attr.name().substring("custom:".length()),
                        AttributeType::value
                ));
    }

    /**
     * Extracts a specific attribute from AdminGetUserResponse.
     */
    public static String extractAttribute(AdminGetUserResponse user, String attributeName) {
        return user.userAttributes().stream()
                .filter(attr -> attributeName.equals(attr.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElse(null);
    }
}
