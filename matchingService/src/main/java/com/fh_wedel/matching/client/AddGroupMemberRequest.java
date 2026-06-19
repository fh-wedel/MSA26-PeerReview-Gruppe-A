package com.fh_wedel.matching.client;

import lombok.Data;
import java.util.Map;

@Data
public class AddGroupMemberRequest {
    private String username;
    private Map<String, String> customAttributes;
}
