package com.fh_wedel.communication.service;

import com.fh_wedel.communication.model.api.UserDto;
import com.fh_wedel.communication.model.api.UserListResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ListUsersResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;

    public UserService(CognitoIdentityProviderClient cognitoClient,
                       @Value("${aws.cognito.user-pool-id}") String userPoolId) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
    }

    public UserListResponse searchUsers(String query) {
        if (userPoolId == null || userPoolId.isEmpty()) {
            UserListResponse empty = new UserListResponse();
            empty.setUsers(List.of());
            return empty;
        }

        ListUsersRequest.Builder requestBuilder = ListUsersRequest.builder()
                .userPoolId(userPoolId)
                .limit(20);

        if (query != null && !query.isEmpty()) {
            requestBuilder.filter("username ^= \"" + query + "\"");
        }

        ListUsersResponse response = cognitoClient.listUsers(requestBuilder.build());

        List<UserDto> users = response.users().stream()
                .map(u -> {
                    String sub = u.attributes().stream()
                            .filter(a -> "sub".equals(a.name()))
                            .findFirst()
                            .map(a -> a.value())
                            .orElse(u.username());
                    UserDto dto = new UserDto();
                    dto.setSub(sub);
                    dto.setUsername(u.username());
                    return dto;
                })
                .collect(Collectors.toList());

        UserListResponse userListResponse = new UserListResponse();
        userListResponse.setUsers(users);
        return userListResponse;
    }
}
