package com.drivelinker.report.controller;

import com.drivelinker.common.security.CustomUserDetails;
import com.drivelinker.report.dto.ReportAnalyticsResponse;
import com.drivelinker.report.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    @Autowired
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_STAFF')")
    public ResponseEntity<ReportAnalyticsResponse> getAnalytics(@AuthenticationPrincipal CustomUserDetails currentUser) {
        Integer orgId = currentUser.getOrganizationId();
        ReportAnalyticsResponse response = reportService.getAnalytics(orgId);
        return ResponseEntity.ok(response);
    }
}
