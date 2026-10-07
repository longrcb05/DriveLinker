package com.drivelinker.alert.service;

import com.drivelinker.alert.dto.AlertRequest;
import com.drivelinker.alert.entity.Alert;
import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AlertService {
    private final AlertRepository alertRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;

    public AlertService(AlertRepository alertRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository) {
        this.alertRepository = alertRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public void saveAlert(AlertRequest request, Integer deviceId) {
        if (alertRepository.existsByEventId(request.getEventId())) {
            return;
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();
        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào"));

        Alert alert = new Alert();
        alert.setEventId(request.getEventId());
        alert.setOrganization(device.getOrganization());
        alert.setVehicle(vehicle);
        alert.setMonitoringSession(activeSession);
        alert.setAlertType(request.getAlertType());
        alert.setSeverityLevel(request.getSeverityLevel());
        alert.setDrowsinessScore(request.getDrowsinessScore());
        alert.setLatitude(request.getLatitude());
        alert.setLongitude(request.getLongitude());
        alert.setOccurredAt(request.getOccurredAt());

        alertRepository.save(alert);
    }
}
