package com.drivelinker.customer.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.customer.dto.CustomerRequest;
import com.drivelinker.customer.dto.CustomerResponse;
import com.drivelinker.customer.service.CustomerService;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@RequestBody CustomerRequest request,
            Authentication authentication) {
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Khong tim thay User"));

        CustomerResponse response = customerService.createCustomer(request, currentUser.getOrganization());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getAllCustomer() {
        List<CustomerResponse> list = customerService.getAllCustomer();
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
