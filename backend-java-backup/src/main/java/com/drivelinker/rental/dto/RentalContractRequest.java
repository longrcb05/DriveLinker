package com.drivelinker.rental.dto;

import java.time.LocalDateTime;

/**
 * DTO nhận dữ liệu đầu vào khi tạo/sửa Hợp đồng thuê xe.
 */
public class RentalContractRequest {
    private Integer customerId;
    private Integer vehicleId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String notes;

    public RentalContractRequest() {
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
