package com.fh_wedel.user.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CognitoServiceTest {

    @Mock
    private CognitoIdentityProviderClient cognitoClient;

    private CognitoService cognitoService;

    private static final String USER_POOL_ID = "us-east-1_xxxxx";

    @BeforeEach
    void setUp() {
        cognitoService = new CognitoService(cognitoClient, USER_POOL_ID);
    }

    @Test
    void testSearchUsers_withEmptyUserPoolId() {
        CognitoService emptyPoolService = new CognitoService(cognitoClient, "");
        List<UserType> users = emptyPoolService.searchUsers("prefix");
        assertTrue(users.isEmpty());
        verifyNoInteractions(cognitoClient);
    }

    @Test
    void testSearchUsers_withNullUserPoolId() {
        CognitoService nullPoolService = new CognitoService(cognitoClient, null);
        List<UserType> users = nullPoolService.searchUsers("prefix");
        assertTrue(users.isEmpty());
        verifyNoInteractions(cognitoClient);
    }

    @Test
    void testSearchUsers_withEmptyPrefix() {
        ListUsersResponse response = ListUsersResponse.builder()
                .users(UserType.builder().username("test1").build())
                .build();
        when(cognitoClient.listUsers(any(ListUsersRequest.class))).thenReturn(response);

        List<UserType> users = cognitoService.searchUsers("");

        assertEquals(1, users.size());
        assertEquals("test1", users.get(0).username());

        ArgumentCaptor<ListUsersRequest> requestCaptor = ArgumentCaptor.forClass(ListUsersRequest.class);
        verify(cognitoClient).listUsers(requestCaptor.capture());
        assertNull(requestCaptor.getValue().filter());
    }

    @Test
    void testSearchUsers_withPrefix() {
        ListUsersResponse response = ListUsersResponse.builder()
                .users(UserType.builder().username("prefixTest").build())
                .build();
        when(cognitoClient.listUsers(any(ListUsersRequest.class))).thenReturn(response);

        List<UserType> users = cognitoService.searchUsers("pref");

        assertEquals(1, users.size());

        ArgumentCaptor<ListUsersRequest> requestCaptor = ArgumentCaptor.forClass(ListUsersRequest.class);
        verify(cognitoClient).listUsers(requestCaptor.capture());
        assertEquals("username ^= \"pref\"", requestCaptor.getValue().filter());
    }

    @Test
    void testGetUserBySub_found() {
        UserType user = UserType.builder().username("testuser").build();
        ListUsersResponse response = ListUsersResponse.builder()
                .users(user)
                .build();
        when(cognitoClient.listUsers(any(ListUsersRequest.class))).thenReturn(response);

        UserType result = cognitoService.getUserBySub("123-abc");

        assertEquals("testuser", result.username());
        ArgumentCaptor<ListUsersRequest> requestCaptor = ArgumentCaptor.forClass(ListUsersRequest.class);
        verify(cognitoClient).listUsers(requestCaptor.capture());
        assertEquals("sub = \"123-abc\"", requestCaptor.getValue().filter());
        assertEquals(1, requestCaptor.getValue().limit());
    }

    @Test
    void testGetUserBySub_notFound() {
        ListUsersResponse response = ListUsersResponse.builder()
                .users(List.of())
                .build();
        when(cognitoClient.listUsers(any(ListUsersRequest.class))).thenReturn(response);

        UserNotFoundException exception = assertThrows(UserNotFoundException.class, () -> cognitoService.getUserBySub("123-abc"));
        assertEquals("User with sub 123-abc not found", exception.getMessage());
    }

    @Test
    void testGetUserByUsername() {
        AdminGetUserResponse response = AdminGetUserResponse.builder().username("testuser").build();
        when(cognitoClient.adminGetUser(any(AdminGetUserRequest.class))).thenReturn(response);

        AdminGetUserResponse result = cognitoService.getUserByUsername("testuser");

        assertEquals("testuser", result.username());
        ArgumentCaptor<AdminGetUserRequest> requestCaptor = ArgumentCaptor.forClass(AdminGetUserRequest.class);
        verify(cognitoClient).adminGetUser(requestCaptor.capture());
        assertEquals("testuser", requestCaptor.getValue().username());
    }

    @Test
    void testListGroupMembers_withPagination() {
        ListUsersInGroupResponse response1 = ListUsersInGroupResponse.builder()
                .users(UserType.builder().username("user1").build())
                .nextToken("token")
                .build();
        ListUsersInGroupResponse response2 = ListUsersInGroupResponse.builder()
                .users(UserType.builder().username("user2").build())
                .nextToken(null)
                .build();

        when(cognitoClient.listUsersInGroup(any(ListUsersInGroupRequest.class)))
                .thenReturn(response1)
                .thenReturn(response2);

        List<UserType> users = cognitoService.listGroupMembers("GroupA");

        assertEquals(2, users.size());
        assertEquals("user1", users.get(0).username());
        assertEquals("user2", users.get(1).username());

        verify(cognitoClient, times(2)).listUsersInGroup(any(ListUsersInGroupRequest.class));
    }

    @Test
    void testGetUserGroups() {
        AdminListGroupsForUserResponse response = AdminListGroupsForUserResponse.builder()
                .groups(GroupType.builder().groupName("Admin").build(), GroupType.builder().groupName("Reviewer").build())
                .build();

        when(cognitoClient.adminListGroupsForUser(any(AdminListGroupsForUserRequest.class))).thenReturn(response);

        List<String> groups = cognitoService.getUserGroups("testuser");

        assertEquals(2, groups.size());
        assertTrue(groups.contains("Admin"));
        assertTrue(groups.contains("Reviewer"));
    }

    @Test
    void testAddUserToGroup_noCustomAttrs() {
        cognitoService.addUserToGroup("testuser", "Admin", null);

        verify(cognitoClient).adminAddUserToGroup(any(AdminAddUserToGroupRequest.class));
        verify(cognitoClient, never()).adminUpdateUserAttributes(any(AdminUpdateUserAttributesRequest.class));
    }

    @Test
    void testAddUserToGroup_withCustomAttrs() {
        Map<String, String> attrs = new HashMap<>();
        attrs.put("custom:department", "IT");

        cognitoService.addUserToGroup("testuser", "Admin", attrs);

        verify(cognitoClient).adminAddUserToGroup(any(AdminAddUserToGroupRequest.class));
        
        ArgumentCaptor<AdminUpdateUserAttributesRequest> requestCaptor = ArgumentCaptor.forClass(AdminUpdateUserAttributesRequest.class);
        verify(cognitoClient).adminUpdateUserAttributes(requestCaptor.capture());
        
        assertEquals(1, requestCaptor.getValue().userAttributes().size());
        assertEquals("custom:department", requestCaptor.getValue().userAttributes().get(0).name());
        assertEquals("IT", requestCaptor.getValue().userAttributes().get(0).value());
    }

    @Test
    void testAddUserToGroup_reviewerSpecialCase() {
        cognitoService.addUserToGroup("testuser", "Reviewer", new HashMap<>());

        verify(cognitoClient).adminAddUserToGroup(any(AdminAddUserToGroupRequest.class));
        
        ArgumentCaptor<AdminUpdateUserAttributesRequest> requestCaptor = ArgumentCaptor.forClass(AdminUpdateUserAttributesRequest.class);
        verify(cognitoClient).adminUpdateUserAttributes(requestCaptor.capture());
        
        assertEquals(1, requestCaptor.getValue().userAttributes().size());
        assertEquals("custom:isActive", requestCaptor.getValue().userAttributes().get(0).name());
        assertEquals("true", requestCaptor.getValue().userAttributes().get(0).value());
    }
    
    @Test
    void testAddUserToGroup_reviewerSpecialCase_alreadyHasIsActive() {
        Map<String, String> attrs = new HashMap<>();
        attrs.put("isActive", "false");
        cognitoService.addUserToGroup("testuser", "Reviewer", attrs);

        ArgumentCaptor<AdminUpdateUserAttributesRequest> requestCaptor = ArgumentCaptor.forClass(AdminUpdateUserAttributesRequest.class);
        verify(cognitoClient).adminUpdateUserAttributes(requestCaptor.capture());
        
        assertEquals(1, requestCaptor.getValue().userAttributes().size());
        assertEquals("custom:isActive", requestCaptor.getValue().userAttributes().get(0).name());
        assertEquals("false", requestCaptor.getValue().userAttributes().get(0).value());
    }

    @Test
    void testRemoveUserFromGroup() {
        cognitoService.removeUserFromGroup("testuser", "Admin");
        verify(cognitoClient).adminRemoveUserFromGroup(any(AdminRemoveUserFromGroupRequest.class));
    }

    @Test
    void testUpdateUserAttributes() {
        Map<String, String> attrs = new HashMap<>();
        attrs.put("custom:role", "manager");
        attrs.put("department", "HR"); // missing custom prefix

        cognitoService.updateUserAttributes("testuser", attrs);

        ArgumentCaptor<AdminUpdateUserAttributesRequest> requestCaptor = ArgumentCaptor.forClass(AdminUpdateUserAttributesRequest.class);
        verify(cognitoClient).adminUpdateUserAttributes(requestCaptor.capture());

        List<AttributeType> updatedAttrs = requestCaptor.getValue().userAttributes();
        assertEquals(2, updatedAttrs.size());
        assertTrue(updatedAttrs.stream().anyMatch(a -> a.name().equals("custom:role") && a.value().equals("manager")));
        assertTrue(updatedAttrs.stream().anyMatch(a -> a.name().equals("custom:department") && a.value().equals("HR")));
    }

    @Test
    void testUtilityExtractors() {
        List<AttributeType> attrs = List.of(
                AttributeType.builder().name("sub").value("123-sub").build(),
                AttributeType.builder().name("email").value("test@test.com").build(),
                AttributeType.builder().name("custom:role").value("Admin").build()
        );

        UserType user = UserType.builder().attributes(attrs).build();
        AdminGetUserResponse adminUser = AdminGetUserResponse.builder().userAttributes(attrs).build();

        assertEquals("123-sub", CognitoService.extractSub(user));
        assertEquals("123-sub", CognitoService.extractSub(adminUser));
        assertEquals("test@test.com", CognitoService.extractEmail(user));
        assertEquals("test@test.com", CognitoService.extractEmail(adminUser));
        
        assertNull(CognitoService.extractSub(UserType.builder().build()));
        assertNull(CognitoService.extractEmail(AdminGetUserResponse.builder().build()));
        assertNull(CognitoService.extractAttribute(null, "key"));

        Map<String, String> customAttrs = CognitoService.extractCustomAttributes(attrs);
        assertEquals(1, customAttrs.size());
        assertEquals("Admin", customAttrs.get("role"));
        
        Map<String, String> emptyCustomAttrs = CognitoService.extractCustomAttributes(null);
        assertTrue(emptyCustomAttrs.isEmpty());
    }
}
