# Bản thiết kế Code - Phần 8: Dashboard & History (Thủ công 100%)

Phần 8 sẽ cung cấp các API để giao diện Frontend vẽ biểu đồ tổng quan (bao nhiêu xe đang rảnh, bao nhiêu xe đang chạy, bao nhiêu báo động đỏ...) và API vẽ lại vết bản đồ (Lịch sử GPS).
Vì anh muốn làm chuẩn 100% thủ công không dùng Lombok, dưới đây là chi tiết mã nguồn:

---

### 1. BỔ SUNG CÁC HÀM TRUY VẤN VÀO REPOSITORY
Mở các file Repository sau và thêm các dòng code (bên trong dấu ngoặc nhọn `{}`) nhé.

**Đường dẫn 1:** `src/main/java/com/drivelinker/vehicle/repository/VehicleRepository.java`
Thêm 2 dòng này vào trước dấu ngoặc nhọn đóng `}`:
```java
    long countByOrganizationId(Integer orgId);
    long countByOrganizationIdAndStatus(Integer orgId, String status);
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/rental/repository/RentalContractRepository.java`
Thêm dòng này vào trước dấu ngoặc nhọn đóng `}`:
```java
    long countByOrganizationIdAndStatus(Integer orgId, String status);
```

**Đường dẫn 3:** `src/main/java/com/drivelinker/alert/repository/AlertRepository.java`
Thêm dòng này vào trước dấu ngoặc nhọn đóng `}`:
```java
    long countByOrganizationIdAndResolutionStatus(Integer orgId, String resolutionStatus);
```

**Đường dẫn 4:** `src/main/java/com/drivelinker/telemetry/repository/GpsLogRepository.java`
Thêm import và dòng truy vấn này vào:
```java
// Thêm 2 import này ở trên cùng:
import java.time.LocalDateTime;
import java.util.List;

// Thêm dòng này vào trong interface:
    List<GpsLog> findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtAsc(Integer vehicleId, LocalDateTime from, LocalDateTime to);
```

---

### 2. TẠO CÁC ĐỐI TƯỢNG TRẢ VỀ (DTO)
Tạo package `dashboard` trong `com.drivelinker` và tạo thư mục `dto`.

**Đường dẫn 5:** `src/main/java/com/drivelinker/dashboard/dto/DashboardSummaryResponse.java`
```java
package com.drivelinker.dashboard.dto;

public class DashboardSummaryResponse {
    private long totalVehicles;
    private long availableVehicles;
    private long rentedVehicles;
    private long maintenanceVehicles;
    private long activeContracts;
    private long activeAlerts;

    public DashboardSummaryResponse() {}

    public long getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(long totalVehicles) { this.totalVehicles = totalVehicles; }
    
    public long getAvailableVehicles() { return availableVehicles; }
    public void setAvailableVehicles(long availableVehicles) { this.availableVehicles = availableVehicles; }
    
    public long getRentedVehicles() { return rentedVehicles; }
    public void setRentedVehicles(long rentedVehicles) { this.rentedVehicles = rentedVehicles; }
    
    public long getMaintenanceVehicles() { return maintenanceVehicles; }
    public void setMaintenanceVehicles(long maintenanceVehicles) { this.maintenanceVehicles = maintenanceVehicles; }
    
    public long getActiveContracts() { return activeContracts; }
    public void setActiveContracts(long activeContracts) { this.activeContracts = activeContracts; }
    
    public long getActiveAlerts() { return activeAlerts; }
    public void setActiveAlerts(long activeAlerts) { this.activeAlerts = activeAlerts; }
}
```

**Đường dẫn 6:** `src/main/java/com/drivelinker/dashboard/dto/JourneyPointDto.java`
```java
package com.drivelinker.dashboard.dto;

import java.time.LocalDateTime;

public class JourneyPointDto {
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime recordedAt;

    public JourneyPointDto() {}

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }
    
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
```

---

### 3. TẠO SERVICE ĐỂ TỔNG HỢP DỮ LIỆU
**Đường dẫn 7:** `src/main/java/com/drivelinker/dashboard/service/DashboardService.java`
```java
package com.drivelinker.dashboard.service;

import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.dashboard.dto.DashboardSummaryResponse;
import com.drivelinker.dashboard.dto.JourneyPointDto;
import com.drivelinker.rental.repository.RentalContractRepository;
import com.drivelinker.telemetry.repository.GpsLogRepository;
import com.drivelinker.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private final VehicleRepository vehicleRepository;
    private final RentalContractRepository contractRepository;
    private final AlertRepository alertRepository;
    private final GpsLogRepository gpsLogRepository;

    public DashboardService(VehicleRepository vehicleRepository, RentalContractRepository contractRepository,
                            AlertRepository alertRepository, GpsLogRepository gpsLogRepository) {
        this.vehicleRepository = vehicleRepository;
        this.contractRepository = contractRepository;
        this.alertRepository = alertRepository;
        this.gpsLogRepository = gpsLogRepository;
    }

    public DashboardSummaryResponse getSummary(Integer orgId) {
        DashboardSummaryResponse res = new DashboardSummaryResponse();
        res.setTotalVehicles(vehicleRepository.countByOrganizationId(orgId));
        res.setAvailableVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "AVAILABLE"));
        res.setRentedVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "RENTED"));
        res.setMaintenanceVehicles(vehicleRepository.countByOrganizationIdAndStatus(orgId, "MAINTENANCE"));
        
        // Trạng thái hợp đồng đang ACTIVE và Cảnh báo đang là NEW (Chưa xử lý)
        res.setActiveContracts(contractRepository.countByOrganizationIdAndStatus(orgId, "ACTIVE"));
        res.setActiveAlerts(alertRepository.countByOrganizationIdAndResolutionStatus(orgId, "NEW"));
        
        return res;
    }

    public List<JourneyPointDto> getVehicleJourney(Integer vehicleId, LocalDateTime from, LocalDateTime to) {
        return gpsLogRepository.findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtAsc(vehicleId, from, to)
                .stream().map(log -> {
                    JourneyPointDto point = new JourneyPointDto();
                    point.setLatitude(log.getLatitude());
                    point.setLongitude(log.getLongitude());
                    point.setSpeed(log.getSpeed());
                    point.setRecordedAt(log.getRecordedAt());
                    return point;
                }).collect(Collectors.toList());
    }
}
```

---

### 4. TẠO CONTROLLER MỞ API RA NGOÀI
**Đường dẫn 8:** `src/main/java/com/drivelinker/dashboard/controller/DashboardController.java`
```java
package com.drivelinker.dashboard.controller;

import com.drivelinker.common.response.ApiResponse;
import com.drivelinker.dashboard.dto.DashboardSummaryResponse;
import com.drivelinker.dashboard.dto.JourneyPointDto;
import com.drivelinker.dashboard.service.DashboardService;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    
    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    public DashboardController(DashboardService dashboardService, UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    // API 1: Lấy thông số tổng quan
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(Authentication auth) {
        // Tìm ra OrganizationID của Admin đang đăng nhập
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User"));
                
        DashboardSummaryResponse summary = dashboardService.getSummary(user.getOrganization().getId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // API 2: Lấy lịch sử hành trình vẽ bản đồ
    @GetMapping("/vehicles/{id}/journey")
    public ResponseEntity<ApiResponse<List<JourneyPointDto>>> getJourney(
            @PathVariable("id") Integer vehicleId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
            
        List<JourneyPointDto> journey = dashboardService.getVehicleJourney(vehicleId, from, to);
        return ResponseEntity.ok(ApiResponse.success(journey));
    }
}
```
