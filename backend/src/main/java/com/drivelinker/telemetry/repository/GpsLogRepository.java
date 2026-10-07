package com.drivelinker.telemetry.repository;

import com.drivelinker.telemetry.entity.GpsLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GpsLogRepository extends JpaRepository<GpsLog, Long> {
    boolean existsByEventId(String eventId);
}
