package com.drivelinker.vehicle.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO nhận dữ liệu tạo/sửa thông tin Phương tiện.
 */
public class VehicleRequest {
    
    @NotBlank(message = "Biển số xe không được để trống")
    private String licensePlate;

    @NotBlank(message = "Loại xe không được để trống")
    private String vehicleType;

    @NotBlank(message = "Hãng xe không được để trống")
    private String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    private String model;

    public VehicleRequest() {

    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;

    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
