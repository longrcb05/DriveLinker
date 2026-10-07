package com.drivelinker.telemetry.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.telemetry.dto.GpsLogRequest;
import com.drivelinker.telemetry.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> receiveGpsData(
            @RequestBody GpsLogRequest request,
            Authentication authentication) {

        // Lấy DeviceID đã được màng lọc (Filter) bóc tách ra và lưu vào Context
        Integer deviceId = (Integer) authentication.getPrincipal();

        telemetryService.saveGpsLog(request, deviceId);

        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận GPS thành công"));
    }
}