package com.drivelinker.telemetry.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.drivelinker.telemetry.entity.GpsLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GpsLogRepository extends JpaRepository<GpsLog, Long> {
    boolean existsByEventId(String eventId);

    List<GpsLog> findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtAsc(Integer vehicleId, LocalDateTime from,
            LocalDateTime to);
}
