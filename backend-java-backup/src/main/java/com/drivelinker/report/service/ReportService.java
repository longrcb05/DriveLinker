package com.drivelinker.report.service;

import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.rental.repository.RentalContractRepository;
import com.drivelinker.report.dto.ReportAnalyticsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final RentalContractRepository rentalContractRepository;
    private final AlertRepository alertRepository;

    @Autowired
    public ReportService(RentalContractRepository rentalContractRepository, AlertRepository alertRepository) {
        this.rentalContractRepository = rentalContractRepository;
        this.alertRepository = alertRepository;
    }

    public ReportAnalyticsResponse getAnalytics(Integer orgId) {
        ReportAnalyticsResponse response = new ReportAnalyticsResponse();

        // 1. Chuyến xe (Trips)
        response.setTotalTrips(rentalContractRepository.countByOrganizationId(orgId));
        response.setOnTimeTrips(rentalContractRepository.countOnTimeContracts(orgId));
        response.setLateTrips(rentalContractRepository.countLateContracts(orgId));

        // 2. Cảnh báo (Alerts)
        long level1 = alertRepository.countByOrganizationIdAndSeverityLevel(orgId, "WARNING");
        long level2 = alertRepository.countByOrganizationIdAndSeverityLevel(orgId, "DANGER");
        long level3 = alertRepository.countByOrganizationIdAndSeverityLevel(orgId, "CRITICAL");
        
        response.setLevel1Alerts(level1);
        response.setLevel2Alerts(level2);
        response.setLevel3Alerts(level3);
        response.setTotalAlerts(level1 + level2 + level3);

        // 3. Hiệu suất xử lý (Resolution)
        response.setResolvedAlerts(alertRepository.countByOrganizationIdAndResolutionStatus(orgId, "RESOLVED"));
        response.setPendingAlerts(alertRepository.countByOrganizationIdAndResolutionStatus(orgId, "NEW") + 
                                  alertRepository.countByOrganizationIdAndResolutionStatus(orgId, "PROCESSING"));

        // 4. Phân loại theo AlertType
        List<Object[]> typeCounts = alertRepository.countAlertsByTypeForOrg(orgId);
        Map<String, Long> distribution = new HashMap<>();
        for (Object[] row : typeCounts) {
            String type = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            distribution.put(type, count);
        }
        response.setAlertTypeDistribution(distribution);

        return response;
    }
}
