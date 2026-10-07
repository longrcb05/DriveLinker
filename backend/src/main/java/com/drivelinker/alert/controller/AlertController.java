package com.drivelinker.alert.controller;

import com.drivelinker.alert.dto.AlertRequest;
import com.drivelinker.alert.service.AlertService;
import com.drivelinker.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot/alerts")
public class AlertController {
    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> receiveAlert(
            @RequestBody AlertRequest request,
            Authentication authentication) {

        Integer deviceId = (Integer) authentication.getPrincipal();
        alertService.saveAlert(request, deviceId);

        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận Cảnh báo thành công"));
    }
}
