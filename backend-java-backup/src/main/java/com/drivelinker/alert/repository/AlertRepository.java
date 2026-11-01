package com.drivelinker.alert.repository;

import com.drivelinker.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByEventId(String eventId);

    long countByOrganizationIdAndResolutionStatus(Integer orgId, String resolutionStatus);

    long countByOrganizationIdAndSeverityLevel(Integer orgId, String severityLevel);

    @org.springframework.data.jpa.repository.Query("SELECT a.alertType, COUNT(a) FROM Alert a WHERE a.organization.id = :orgId GROUP BY a.alertType")
    java.util.List<Object[]> countAlertsByTypeForOrg(@org.springframework.data.repository.query.Param("orgId") Integer orgId);
}
