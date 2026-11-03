package com.drivelinker.customer.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.customer.dto.CustomerRequest;
import com.drivelinker.customer.dto.CustomerResponse;
import com.drivelinker.customer.service.CustomerService;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller xử lý các API quản lý thông tin Khách hàng.
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private CustomerService customerService;
    private UserRepository userRepository;

    @Autowired
    public CustomerController(CustomerService customerService, UserRepository userRepository) {
        this.customerService = customerService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerRequest request,
            Authentication authentication) {
        Integer currentUserId = Integer.parseInt(authentication.getName());
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay User"));

        CustomerResponse response = customerService.createCustomer(request, currentUser.getOrganization());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getAllCustomer(Authentication authentication) {
        Integer currentUserId = Integer.parseInt(authentication.getName());
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay User"));
        List<CustomerResponse> list = customerService.getAllCustomer(currentUser.getOrganization().getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
