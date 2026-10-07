package com.drivelinker.ai.controller;

import com.drivelinker.ai.dto.AiResultRequest;
import com.drivelinker.ai.service.AiResultService;
import com.drivelinker.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot/ai-results")
public class AiResultController {
    private final AiResultService aiResultService;

    public AiResultController(AiResultService aiResultService) {
        this.aiResultService = aiResultService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> receiveAiResult(
            @RequestBody AiResultRequest request,
            Authentication authentication) {

        Integer deviceId = (Integer) authentication.getPrincipal();
        aiResultService.saveAiResult(request, deviceId);

        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận kết quả AI thành công"));
    }
}
