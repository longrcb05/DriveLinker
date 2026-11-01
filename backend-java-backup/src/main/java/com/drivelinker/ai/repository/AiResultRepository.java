package com.drivelinker.ai.repository;

import com.drivelinker.ai.entity.AiResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiResultRepository extends JpaRepository<AiResult, Long> {
    boolean existsByEventId(String eventId);
}
