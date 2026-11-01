package com.drivelinker.ai.service;

import com.drivelinker.ai.dto.AiResultRequest;
import com.drivelinker.ai.entity.AiResult;
import com.drivelinker.ai.repository.AiResultRepository;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiResultService {

    private final AiResultRepository aiResultRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;

    public AiResultService(AiResultRepository aiResultRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository) {
        this.aiResultRepository = aiResultRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public void saveAiResult(AiResultRequest request, Integer deviceId) {
        if (request.getDrowsinessScore() != null && request.getDrowsinessScore() > 100) {
            throw new RuntimeException("Drowsiness score không được vượt quá 100");
        }

        if (aiResultRepository.existsByEventId(request.getEventId())) {
            return; // Đã nhận event này rồi, bỏ qua
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();
        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào"));

        AiResult result = new AiResult();
        result.setEventId(request.getEventId());
        result.setVehicle(vehicle);
        result.setMonitoringSession(activeSession);
        result.setDrowsinessScore(request.getDrowsinessScore());
        result.setEyeStatus(request.getEyeStatus());
        result.setHeadPoseStatus(request.getHeadPoseStatus());
        result.setOccurredAt(request.getOccurredAt());

        aiResultRepository.save(result);
    }
}
