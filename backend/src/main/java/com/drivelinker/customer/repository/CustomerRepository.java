package com.drivelinker.customer.repository;

import com.drivelinker.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByIdCardNumber(String idCardNumber);
}
