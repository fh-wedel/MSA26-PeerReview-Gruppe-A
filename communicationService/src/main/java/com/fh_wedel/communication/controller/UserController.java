package com.fh_wedel.communication.controller;

import com.fh_wedel.communication.api.UsersApi;
import com.fh_wedel.communication.model.api.UserListResponse;
import com.fh_wedel.communication.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController implements UsersApi {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Override
    public ResponseEntity<UserListResponse> searchUsers(String search) {
        return ResponseEntity.ok(userService.searchUsers(search));
    }
}
