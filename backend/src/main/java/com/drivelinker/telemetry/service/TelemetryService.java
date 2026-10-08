package com.drivelinker.telemetry.service;

import com.drivelinker.common.websocket.RealtimePublisher;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.telemetry.dto.GpsLogRequest;
import com.drivelinker.telemetry.dto.RealtimeTelemetryEvent;
import com.drivelinker.telemetry.entity.GpsLog;
import com.drivelinker.telemetry.repository.GpsLogRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TelemetryService {

    private final GpsLogRepository gpsLogRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;
    private final RealtimePublisher realtimePublisher; // Tích hợp phát sóng

    public TelemetryService(GpsLogRepository gpsLogRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository, RealtimePublisher realtimePublisher) {
        this.gpsLogRepository = gpsLogRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public void saveGpsLog(GpsLogRequest request, Integer deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();

        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào. Không thể lưu GPS."));

        GpsLog log = new GpsLog();
        log.setEventId(request.getEventId());
        log.setVehicle(vehicle);
        log.setMonitoringSession(activeSession);
        log.setLatitude(request.getLatitude());
        log.setLongitude(request.getLongitude());
        log.setSpeed(request.getSpeed());
        log.setRecordedAt(request.getRecordedAt());

        gpsLogRepository.save(log);

        // --- GỬI REALTIME QUA WEBSOCKET ---
        RealtimeTelemetryEvent event = new RealtimeTelemetryEvent();
        event.setVehicleId(vehicle.getId());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setSpeed(request.getSpeed());
        event.setRecordedAt(request.getRecordedAt());

        realtimePublisher.publishTelemetry(device.getOrganization().getId(), vehicle.getId(), event);
    }
}