package com.drivelinker.organization.repository;

import com.drivelinker.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Interface thao tác CSDL cho bảng Organizations.
 */
public interface OrganizationRepository extends JpaRepository<Organization, Integer> {
    Optional<Organization> findByCompanyCode(String companyCode);
}
