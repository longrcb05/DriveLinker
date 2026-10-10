package com.drivelinker.vehicle.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import com.drivelinker.vehicle.dto.VehicleRequest;
import com.drivelinker.vehicle.dto.VehicleResponse;
import com.drivelinker.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller xử lý API quản lý Phương tiện (Xe).
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private VehicleService vehicleService;
    private UserRepository userRepository;

    @Autowired
    public VehicleController(VehicleService vehicleService, UserRepository userRepository) {
        this.vehicleService = vehicleService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(
            @Valid @RequestBody VehicleRequest request,
            Authentication authentication) {

        Integer currentUserId = Integer.parseInt(authentication.getName());
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User"));
        VehicleResponse response = vehicleService.createVehicle(request, currentUser.getOrganization());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAllVehicles(Authentication authentication) {
        Integer currentUserId = Integer.parseInt(authentication.getName());
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User"));
        List<VehicleResponse> list = vehicleService.getAllVehicle(currentUser.getOrganization().getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
