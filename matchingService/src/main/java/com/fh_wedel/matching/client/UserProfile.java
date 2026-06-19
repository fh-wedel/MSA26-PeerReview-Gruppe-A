package com.fh_wedel.matching.client;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class UserProfile {
    private String sub;
    private String username;
    private String email;
    private Boolean enabled;
    private String status;
    private String createdAt;
    private List<String> groups;
    private Map<String, String> customAttributes;
}
