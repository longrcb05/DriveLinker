package com.drivelinker.monitoring.entity;

import com.drivelinker.rental.entity.RentalContract;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity ánh xạ với bảng MonitoringSessions, quản lý phiên giám sát hành trình.
 */
@Entity
@Table(name = "MonitoringSessions")
public class MonitoringSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SessionID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ContractID", nullable = false)
    private RentalContract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @Column(name = "StartedAt", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "EndedAt")
    private LocalDateTime endedAt;

    @Column(name = "Status")
    private String status = "ACTIVE";

    public MonitoringSession() {
    }

    public MonitoringSession(RentalContract contract, Vehicle vehicle, LocalDateTime startedAt) {
        this.contract = contract;
        this.vehicle = vehicle;
        this.startedAt = startedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RentalContract getContract() {
        return contract;
    }

    public void setContract(RentalContract contract) {
        this.contract = contract;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
