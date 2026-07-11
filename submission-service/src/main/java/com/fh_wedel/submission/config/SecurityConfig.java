package com.fh_wedel.submission.config;

import com.fh_wedel.common.security.AuthHeaderFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Import(AuthHeaderFilter.class)
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
                        .requestMatchers("/actuator/**", "/api/submission/status", "/api/submission/time").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(authHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
