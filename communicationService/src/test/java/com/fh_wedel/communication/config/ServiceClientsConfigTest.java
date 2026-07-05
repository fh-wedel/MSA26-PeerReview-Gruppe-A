package com.fh_wedel.communication.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.URI;
import java.net.http.HttpRequest;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

class ServiceClientsConfigTest {

    private ServiceClientsConfig config;

    @BeforeEach
    void setUp() {
        config = new ServiceClientsConfig();
        ReflectionTestUtils.setField(config, "matchingServiceUrl", "http://matching");
        ReflectionTestUtils.setField(config, "configurationServiceUrl", "http://configuration");
        ReflectionTestUtils.setField(config, "userServiceUrl", "http://user");
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void testMatchingApiClient() {
        com.fh_wedel.matching.client.ApiClient client = config.matchingApiClient();
        assertNotNull(client);
        assertEquals("http://matching/api/matching", client.getBaseUri());
    }

    @Test
    void testMatchingMatchesApi() {
        com.fh_wedel.matching.client.api.MatchesApi api = config.matchingMatchesApi(config.matchingApiClient());
        assertNotNull(api);
    }

    @Test
    void testConfigurationApiClient() {
        com.fh_wedel.configuration.client.ApiClient client = config.configurationApiClient();
        assertNotNull(client);
        assertEquals("http://configuration/api/configuration", client.getBaseUri());
    }

    @Test
    void testConfigurationRulesApi() {
        com.fh_wedel.configuration.client.api.SubmissionRulesApi api = config.configurationRulesApi(config.configurationApiClient());
        assertNotNull(api);
    }

    @Test
    void testUserApiClient() {
        com.fh_wedel.user.client.ApiClient client = config.userApiClient();
        assertNotNull(client);
        assertEquals("http://user/api/users", client.getBaseUri());
    }

    @Test
    void testUsersApi() {
        com.fh_wedel.user.client.api.UsersApi api = config.usersApi(config.userApiClient());
        assertNotNull(api);
    }

    @Test
    void testAuthInterceptor() {
        MockHttpServletRequest mockRequest = new MockHttpServletRequest();
        mockRequest.addHeader("x-auth-username", "testUser");
        mockRequest.addHeader("x-auth-groups", "group1");
        mockRequest.addHeader("x-auth-principal-id", "id1");
        mockRequest.addHeader("Authorization", "Bearer token");

        ServletRequestAttributes attributes = new ServletRequestAttributes(mockRequest);
        RequestContextHolder.setRequestAttributes(attributes);

        Consumer<HttpRequest.Builder> interceptor = ReflectionTestUtils.invokeMethod(config, "createAuthInterceptor");
        assertNotNull(interceptor);

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost"));
        interceptor.accept(builder);
        
        HttpRequest request = builder.build();
        assertEquals("testUser", request.headers().firstValue("x-auth-username").orElse(null));
        assertEquals("group1", request.headers().firstValue("x-auth-groups").orElse(null));
        assertEquals("id1", request.headers().firstValue("x-auth-principal-id").orElse(null));
        assertEquals("Bearer token", request.headers().firstValue("Authorization").orElse(null));
    }
}
