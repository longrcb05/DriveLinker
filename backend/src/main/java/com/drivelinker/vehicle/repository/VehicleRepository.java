package com.drivelinker.vehicle.repository;

import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Interface thao tác CSDL cho bảng Vehicles.
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    java.util.List<Vehicle> findAllByOrganizationId(Integer orgId);

    long countByOrganizationId(Integer orgId);

    long countByOrganizationIdAndStatus(Integer orgId, String status);
}
