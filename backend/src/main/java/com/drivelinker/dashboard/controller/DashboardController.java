package com.drivelinker.dashboard.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.dashboard.dto.DashboardSummaryResponse;
import com.drivelinker.dashboard.dto.JourneyPointDto;
import com.drivelinker.dashboard.service.DashboardService;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    public DashboardController(DashboardService dashboardService, UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    // API 1: Lấy thông số tổng quan
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(Authentication auth) {
        // Tìm ra OrganizationID của Admin đang đăng nhập
        Integer currentUserId = Integer.parseInt(auth.getName());
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User"));

        DashboardSummaryResponse summary = dashboardService.getSummary(user.getOrganization().getId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // API 2: Lấy lịch sử hành trình vẽ bản đồ
    @GetMapping("/vehicles/{id}/journey")
    public ResponseEntity<ApiResponse<List<JourneyPointDto>>> getJourney(
            @PathVariable("id") Integer vehicleId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        List<JourneyPointDto> journey = dashboardService.getVehicleJourney(vehicleId, from, to);
        return ResponseEntity.ok(ApiResponse.success(journey));
    }
}