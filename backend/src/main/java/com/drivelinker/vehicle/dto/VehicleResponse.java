package com.drivelinker.vehicle.dto;

import com.drivelinker.vehicle.entity.Vehicle;

public class VehicleResponse {
    public Integer id;
    public String licensePlate;
    public String vehicleType;
    public String brand;
    public String model;
    public String status;

    public VehicleResponse(Vehicle vehicle) {
        this.id = vehicle.getId();
        this.licensePlate = vehicle.getLicensePlate();
        this.vehicleType = vehicle.getVehicleType();
        this.brand = vehicle.getBrand();
        this.model = vehicle.getModel();
        this.status = vehicle.getStatus();

    }

    public Integer getId() {
        return id;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public String getBrand() {
        return brand;
    }

    public String getModel() {
        return model;
    }

    public String getStatus() {
        return status;
    }
}
