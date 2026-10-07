package com.drivelinker.monitoring.repository;

import com.drivelinker.monitoring.entity.MonitoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Interface giao tiếp CSDL cho phiên giám sát hành trình.
 */
@Repository
public interface MonitoringSessionRepository extends JpaRepository<MonitoringSession, Long> {

    @Query("SELECT m FROM MonitoringSession m WHERE m.contract.id = :contractId AND m.status = :status")
    Optional<MonitoringSession> findByContractIdAndStatus(@Param("contractId") Integer contractId,
            @Param("status") String status);

    Optional<MonitoringSession> findByVehicleIdAndStatus(Integer vehicleId, String status);
}
