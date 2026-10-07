package com.drivelinker.rental.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.rental.dto.RentalContractRequest;
import com.drivelinker.rental.dto.RentalContractResponse;
import com.drivelinker.rental.service.RentalContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các API quản lý Hợp đồng thuê xe và bàn giao xe.
 */
@RestController
@RequestMapping("/api/contracts")
public class RentalContractController {

    private final RentalContractService contractService;

    public RentalContractController(RentalContractService contractService) {
        this.contractService = contractService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RentalContractResponse>> createContract(
            @RequestBody RentalContractRequest request) {
        // Tạm thời hardcode staffId = 1 (sau này sẽ lấy từ Security Context
        // JwtAuthenticationFilter)
        Integer staffId = 1;
        RentalContractResponse response = contractService.createContract(request, staffId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmContract(@PathVariable Integer id) {
        contractService.confirmContract(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/handover")
    public ResponseEntity<ApiResponse<Void>> handoverVehicle(@PathVariable Integer id) {
        contractService.handoverVehicle(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<Void>> returnVehicle(@PathVariable Integer id) {
        contractService.returnVehicle(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
