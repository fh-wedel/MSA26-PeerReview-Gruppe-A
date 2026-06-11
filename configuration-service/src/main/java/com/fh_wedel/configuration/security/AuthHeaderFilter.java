package com.fh_wedel.configuration.security;

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
                    null, // credentials not required (trusted API Gateway proxy)
                    authorities
            );

            // Store Cognito Sub / Pool ID as authentication details
            authentication.setDetails(principalId);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authenticated user '{}' with groups [{}], principalId={}",
                    username, groups, principalId);
        }

        filterChain.doFilter(request, response);
    }

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
