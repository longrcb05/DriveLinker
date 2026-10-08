package com.drivelinker.report.controller;

import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import com.drivelinker.report.dto.ReportAnalyticsResponse;
import com.drivelinker.report.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    @Autowired
    public ReportController(ReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_STAFF')")
    public ResponseEntity<ReportAnalyticsResponse> getAnalytics(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Integer orgId = user.getOrganization().getId();
        
        ReportAnalyticsResponse response = reportService.getAnalytics(orgId);
        return ResponseEntity.ok(response);
    }
}
