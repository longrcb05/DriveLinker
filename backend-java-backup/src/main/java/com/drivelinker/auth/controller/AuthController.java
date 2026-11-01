package com.drivelinker.auth.controller;

import com.drivelinker.auth.dto.AuthResponse;
import com.drivelinker.auth.dto.LoginRequest;
import com.drivelinker.auth.dto.UserMeResponse;
import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.common.security.JwtService;
import com.drivelinker.organization.entity.Organization;
import com.drivelinker.organization.repository.OrganizationRepository;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các API liên quan đến xác thực (Authentication) như Đăng nhập, trả về JWT Token và thông tin User hiện tại.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService,
                          UserRepository userRepository, OrganizationRepository organizationRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        String companyCode = request.getCompanyCode();
        String username = request.getUsername();
        String password = request.getPassword();

        Organization org = organizationRepository.findByCompanyCode(companyCode)
                .orElseThrow(() -> new RuntimeException("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."));

        if (!"ACTIVE".equals(org.getStatus())) {
            throw new RuntimeException("Tổ chức đã bị vô hiệu hóa.");
        }

        String compositeUsername = org.getId() + ":" + username;

        UsernamePasswordAuthenticationToken tokenKiemTra = new UsernamePasswordAuthenticationToken(compositeUsername, password);
        authenticationManager.authenticate(tokenKiemTra);

        User user = userRepository.findByOrganizationIdAndUsername(org.getId(), username)
                .orElseThrow(() -> new RuntimeException("Đăng nhập thất bại."));

        String jwtToken = jwtService.generateToken(user);

        String quyenhan = user.getRole().getName();
        Integer maCty = user.getOrganization().getId();

        AuthResponse responseData = new AuthResponse(jwtToken, user.getUsername(), quyenhan, maCty);

        ApiResponse<AuthResponse> ketquacuoicung = ApiResponse.success(responseData);
        return ResponseEntity.ok(ketquacuoicung);
    }

    /**
     * API lấy thông tin người dùng đang đăng nhập dựa trên JWT token được gửi kèm.
     * Endpoint: GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> getMyProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Chưa xác thực người dùng.");
        }

        Integer currentUserId = Integer.parseInt(authentication.getName());
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng."));

        UserMeResponse responseData = new UserMeResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),
                user.getOrganization().getId(),
                user.getOrganization().getCompanyCode(),
                user.getOrganization().getName(),
                user.getStatus()
        );

        return ResponseEntity.ok(ApiResponse.success(responseData));
    }
}
