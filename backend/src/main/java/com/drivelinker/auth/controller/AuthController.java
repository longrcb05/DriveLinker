package com.drivelinker.auth.controller;

import com.drivelinker.auth.dto.AuthResponse;
import com.drivelinker.auth.dto.LoginRequest;
import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.common.security.JwtService;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;


/**
 * Controller xử lý các API liên quan đến xác thực (Authentication) như Đăng nhập, trả về JWT Token.
 */
@RestController
@RequestMapping("/api/auth")

public class AuthController {
   private AuthenticationManager authenticationManager;
   private JwtService jwtService;
   private UserRepository userRepository;

   @Autowired
   public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserRepository userRepository  ){
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
   }

@PostMapping("/login")
public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request){
    String username = request.getUsername();
    String password = request.getPassword();

    UsernamePasswordAuthenticationToken tokenKiemTra = new UsernamePasswordAuthenticationToken(username, password);
    authenticationManager.authenticate(tokenKiemTra);

    Optional<User> ketquatimkiem = userRepository.findByUsername(username);
    if(ketquatimkiem.isEmpty()){
        throw new RuntimeException("Lỗi: Không tìm thấy User này trong CSDL");
    }

    User user = ketquatimkiem.get();

    String jwtToken = jwtService.generateToken(user);

    String quyenhan = user.getRole().getName();
    Integer maCty = user.getOrganization().getId();

    AuthResponse responseData = new AuthResponse(jwtToken, user.getUsername(), quyenhan, maCty);

    ApiResponse<AuthResponse> ketquacuoicung = ApiResponse.success(responseData);
    return ResponseEntity.ok(ketquacuoicung);
}
    
}
