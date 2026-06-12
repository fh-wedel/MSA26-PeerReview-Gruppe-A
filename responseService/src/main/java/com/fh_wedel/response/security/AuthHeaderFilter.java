package com.fh_wedel.response.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Extracts identity information from trusted {@code x-auth-*} headers
 * (set by the API Gateway Lambda proxy after JWT validation) and populates
 * the Spring Security context.
 * <p>
 * Headers:
 * <ul>
 *   <li>{@code x-auth-username} — Cognito username</li>
 *   <li>{@code x-auth-groups} — comma-separated Cognito group names</li>
 *   <li>{@code x-auth-principal-id} — Cognito user pool ID + sub</li>
 * </ul>
 */
@Component
@Slf4j
public class AuthHeaderFilter extends OncePerRequestFilter {

    public static final String HEADER_USERNAME = "x-auth-username";
    public static final String HEADER_GROUPS = "x-auth-groups";
    public static final String HEADER_PRINCIPAL_ID = "x-auth-principal-id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String username = request.getHeader(HEADER_USERNAME);
        String groups = request.getHeader(HEADER_GROUPS);
        String principalId = request.getHeader(HEADER_PRINCIPAL_ID);

        if (username != null && !username.isBlank()) {
            List<SimpleGrantedAuthority> authorities = parseAuthorities(groups);

            var authentication = new UsernamePasswordAuthenticationToken(
                    username,
                    null, // no credentials needed — trust the API Gateway
                    authorities
            );

            // Store the principalId (contains the Cognito sub) as authentication details
            authentication.setDetails(principalId);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authenticated user '{}' with groups [{}], principalId={}",
                    username, groups, principalId);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Parses a comma-separated group string into Spring Security authorities.
     * Each group is prefixed with "ROLE_" so it works with {@code hasRole(...)}.
     */
    List<SimpleGrantedAuthority> parseAuthorities(String groups) {
        if (groups == null || groups.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(groups.split(","))
                .map(String::trim)
                .filter(g -> !g.isEmpty())
                .map(g -> new SimpleGrantedAuthority("ROLE_" + g))
                .toList();
    }
}
