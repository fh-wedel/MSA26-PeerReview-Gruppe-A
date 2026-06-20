package com.fh_wedel.response.config;

import com.fh_wedel.response.security.AuthHeaderFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration.
 * <p>
 * The API Gateway + Verified Permissions handle coarse-grained authorization.
 * This config adds fine-grained method-level security via {@code @PreAuthorize}
 * by populating the SecurityContext from trusted {@code x-auth-*} headers.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AuthHeaderFilter authHeaderFilter;

    public SecurityConfig(AuthHeaderFilter authHeaderFilter) {
        this.authHeaderFilter = authHeaderFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Health check endpoints are public
                        .requestMatchers("/actuator/**").permitAll()
                        // All other endpoints require authentication (populated by AuthHeaderFilter)
                        .anyRequest().authenticated()
                )
                .addFilterBefore(authHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
