package com.drivelinker.device.repository;

import com.drivelinker.device.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Integer> {
    Optional<Device> findByDeviceCode(String deviceCode);
}
