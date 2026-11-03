package com.drivelinker.rental.entity;

import com.drivelinker.customer.entity.Customer;
import com.drivelinker.organization.entity.Organization;
import com.drivelinker.user.entity.User;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity ánh xạ với bảng RentalContracts, lưu trữ hợp đồng thuê.
 */
@Entity
@Table(name = "RentalContracts")
public class RentalContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ContractID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CustomerID", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CreatedByStaffID", nullable = false)
    private User createdByStaff;

    @Column(name = "StartTime", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "EndTime", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "ActualReturnTime")
    private LocalDateTime actualReturnTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrganizationID", nullable = false)
    private Organization organization;

    @Column(name = "Status")
    private String status = "DRAFT";

    @Column(name = "Notes", length = 500)
    private String notes;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public RentalContract() {
    }

    public RentalContract(Customer customer, Vehicle vehicle, User createdByStaff, LocalDateTime startTime,
            LocalDateTime endTime, Organization organization, String notes) {
        this.customer = customer;
        this.vehicle = vehicle;
        this.createdByStaff = createdByStaff;
        this.startTime = startTime;
        this.endTime = endTime;
        this.organization = organization;
        this.notes = notes;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getCreatedByStaff() {
        return createdByStaff;
    }

    public void setCreatedByStaff(User createdByStaff) {
        this.createdByStaff = createdByStaff;
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

    public LocalDateTime getActualReturnTime() {
        return actualReturnTime;
    }

    public void setActualReturnTime(LocalDateTime actualReturnTime) {
        this.actualReturnTime = actualReturnTime;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
