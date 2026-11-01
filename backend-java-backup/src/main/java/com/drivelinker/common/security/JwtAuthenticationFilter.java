package com.drivelinker.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import com.drivelinker.user.repository.UserRepository;
import com.drivelinker.user.entity.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collections;

/**
 * Bộ lọc bảo mật cho Web/App, kiểm tra tính hợp lệ của JWT Token trong mỗi request.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private JwtService jwtService;
    private UserRepository userRepository;

    @Autowired
    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Nếu không có Token, cho request đi tiếp
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);

        try {
            String userIdStr = jwtService.extractUserId(jwt);
            boolean isNotAuthenticated = (SecurityContextHolder.getContext().getAuthentication() == null);

            // Xác thực Token và lưu vào hệ thống
            if (userIdStr != null && isNotAuthenticated) {
                Integer userId = Integer.parseInt(userIdStr);
                User user = userRepository.findById(userId).orElse(null);

                if (user != null && "ACTIVE".equals(user.getStatus())) {
                    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                            user.getId().toString(),
                            user.getPasswordHash(),
                            Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()))
                    );

                    boolean isValid = jwtService.isTokenValid(jwt, userDetails);
                    if (isValid) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

}