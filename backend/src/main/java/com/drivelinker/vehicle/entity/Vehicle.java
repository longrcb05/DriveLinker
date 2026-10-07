package com.drivelinker.vehicle.entity;

import com.drivelinker.organization.entity.Organization;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity ánh xạ với bảng Vehicles.
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleID")
    private Integer id;

    @Column(name = "LicensePlate", unique = true)
    private String licensePlate;

    @Column(name = "VehicleType")
    private String vehicleType;

    @Column(name = "Brand")
    private String brand;

    @Column(name = "Model")
    private String model;

    @Column(name = "GpsDeviceID")
    private String gpsDeviceID;

    @Column(name = "CameraDeviceID")
    private String cameraDeviceID;

    @Column(name = "Status")
    private String status = "AVAILABLE";// Mặc định xe mới nhập kho luôn sẵn sàng cho thuê

    @ManyToOne
    @JoinColumn(name = "OrganizationID")
    private Organization organization;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Vehicle() {

    }

    public Vehicle(String licensePlate, String vehicleType, String brand, String model, Organization organization) {
        this.licensePlate = licensePlate;
        this.vehicleType = vehicleType;
        this.brand = brand;
        this.model = model;
        this.organization = organization;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getGpsDeviceID() {
        return gpsDeviceID;
    }

    public void setGpsDeviceID(String gpsDeviceID) {
        this.gpsDeviceID = gpsDeviceID;
    }

    public String getCameraDeviceID() {
        return cameraDeviceID;
    }

    public void setCameraDeviceID(String cameraDeviceID) {
        this.cameraDeviceID = cameraDeviceID;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;

    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
