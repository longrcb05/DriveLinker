package com.drivelinker.telemetry.entity;

import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "GpsLogs")
public class GpsLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LogID")
    private Long id;

    @Column(name = "EventID", nullable = false, unique = true)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MonitoringSessionID", nullable = false)
    private MonitoringSession monitoringSession;

    @Column(name = "Latitude", nullable = false)
    private Double latitude;

    @Column(name = "Longitude", nullable = false)
    private Double longitude;

    @Column(name = "Speed")
    private Double speed;

    @Column(name = "RecordedAt", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "ReceivedAt", updatable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    public GpsLog() {
    }

    public GpsLog(String eventId, Vehicle vehicle, MonitoringSession session, Double lat, Double lng, Double speed,
            LocalDateTime recordedAt) {
        this.eventId = eventId;
        this.vehicle = vehicle;
        this.monitoringSession = session;
        this.latitude = lat;
        this.longitude = lng;
        this.speed = speed;
        this.recordedAt = recordedAt;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
}
