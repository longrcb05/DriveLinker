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

    private void validatePhone(String phone) {
        if (phone == null || phone.length() != 10 || phone.charAt(0) != '0') {
            throw new RuntimeException("Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0");
        }
        for (int i = 0; i < phone.length(); i++) {
            if (!Character.isDigit(phone.charAt(i))) {
                throw new RuntimeException("Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0");
            }
        }
    }

    private void validateIdCard(String idCard) {
        if (idCard == null || idCard.length() != 12) {
            throw new RuntimeException("Căn cước công dân phải bao gồm đúng 12 chữ số");
        }
        for (int i = 0; i < idCard.length(); i++) {
            if (!Character.isDigit(idCard.charAt(i))) {
                throw new RuntimeException("Căn cước công dân phải bao gồm đúng 12 chữ số");
            }
        }
    }

    public CustomerResponse createCustomer(CustomerRequest request, Organization organization) {
        validatePhone(request.getPhone());
        validateIdCard(request.getIdCardNumber());

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

    public List<CustomerResponse> getAllCustomer(Integer orgId) {
        List<Customer> listfromDB = customerRepository.findAllByOrganizationId(orgId);
        List<CustomerResponse> listResponse = new ArrayList<>();
        for (Customer cus : listfromDB) {
            listResponse.add(new CustomerResponse(cus));
        }
        return listResponse;
    }
}
