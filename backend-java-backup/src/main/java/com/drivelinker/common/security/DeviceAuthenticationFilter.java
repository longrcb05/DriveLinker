package com.drivelinker.common.security;

import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class DeviceAuthenticationFilter extends OncePerRequestFilter {

    private final DeviceRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;

    public DeviceAuthenticationFilter(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
        this.passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        // Chỉ màng lọc này chặn các API bắt đầu bằng /api/iot/
        if (!path.startsWith("/api/iot/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String deviceCode = request.getHeader("X-Device-Code");
        String deviceToken = request.getHeader("X-Device-Token");

        if (deviceCode == null || deviceToken == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Thieu Header X-Device-Code hoac X-Device-Token");
            return;
        }

        Device device = deviceRepository.findByDeviceCode(deviceCode).orElse(null);
        if (device == null || !"ACTIVE".equals(device.getStatus())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Thiet bi khong ton tai hoac bi khoa");
            return;
        }

        // Kiểm tra mã băm của Token
        if (!passwordEncoder.matches(deviceToken, device.getSecretHash())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token thiet bi khong hop le");
            return;
        }

        if (device.getVehicle() == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Thiet bi chua duoc gan vao phuong tien nao");
            return;
        }

        // Xác thực thành công -> Lưu ID của Device vào Context
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                device.getId(), null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_DEVICE")));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}