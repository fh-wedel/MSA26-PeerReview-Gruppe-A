package com.fh_wedel.user.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.util.List;
import java.util.Map;

/**
 * Service that wraps Cognito calls with Caffeine caching to reduce API limits usage.
 */
@Service
@Slf4j
public class CachedUserService {

    private final CognitoService cognitoService;

    public CachedUserService(CognitoService cognitoService) {
        this.cognitoService = cognitoService;
    }

    @Cacheable(value = "userSearch", key = "#queryPrefix ?: 'ALL'")
    public List<UserType> searchUsers(String queryPrefix) {
        return cognitoService.searchUsers(queryPrefix);
    }

    @Cacheable(value = "users", key = "'sub:' + #sub")
    public UserType getUserBySub(String sub) {
        return cognitoService.getUserBySub(sub);
    }

    @Cacheable(value = "users", key = "'username:' + #username")
    public AdminGetUserResponse getUserByUsername(String username) {
        return cognitoService.getUserByUsername(username);
    }

    @Cacheable(value = "groupMembers", key = "#groupName")
    public List<UserType> listGroupMembers(String groupName) {
        return cognitoService.listGroupMembers(groupName);
    }

    public List<String> getUserGroups(String username) {
        return cognitoService.getUserGroups(username);
    }

    @CacheEvict(value = {"users", "groupMembers"}, allEntries = true)
    public void addUserToGroup(String username, String groupName, Map<String, String> customAttributes) {
        cognitoService.addUserToGroup(username, groupName, customAttributes);
    }

    @CacheEvict(value = {"users", "groupMembers"}, allEntries = true)
    public void removeUserFromGroup(String username, String groupName) {
        cognitoService.removeUserFromGroup(username, groupName);
    }

    @CacheEvict(value = {"users", "groupMembers", "userSearch"}, allEntries = true)
    public void updateUserAttributes(String username, Map<String, String> customAttributes) {
        cognitoService.updateUserAttributes(username, customAttributes);
    }

    @CacheEvict(value = {"users", "groupMembers", "userSearch"}, allEntries = true)
    public void invalidateAllCaches() {
        log.debug("All user caches invalidated.");
    }
}
