package com.drivelinker.common.websocket;

import com.drivelinker.alert.dto.RealtimeAlertEvent;
import com.drivelinker.telemetry.dto.RealtimeTelemetryEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Phát sóng tọa độ GPS theo từng xe
    public void publishTelemetry(Integer orgId, Integer vehicleId, RealtimeTelemetryEvent event) {
        // Gửi chung cho các Admin đang xem bản đồ tổng của cả công ty
        messagingTemplate.convertAndSend("/topic/org/" + orgId + "/vehicles", event);

        // Gửi riêng cho những người đang mở trang chi tiết của đúng xe này
        messagingTemplate.convertAndSend("/topic/vehicle/" + vehicleId + "/telemetry", event);
    }

    // Phát sóng cảnh báo khẩn cấp (Alert)
    public void publishAlert(Integer orgId, RealtimeAlertEvent event) {
        messagingTemplate.convertAndSend("/topic/org/" + orgId + "/alerts", event);
    }
}