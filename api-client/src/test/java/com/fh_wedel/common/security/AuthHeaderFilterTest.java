package com.fh_wedel.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuthHeaderFilterTest {

    private AuthHeaderFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthHeaderFilter();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should populate SecurityContext from x-auth headers")
    void doFilter_withHeaders_populatesContext() throws Exception {
        // Given
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getHeader("x-auth-username")).thenReturn("testuser");
        when(request.getHeader("x-auth-groups")).thenReturn("Admin,Reviewer");
        when(request.getHeader("x-auth-principal-id")).thenReturn("pool123|sub-uuid");

        // When
        filter.doFilterInternal(request, response, chain);

        // Then
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("testuser");
        assertThat(auth.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_Admin", "ROLE_Reviewer");
        assertThat(auth.getDetails()).isEqualTo("pool123|sub-uuid");

        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should leave SecurityContext empty when no auth headers are present")
    void doFilter_withoutHeaders_noAuthentication() throws Exception {
        // Given
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getHeader("x-auth-username")).thenReturn(null);
        when(request.getHeader("x-auth-groups")).thenReturn(null);
        when(request.getHeader("x-auth-principal-id")).thenReturn(null);

        // When
        filter.doFilterInternal(request, response, chain);

        // Then
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();

        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should handle blank username header")
    void doFilter_withBlankUsername_noAuthentication() throws Exception {
        // Given
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getHeader("x-auth-username")).thenReturn("   ");
        when(request.getHeader("x-auth-groups")).thenReturn("Admin");

        // When
        filter.doFilterInternal(request, response, chain);

        // Then: blank username = not authenticated
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    @DisplayName("Should handle missing groups header gracefully")
    void doFilter_withUsernameButNoGroups_authenticatedWithNoRoles() throws Exception {
        // Given
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getHeader("x-auth-username")).thenReturn("testuser");
        when(request.getHeader("x-auth-groups")).thenReturn(null);

        // When
        filter.doFilterInternal(request, response, chain);

        // Then: authenticated but with no roles
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("testuser");
        assertThat(auth.getAuthorities()).isEmpty();
    }

    @Test
    @DisplayName("Should parse group authorities correctly")
    void parseAuthorities_multipleGroups() {
        List<SimpleGrantedAuthority> authorities = filter.parseAuthorities("Admin, Reviewer, Teacher");

        assertThat(authorities)
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_Admin", "ROLE_Reviewer", "ROLE_Teacher");
    }

    @Test
    @DisplayName("Should return empty list for null/blank groups")
    void parseAuthorities_nullOrBlank() {
        assertThat(filter.parseAuthorities(null)).isEmpty();
        assertThat(filter.parseAuthorities("")).isEmpty();
        assertThat(filter.parseAuthorities("   ")).isEmpty();
    }
}
