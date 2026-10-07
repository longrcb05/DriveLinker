package com.drivelinker.telemetry.service;

import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.telemetry.dto.GpsLogRequest;
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

    public TelemetryService(GpsLogRepository gpsLogRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository) {
        this.gpsLogRepository = gpsLogRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public void saveGpsLog(GpsLogRequest request, Integer deviceId) {
        // Kiểm tra tránh lưu trùng (phòng khi mất mạng gửi lại dữ liệu cũ)
        if (gpsLogRepository.existsByEventId(request.getEventId())) {
            return;
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();

        // Tìm Phiên giám sát đang ACTIVE của chiếc xe này
        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào"));

        GpsLog log = new GpsLog(
                request.getEventId(),
                vehicle,
                activeSession,
                request.getLatitude(),
                request.getLongitude(),
                request.getSpeed(),
                request.getRecordedAt());

        gpsLogRepository.save(log);
    }
}
