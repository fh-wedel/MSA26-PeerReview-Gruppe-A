package com.fh_wedel.user.controller;

import com.fh_wedel.user.model.api.*;
import com.fh_wedel.user.service.CachedUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserType;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @Mock
    private CachedUserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSearchUsers() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        UserType user = UserType.builder().username("testuser").attributes(subAttr).build();
        when(userService.searchUsers("test")).thenReturn(Collections.singletonList(user));

        ResponseEntity<UserSearchResponse> response = userController.searchUsers("test");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getUsers().size());
        assertEquals("sub-123", response.getBody().getUsers().get(0).getSub());
        assertEquals("testuser", response.getBody().getUsers().get(0).getUsername());
    }

    @Test
    void testGetUserBySub() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        UserType user = UserType.builder().username("testuser").attributes(subAttr).build();
        when(userService.getUserBySub("sub-123")).thenReturn(user);

        ResponseEntity<UserSummary> response = userController.getUserBySub("sub-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("sub-123", response.getBody().getSub());
        assertEquals("testuser", response.getBody().getUsername());
    }

    @Test
    void testBulkResolveUsers() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        UserType user = UserType.builder().username("testuser").attributes(subAttr).build();
        when(userService.getUserBySub("sub-123")).thenReturn(user);
        when(userService.getUserBySub("sub-456")).thenThrow(UserNotFoundException.builder().message("not found").build());

        BulkResolveRequest request = new BulkResolveRequest();
        request.setSubs(List.of("sub-123", "sub-456"));

        ResponseEntity<BulkResolveResponse> response = userController.bulkResolveUsers(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getUsers().size());
        assertEquals("testuser", response.getBody().getUsers().get("sub-123"));
    }

    @Test
    void testListGroupMembers() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        UserType user = UserType.builder().username("testuser").attributes(subAttr).build();
        when(userService.listGroupMembers("Admin")).thenReturn(Collections.singletonList(user));

        ResponseEntity<UserProfileListResponse> response = userController.listGroupMembers("Admin");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getUsers().size());
        assertEquals("testuser", response.getBody().getUsers().get(0).getUsername());
    }

    @Test
    void testAddGroupMember() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        AdminGetUserResponse user = AdminGetUserResponse.builder().username("testuser").userAttributes(subAttr).build();
        
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(userService.getUserGroups("testuser")).thenReturn(Collections.singletonList("Admin"));

        AddGroupMemberRequest request = new AddGroupMemberRequest();
        request.setUsername("testuser");
        request.setCustomAttributes(Map.of("custom:key", "value"));

        ResponseEntity<UserProfile> response = userController.addGroupMember("Admin", request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("testuser", response.getBody().getUsername());
        verify(userService, times(1)).addUserToGroup("testuser", "Admin", request.getCustomAttributes());
    }

    @Test
    void testRemoveGroupMember() {
        when(userService.getUserGroups("testuser")).thenReturn(Collections.singletonList("Admin"));

        ResponseEntity<Void> response = userController.removeGroupMember("Admin", "testuser");

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userService, times(1)).removeUserFromGroup("testuser", "Admin");
    }

    @Test
    void testRemoveGroupMemberNotInGroup() {
        when(userService.getUserGroups("testuser")).thenReturn(Collections.emptyList());

        assertThrows(UserNotFoundException.class, () -> {
            userController.removeGroupMember("Admin", "testuser");
        });
    }

    @Test
    void testGetUserDetails() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        AdminGetUserResponse user = AdminGetUserResponse.builder().username("testuser").userAttributes(subAttr).build();
        
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(userService.getUserGroups("testuser")).thenReturn(Collections.singletonList("Admin"));

        ResponseEntity<UserProfile> response = userController.getUserDetails("testuser");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("testuser", response.getBody().getUsername());
    }

    @Test
    void testUpdateUserAttributes() {
        AttributeType subAttr = AttributeType.builder().name("sub").value("sub-123").build();
        AdminGetUserResponse user = AdminGetUserResponse.builder().username("testuser").userAttributes(subAttr).build();
        
        when(userService.getUserGroups("testuser")).thenReturn(Collections.singletonList("Admin"));
        when(userService.getUserByUsername("testuser")).thenReturn(user);

        UpdateAttributesRequest request = new UpdateAttributesRequest();
        request.setCustomAttributes(Map.of("custom:key", "value"));

        ResponseEntity<UserProfile> response = userController.updateUserAttributes("Admin", "testuser", request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("testuser", response.getBody().getUsername());
        verify(userService, times(1)).updateUserAttributes("testuser", request.getCustomAttributes());
    }
}
