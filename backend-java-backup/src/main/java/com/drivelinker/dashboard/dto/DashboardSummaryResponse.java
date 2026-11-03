package com.drivelinker.dashboard.dto;

public class DashboardSummaryResponse {
    private long totalVehicles;
    private long availableVehicles;
    private long rentedVehicles;
    private long maintenanceVehicles;
    private long activeContracts;
    private long activeAlerts;

    public DashboardSummaryResponse() {
    }

    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public long getAvailableVehicles() {
        return availableVehicles;
    }

    public void setAvailableVehicles(long availableVehicles) {
        this.availableVehicles = availableVehicles;
    }

    public long getRentedVehicles() {
        return rentedVehicles;
    }

    public void setRentedVehicles(long rentedVehicles) {
        this.rentedVehicles = rentedVehicles;
    }

    public long getMaintenanceVehicles() {
        return maintenanceVehicles;
    }

    public void setMaintenanceVehicles(long maintenanceVehicles) {
        this.maintenanceVehicles = maintenanceVehicles;
    }

    public long getActiveContracts() {
        return activeContracts;
    }

    public void setActiveContracts(long activeContracts) {
        this.activeContracts = activeContracts;
    }

    public long getActiveAlerts() {
        return activeAlerts;
    }

    public void setActiveAlerts(long activeAlerts) {
        this.activeAlerts = activeAlerts;
    }
}