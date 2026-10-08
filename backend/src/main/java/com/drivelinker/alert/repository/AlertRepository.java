package com.drivelinker.alert.repository;

import com.drivelinker.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByEventId(String eventId);

    long countByOrganizationIdAndResolutionStatus(Integer orgId, String resolutionStatus);
}
