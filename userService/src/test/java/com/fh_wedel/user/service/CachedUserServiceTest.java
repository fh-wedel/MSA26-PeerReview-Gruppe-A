package com.fh_wedel.user.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class CachedUserServiceTest {

    @Mock
    private CognitoService cognitoService;

    @InjectMocks
    private CachedUserService cachedUserService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSearchUsers() {
        List<UserType> expected = Collections.singletonList(UserType.builder().username("testuser").build());
        when(cognitoService.searchUsers("test")).thenReturn(expected);

        List<UserType> actual = cachedUserService.searchUsers("test");

        assertEquals(expected, actual);
        verify(cognitoService, times(1)).searchUsers("test");
    }

    @Test
    void testGetUserBySub() {
        UserType expected = UserType.builder().username("testuser").build();
        when(cognitoService.getUserBySub("sub-123")).thenReturn(expected);

        UserType actual = cachedUserService.getUserBySub("sub-123");

        assertEquals(expected, actual);
        verify(cognitoService, times(1)).getUserBySub("sub-123");
    }

    @Test
    void testGetUserByUsername() {
        AdminGetUserResponse expected = AdminGetUserResponse.builder().username("testuser").build();
        when(cognitoService.getUserByUsername("testuser")).thenReturn(expected);

        AdminGetUserResponse actual = cachedUserService.getUserByUsername("testuser");

        assertEquals(expected, actual);
        verify(cognitoService, times(1)).getUserByUsername("testuser");
    }

    @Test
    void testListGroupMembers() {
        List<UserType> expected = Collections.singletonList(UserType.builder().username("testuser").build());
        when(cognitoService.listGroupMembers("Admin")).thenReturn(expected);

        List<UserType> actual = cachedUserService.listGroupMembers("Admin");

        assertEquals(expected, actual);
        verify(cognitoService, times(1)).listGroupMembers("Admin");
    }

    @Test
    void testGetUserGroups() {
        List<String> expected = Collections.singletonList("Admin");
        when(cognitoService.getUserGroups("testuser")).thenReturn(expected);

        List<String> actual = cachedUserService.getUserGroups("testuser");

        assertEquals(expected, actual);
        verify(cognitoService, times(1)).getUserGroups("testuser");
    }

    @Test
    void testAddUserToGroup() {
        Map<String, String> attributes = Map.of("custom:key", "value");
        cachedUserService.addUserToGroup("testuser", "Admin", attributes);

        verify(cognitoService, times(1)).addUserToGroup("testuser", "Admin", attributes);
    }

    @Test
    void testRemoveUserFromGroup() {
        cachedUserService.removeUserFromGroup("testuser", "Admin");

        verify(cognitoService, times(1)).removeUserFromGroup("testuser", "Admin");
    }

    @Test
    void testUpdateUserAttributes() {
        Map<String, String> attributes = Map.of("custom:key", "value");
        cachedUserService.updateUserAttributes("testuser", attributes);

        verify(cognitoService, times(1)).updateUserAttributes("testuser", attributes);
    }

    @Test
    void testInvalidateAllCaches() {
        cachedUserService.invalidateAllCaches();
        // Just verify it doesn't throw anything, since it's an empty method returning void.
    }
}
