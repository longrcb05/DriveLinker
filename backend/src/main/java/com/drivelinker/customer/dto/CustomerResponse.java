package com.drivelinker.customer.dto;

import com.drivelinker.customer.entity.Customer;

public class CustomerResponse {
    private Integer id;
    private String fullname;
    private String phone;
    private String idCardNumber;
    private String drivingLicense;
    private String address;

    public CustomerResponse(Customer customer) {
        this.id = customer.getId();
        this.fullname = customer.getFullName();
        this.phone = customer.getPhone();
        this.idCardNumber = customer.getIdCardNumber();
        this.drivingLicense = customer.getDrivingLicense();
        this.address = customer.getAddress();
    }

    public Integer getId() {
        return id;
    }

    public String getFullName() {
        return fullname;
    }

    public String getPhone() {
        return phone;
    }

    public String getIdCardNumber() {
        return idCardNumber;
    }

    public String getDrivingLicense() {
        return drivingLicense;
    }

    public String getAddress() {
        return address;
    }
}
