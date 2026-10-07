package com.drivelinker.customer.service;

import com.drivelinker.customer.dto.CustomerRequest;
import com.drivelinker.customer.dto.CustomerResponse;
import com.drivelinker.customer.entity.Customer;
import com.drivelinker.customer.repository.CustomerRepository;
import com.drivelinker.organization.entity.Organization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service chứa logic nghiệp vụ liên quan đến quản lý Khách hàng.
 */
@Service
public class CustomerService {
    private CustomerRepository customerRepository;

    @Autowired
    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerResponse createCustomer(CustomerRequest request, Organization organization) {
        Optional<Customer> existingPhone = customerRepository.findByPhone(request.getPhone());
        if (existingPhone.isPresent()) {
            throw new RuntimeException("Số điện thoại này đã được sử dụng!");
        }
        Optional<Customer> exitstingIdCard = customerRepository.findByIdCardNumber(request.getIdCardNumber());
        if (exitstingIdCard.isPresent()) {
            throw new RuntimeException("Số CMND/CCCD này đã được sử dụng!");
        }
        Customer newCustomer = new Customer();
        newCustomer.setFullName(request.getFullName());
        newCustomer.setPhone(request.getPhone());
        newCustomer.setIdCardNumber(request.getIdCardNumber());
        newCustomer.setDrivingLicense(request.getDrivingLicense());
        newCustomer.setAddress(request.getAddress());
        newCustomer.setOrganization(organization);
        Customer savedCustomer = customerRepository.save(newCustomer);
        return new CustomerResponse(savedCustomer);
    }

    public List<CustomerResponse> getAllCustomer() {
        List<Customer> listfromDB = customerRepository.findAll();
        List<CustomerResponse> listResponse = new ArrayList<>();
        for (Customer cus : listfromDB) {
            listResponse.add(new CustomerResponse(cus));
        }
        return listResponse;
    }
}
