package com.drivelinker.common.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cấu hình bảo mật tổng thể của Spring Security, phân quyền các API.
 */
@Configuration

public class SecurityConfig {
    private CustomUserDetailsService userDetailsService;
    private JwtAuthenticationFilter jwtFilter;
    private DeviceAuthenticationFilter deviceFilter;

    @Autowired
    public SecurityConfig(CustomUserDetailsService userDetailsService, JwtAuthenticationFilter jwtFilter,
            DeviceAuthenticationFilter deviceFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtFilter = jwtFilter;
        this.deviceFilter = deviceFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers("/api/auth/login", "/actuator/health", "/api/contracts/**").permitAll();

            // Cho phép thiết bị (có thẻ ROLE_DEVICE) truy cập API IoT
            auth.requestMatchers("/api/iot/**").hasAuthority("ROLE_DEVICE");

            auth.anyRequest().authenticated();
        });

        http.authenticationProvider(authProvider());

        // 3. Đặt bộ lọc Device lên TRƯỚC bộ lọc Username/Password thông thường
        http.addFilterBefore(deviceFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
