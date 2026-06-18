package com.fh_wedel.matching.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserServiceClient(RestTemplate restTemplate,
                             @Value("${aws.user-service.url:http://user.internal.services:8081}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    /**
     * Gets a simple user summary by sub.
     */
    public UserProfile getUserBySub(String sub) {
        String url = userServiceUrl + "/api/users/" + sub;
        try {
            ResponseEntity<UserProfile> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createSystemHeaders()),
                    UserProfile.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch user by sub '{}'", sub, e);
            throw new RuntimeException("User not found");
        }
    }

    /**
     * Lists members of the Reviewer group.
     */
    public List<UserProfile> listReviewers() {
        String url = userServiceUrl + "/api/users/groups/Reviewer/members";
        try {
            ResponseEntity<UserProfileListResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createSystemHeaders()),
                    UserProfileListResponse.class
            );
            return response.getBody() != null ? response.getBody().getUsers() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch reviewers from User Service", e);
            return Collections.emptyList();
        }
    }

    /**
     * Retrieves full user details.
     */
    public UserProfile getUserDetails(String username) {
        String url = userServiceUrl + "/api/users/" + username + "/details";
        try {
            ResponseEntity<UserProfile> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createSystemHeaders()),
                    UserProfile.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.warn("Failed to fetch user details for '{}'", username, e);
            throw new RuntimeException("User not found or User Service unreachable");
        }
    }

    /**
     * Promotes an existing user to Reviewer.
     */
    public UserProfile createReviewer(String username, Map<String, String> customAttributes) {
        String url = userServiceUrl + "/api/users/groups/Reviewer/members";
        AddGroupMemberRequest request = new AddGroupMemberRequest();
        request.setUsername(username);
        request.setCustomAttributes(customAttributes);

        try {
            ResponseEntity<UserProfile> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(request, createSystemHeaders()),
                    UserProfile.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.warn("Failed to create reviewer '{}'", username, e);
            throw new RuntimeException("Failed to create reviewer");
        }
    }

    /**
     * Updates reviewer custom attributes.
     */
    public void updateReviewerAttributes(String username, Map<String, String> customAttributes) {
        String url = userServiceUrl + "/api/users/groups/Reviewer/members/" + username + "/attributes";
        UpdateAttributesRequest request = new UpdateAttributesRequest();
        request.setCustomAttributes(customAttributes);

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.PATCH,
                    new HttpEntity<>(request, createSystemHeaders()),
                    UserProfile.class
            );
        } catch (Exception e) {
            log.warn("Failed to update reviewer '{}'", username, e);
            throw new RuntimeException("Failed to update reviewer");
        }
    }

    /**
     * Removes a reviewer.
     */
    public void deleteReviewer(String username) {
        String url = userServiceUrl + "/api/users/groups/Reviewer/members/" + username;
        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(createSystemHeaders()),
                    Void.class
            );
        } catch (Exception e) {
            log.warn("Failed to delete reviewer '{}'", username, e);
            throw new RuntimeException("Failed to delete reviewer");
        }
    }

    /**
     * Helper to forge system credentials since this internal service
     * needs to bypass the User Service's Spring Security checks for internal tasks.
     */
    private HttpHeaders createSystemHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-auth-username", "matching-service-system");
        headers.set("x-auth-groups", "Admin,ExaminationOfficer");
        headers.set("x-auth-principal-id", "system-principal");
        return headers;
    }
}
