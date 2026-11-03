package com.drivelinker.customer.entity;

import com.drivelinker.organization.entity.Organization;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity ánh xạ với bảng Customers trong cơ sở dữ liệu.
 */
@Entity
@Table(name = "Customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerID")
    private Integer id;

    @Column(name = "FullName")
    private String fullName;

    @Column(name = "Phone", unique = true)
    private String phone;

    @Column(name = "IDCardNumber", unique = true)
    private String idCardNumber;

    @Column(name = "DrivingLicense")
    private String drivingLicense;

    @Column(name = "Address")
    private String address;

    @ManyToOne
    @JoinColumn(name = "OrganizationID")
    private Organization organization;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Customer() {
    }

    public Customer(String fullname, String phone, String idCardNumber, String drivingLicense, String address,
            Organization organization) {
        this.fullName = fullname;
        this.phone = phone;
        this.idCardNumber = idCardNumber;
        this.drivingLicense = drivingLicense;
        this.address = address;
        this.organization = organization;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdCardNumber() {
        return idCardNumber;
    }

    public void setIdCardNumber(String idCardNumber) {
        this.idCardNumber = idCardNumber;
    }

    public String getDrivingLicense() {
        return drivingLicense;
    }

    public void setDrivingLicense(String drivingLicense) {
        this.drivingLicense = drivingLicense;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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
