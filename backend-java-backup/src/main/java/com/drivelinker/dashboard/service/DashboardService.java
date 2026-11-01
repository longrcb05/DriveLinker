package com.drivelinker.dashboard.service;

import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.dashboard.dto.DashboardSummaryResponse;
import com.drivelinker.dashboard.dto.JourneyPointDto;
import com.drivelinker.rental.repository.RentalContractRepository;
import com.drivelinker.telemetry.repository.GpsLogRepository;
import com.drivelinker.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final VehicleRepository vehicleRepository;
    private final RentalContractRepository contractRepository;
    private final AlertRepository alertRepository;
    private final GpsLogRepository gpsLogRepository;

    public DashboardService(VehicleRepository vehicleRepository, RentalContractRepository contractRepository,
            AlertRepository alertRepository, GpsLogRepository gpsLogRepository) {
        this.vehicleRepository = vehicleRepository;
        this.contractRepository = contractRepository;
        this.alertRepository = alertRepository;
        this.gpsLogRepository = gpsLogRepository;
    }

    public DashboardSummaryResponse getSummary(Integer orgId) {
        DashboardSummaryResponse res = new DashboardSummaryResponse();
        res.setTotalVehicles(vehicleRepository.countByOrganizationId(orgId));
        res.setAvailableVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "AVAILABLE"));
        res.setRentedVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "RENTED"));
        res.setMaintenanceVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "MAINTENANCE"));

        // Trạng thái hợp đồng đang ACTIVE và Cảnh báo đang là NEW (Chưa xử lý)
        res.setActiveContracts(contractRepository.countByOrganizationIdAndStatus(orgId, "ACTIVE"));
        res.setActiveAlerts(alertRepository.countByOrganizationIdAndResolutionStatus(orgId, "NEW"));

        return res;
    }

    public List<JourneyPointDto> getVehicleJourney(Integer vehicleId, LocalDateTime from, LocalDateTime to) {
        return gpsLogRepository.findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtAsc(vehicleId, from, to)
                .stream().map(log -> {
                    JourneyPointDto point = new JourneyPointDto();
                    point.setLatitude(log.getLatitude());
                    point.setLongitude(log.getLongitude());
                    point.setSpeed(log.getSpeed());
                    point.setRecordedAt(log.getRecordedAt());
                    return point;
                }).collect(Collectors.toList());
    }
}