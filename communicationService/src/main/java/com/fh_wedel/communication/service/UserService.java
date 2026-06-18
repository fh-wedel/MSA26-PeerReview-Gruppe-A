package com.fh_wedel.communication.service;

import com.fh_wedel.communication.model.api.UserDto;
import com.fh_wedel.communication.model.api.UserListResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
public class UserService {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    public UserService(RestTemplate restTemplate,
                       @Value("${aws.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;
    }

    public UserListResponse searchUsers(String query) {
        try {
            String url = userServiceUrl + "/api/users/search";
            if (query != null && !query.isEmpty()) {
                url += "?q=" + query;
            }
            ResponseEntity<UserListResponse> response = restTemplate.getForEntity(url, UserListResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to search users via UserService", e);
        }
        
        UserListResponse empty = new UserListResponse();
        empty.setUsers(List.of());
        return empty;
    }
}
