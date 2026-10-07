package com.drivelinker.ai.entity;

import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AiResults")
public class AiResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ResultID")
    private Long id;

    @Column(name = "EventID", nullable = false, unique = true)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MonitoringSessionID", nullable = false)
    private MonitoringSession monitoringSession;

    @Column(name = "DrowsinessScore")
    private Integer drowsinessScore;

    @Column(name = "EyeStatus")
    private String eyeStatus;

    @Column(name = "HeadPoseStatus")
    private String headPoseStatus;

    @Column(name = "OccurredAt", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "ReceivedAt", updatable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    public AiResult() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public MonitoringSession getMonitoringSession() {
        return monitoringSession;
    }

    public void setMonitoringSession(MonitoringSession monitoringSession) {
        this.monitoringSession = monitoringSession;
    }

    public Integer getDrowsinessScore() {
        return drowsinessScore;
    }

    public void setDrowsinessScore(Integer drowsinessScore) {
        this.drowsinessScore = drowsinessScore;
    }

    public String getEyeStatus() {
        return eyeStatus;
    }

    public void setEyeStatus(String eyeStatus) {
        this.eyeStatus = eyeStatus;
    }

    public String getHeadPoseStatus() {
        return headPoseStatus;
    }

    public void setHeadPoseStatus(String headPoseStatus) {
        this.headPoseStatus = headPoseStatus;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
}
