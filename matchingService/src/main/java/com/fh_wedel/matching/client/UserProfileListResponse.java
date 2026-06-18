package com.fh_wedel.matching.client;

import lombok.Data;
import java.util.List;

@Data
public class UserProfileListResponse {
    private List<UserProfile> users;
}
