package com.fh_wedel.configuration.controller;

import com.fh_wedel.configuration.model.CreateConfigurationRequest;
import com.fh_wedel.configuration.model.SubmissionConfiguration;
import com.fh_wedel.configuration.service.ConfigurationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfigurationControllerTest {

    @Mock
    private ConfigurationService configurationService;

    @InjectMocks
    private ConfigurationController controller;

    @Test
    void testExtractSubFromDetails_withPipe() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("\"auth0|12345\"");
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Author"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testExtractSubFromDetails_withoutQuotesAndPipe() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Author"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetPrimaryRole_AdminPriority() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        
        GrantedAuthority authorityAuthor = mock(GrantedAuthority.class);
        when(authorityAuthor.getAuthority()).thenReturn("ROLE_Author");
        GrantedAuthority authorityAdmin = mock(GrantedAuthority.class);
        when(authorityAdmin.getAuthority()).thenReturn("ROLE_Admin");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authorityAuthor, authorityAdmin));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Admin"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetPrimaryRole_NoRolePrefix() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("Teacher");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Teacher"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetPrimaryRole_NullAuth() {
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq(null), eq("Guest"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, null);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetPrimaryRole_NoRoles() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        when(auth.getAuthorities()).thenReturn((Collection) List.of());
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Guest"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetPrimaryRole_OnlyAuthor_NotInList() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("54321"));

        assertThrows(AccessDeniedException.class, () -> {
            controller.createConfiguration(request, auth);
        });
    }

    @Test
    void testGetPrimaryRole_OnlyAuthor_NullSub() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn(null);
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));

        assertThrows(AccessDeniedException.class, () -> {
            controller.createConfiguration(request, auth);
        });
    }

    @Test
    void testExtractSubFromDetails_quotesButNoPipe() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("\"12345\"");
        
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));
        
        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setAuthorIds(List.of("12345"));
        request.setNumberOfExaminers(1);
        
        SubmissionConfiguration mockConfig = new SubmissionConfiguration();
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), anyList(), eq("12345"), eq("Author"), any(), any()))
                .thenReturn(mockConfig);

        ResponseEntity<SubmissionConfiguration> response = controller.createConfiguration(request, auth);
        assertEquals(201, response.getStatusCode().value());
    }

    @Test
    void testGetConfiguration_Found_Admin() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        SubmissionConfiguration config = new SubmissionConfiguration();
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        ResponseEntity<SubmissionConfiguration> response = controller.getConfiguration("sub1", auth);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(config, response.getBody());
    }

    @Test
    void testGetConfiguration_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(configurationService.getConfiguration("sub1")).thenReturn(null);

        ResponseEntity<SubmissionConfiguration> response = controller.getConfiguration("sub1", auth);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetConfiguration_AuthorDenied() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setAuthorIds(List.of("54321"));
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        assertThrows(AccessDeniedException.class, () -> {
            controller.getConfiguration("sub1", auth);
        });
    }

    @Test
    void testGetSubmissionDeadline_Found() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setSubmissionDeadline(java.time.Instant.now());
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        ResponseEntity<java.time.Instant> response = controller.getSubmissionDeadline("sub1", auth);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(config.getSubmissionDeadline(), response.getBody());
    }

    @Test
    void testGetSubmissionDeadline_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(configurationService.getConfiguration("sub1")).thenReturn(null);

        ResponseEntity<java.time.Instant> response = controller.getSubmissionDeadline("sub1", auth);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetReviewDeadline_Found() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        SubmissionConfiguration config = new SubmissionConfiguration();
        config.setReviewDeadline(java.time.Instant.now());
        when(configurationService.getConfiguration("sub1")).thenReturn(config);

        ResponseEntity<java.time.Instant> response = controller.getReviewDeadline("sub1", auth);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(config.getReviewDeadline(), response.getBody());
    }

    @Test
    void testGetReviewDeadline_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(configurationService.getConfiguration("sub1")).thenReturn(null);

        ResponseEntity<java.time.Instant> response = controller.getReviewDeadline("sub1", auth);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetConfigurationsByAuthor_Success() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        List<SubmissionConfiguration> configs = List.of(new SubmissionConfiguration());
        when(configurationService.getConfigurationsByAuthor("12345")).thenReturn(configs);

        ResponseEntity<List<SubmissionConfiguration>> response = controller.getConfigurationsByAuthor("12345", auth);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(configs, response.getBody());
    }

    @Test
    void testGetConfigurationsByAuthor_Denied() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Author");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        assertThrows(AccessDeniedException.class, () -> {
            controller.getConfigurationsByAuthor("54321", auth);
        });
    }

    @Test
    void testListAllConfigurations() {
        List<SubmissionConfiguration> configs = List.of(new SubmissionConfiguration());
        when(configurationService.getAllConfigurations()).thenReturn(configs);

        ResponseEntity<List<SubmissionConfiguration>> response = controller.listAllConfigurations();
        assertEquals(200, response.getStatusCode().value());
        assertEquals(configs, response.getBody());
    }

    @Test
    void testCreateConfiguration_IllegalArgumentException() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn("12345");
        GrantedAuthority authority = mock(GrantedAuthority.class);
        when(authority.getAuthority()).thenReturn("ROLE_Admin");
        when(auth.getAuthorities()).thenReturn((Collection) List.of(authority));

        CreateConfigurationRequest request = new CreateConfigurationRequest();
        request.setTitle("Title");
        request.setNumberOfExaminers(1);
        
        when(configurationService.createConfiguration(any(), any(), any(), anyInt(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Error"));

        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> {
            controller.createConfiguration(request, auth);
        });
    }
}
