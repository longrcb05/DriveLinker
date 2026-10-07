package com.drivelinker.rental.repository;

import com.drivelinker.rental.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Interface thao tác CSDL cho bảng Hợp đồng thuê xe.
 */
@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Integer> {

    @Query("SELECT r FROM RentalContract r WHERE r.vehicle.id = :vehicleId AND r.status = :status")
    List<RentalContract> findByVehicleIdAndStatus(@Param("vehicleId") Integer vehicleId,
            @Param("status") String status);
}
