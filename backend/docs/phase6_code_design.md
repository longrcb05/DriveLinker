# Bản thiết kế Code - Phần 6: AI Result + Alert (Thủ công 100%)

Ở Phần 6, chúng ta sẽ xây dựng các chức năng nhận dữ liệu phân tích từ Camera AI gắn trên xe (điểm buồn ngủ, trạng thái mắt) và ghi nhận các cảnh báo (Alert) nguy hiểm để báo về cho Admin.

Vì ở file `V4` cũ chúng ta đã lỡ tạo bảng `AiAlerts` sơ khai (gộp chung kết quả và cảnh báo), ở Phần 6 này chúng ta sẽ Drop nó đi và chia làm các bảng chuyên biệt theo đúng Kế hoạch phát triển.

Dưới đây là toàn bộ code thủ công. Anh hãy copy và dán tuần tự nhé!

---

### 1. FILE SQL MIGRATION (CƠ SỞ DỮ LIỆU)
**Đường dẫn:** `src/main/resources/db/migration/V8__create_ai_and_alert_tables.sql`
*(Nếu thư mục `db/migration` chưa có file này, anh hãy nhấp chuột phải tạo file mới nhé)*

```sql
-- Xóa bảng cũ nếu đã tạo ở V4
DROP TABLE IF EXISTS AiAlerts CASCADE;

CREATE TABLE AiResults (
    ResultID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL,
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    DrowsinessScore INT CHECK (DrowsinessScore >= 0 AND DrowsinessScore <= 100),
    EyeStatus VARCHAR(20),
    HeadPoseStatus VARCHAR(50),
    OccurredAt TIMESTAMP NOT NULL,
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID)
);

CREATE TABLE Alerts (
    AlertID BIGSERIAL PRIMARY KEY,
    EventID VARCHAR(50) UNIQUE NOT NULL,
    OrganizationID INT NOT NULL,
    VehicleID INT NOT NULL,
    MonitoringSessionID BIGINT NOT NULL,
    AlertType VARCHAR(50) NOT NULL,
    SeverityLevel VARCHAR(20) NOT NULL,
    DrowsinessScore INT,
    Latitude DOUBLE PRECISION,
    Longitude DOUBLE PRECISION,
    ResolutionStatus VARCHAR(20) DEFAULT 'NEW',
    ResolvedBy INT NULL,
    ResolutionNote TEXT,
    OccurredAt TIMESTAMP NOT NULL,
    ReceivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt TIMESTAMP NULL,
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (MonitoringSessionID) REFERENCES MonitoringSessions(SessionID),
    FOREIGN KEY (ResolvedBy) REFERENCES Users(UserID)
);

CREATE TABLE AlertActions (
    ActionID BIGSERIAL PRIMARY KEY,
    AlertID BIGINT NOT NULL,
    Action VARCHAR(50) NOT NULL,
    PerformedBy INT NOT NULL,
    Note TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AlertID) REFERENCES Alerts(AlertID),
    FOREIGN KEY (PerformedBy) REFERENCES Users(UserID)
);
```

---

### 2. CÁC ENUM TRẠNG THÁI
Anh tạo các file Java sau trong thư mục `src/main/java/com/drivelinker/ai/enums/` và `com/drivelinker/alert/enums/` nhé.

**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/enums/EyeStatus.java`
```java
package com.drivelinker.ai.enums;

public enum EyeStatus {
    OPEN,
    CLOSED
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/ai/enums/HeadPoseStatus.java`
```java
package com.drivelinker.ai.enums;

public enum HeadPoseStatus {
    NORMAL,
    LOOKING_DOWN,
    LOOKING_LEFT,
    LOOKING_RIGHT,
    TILTED
}
```

**Đường dẫn 3:** `src/main/java/com/drivelinker/alert/enums/AlertType.java`
```java
package com.drivelinker.alert.enums;

public enum AlertType {
    DROWSINESS,
    YAWNING,
    HEAD_NOD,
    CAMERA_TAMPERING
}
```

**Đường dẫn 4:** `src/main/java/com/drivelinker/alert/enums/SeverityLevel.java`
```java
package com.drivelinker.alert.enums;

public enum SeverityLevel {
    LOW,
    WARNING,
    DANGER
}
```

**Đường dẫn 5:** `src/main/java/com/drivelinker/alert/enums/ResolutionStatus.java`
```java
package com.drivelinker.alert.enums;

public enum ResolutionStatus {
    NEW,
    PROCESSING,
    RESOLVED
}
```

---

### 3. CÁC ENTITY (ÁNH XẠ DATABASE)
**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/entity/AiResult.java`
```java
package com.drivelinker.ai.entity;

import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AiResults")
public class AiResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ResultID")
    private Long id;

    @Column(name = "EventID", nullable = false, unique = true)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MonitoringSessionID", nullable = false)
    private MonitoringSession monitoringSession;

    @Column(name = "DrowsinessScore")
    private Integer drowsinessScore;

    @Column(name = "EyeStatus")
    private String eyeStatus;

    @Column(name = "HeadPoseStatus")
    private String headPoseStatus;

    @Column(name = "OccurredAt", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "ReceivedAt", updatable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    public AiResult() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public MonitoringSession getMonitoringSession() { return monitoringSession; }
    public void setMonitoringSession(MonitoringSession monitoringSession) { this.monitoringSession = monitoringSession; }
    public Integer getDrowsinessScore() { return drowsinessScore; }
    public void setDrowsinessScore(Integer drowsinessScore) { this.drowsinessScore = drowsinessScore; }
    public String getEyeStatus() { return eyeStatus; }
    public void setEyeStatus(String eyeStatus) { this.eyeStatus = eyeStatus; }
    public String getHeadPoseStatus() { return headPoseStatus; }
    public void setHeadPoseStatus(String headPoseStatus) { this.headPoseStatus = headPoseStatus; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/alert/entity/Alert.java`
```java
package com.drivelinker.alert.entity;

import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.organization.entity.Organization;
import com.drivelinker.user.entity.User;
import com.drivelinker.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AlertID")
    private Long id;

    @Column(name = "EventID", nullable = false, unique = true)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrganizationID", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleID", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MonitoringSessionID", nullable = false)
    private MonitoringSession monitoringSession;

    @Column(name = "AlertType", nullable = false)
    private String alertType;

    @Column(name = "SeverityLevel", nullable = false)
    private String severityLevel;

    @Column(name = "DrowsinessScore")
    private Integer drowsinessScore;

    @Column(name = "Latitude")
    private Double latitude;

    @Column(name = "Longitude")
    private Double longitude;

    @Column(name = "ResolutionStatus")
    private String resolutionStatus = "NEW";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ResolvedBy")
    private User resolvedBy;

    @Column(name = "ResolutionNote")
    private String resolutionNote;

    @Column(name = "OccurredAt", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "ReceivedAt", updatable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(name = "ResolvedAt")
    private LocalDateTime resolvedAt;

    public Alert() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public MonitoringSession getMonitoringSession() { return monitoringSession; }
    public void setMonitoringSession(MonitoringSession monitoringSession) { this.monitoringSession = monitoringSession; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public Integer getDrowsinessScore() { return drowsinessScore; }
    public void setDrowsinessScore(Integer drowsinessScore) { this.drowsinessScore = drowsinessScore; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getResolutionStatus() { return resolutionStatus; }
    public void setResolutionStatus(String resolutionStatus) { this.resolutionStatus = resolutionStatus; }
    public User getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(User resolvedBy) { this.resolvedBy = resolvedBy; }
    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
```

---

### 4. REPOSITORIES
**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/repository/AiResultRepository.java`
```java
package com.drivelinker.ai.repository;

import com.drivelinker.ai.entity.AiResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiResultRepository extends JpaRepository<AiResult, Long> {
    boolean existsByEventId(String eventId);
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/alert/repository/AlertRepository.java`
```java
package com.drivelinker.alert.repository;

import com.drivelinker.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    boolean existsByEventId(String eventId);
}
```

---

### 5. DTO & REQUEST
**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/dto/AiResultRequest.java`
```java
package com.drivelinker.ai.dto;

import java.time.LocalDateTime;

public class AiResultRequest {
    private String eventId;
    private Integer drowsinessScore;
    private String eyeStatus;
    private String headPoseStatus;
    private LocalDateTime occurredAt;

    public AiResultRequest() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public Integer getDrowsinessScore() { return drowsinessScore; }
    public void setDrowsinessScore(Integer drowsinessScore) { this.drowsinessScore = drowsinessScore; }
    public String getEyeStatus() { return eyeStatus; }
    public void setEyeStatus(String eyeStatus) { this.eyeStatus = eyeStatus; }
    public String getHeadPoseStatus() { return headPoseStatus; }
    public void setHeadPoseStatus(String headPoseStatus) { this.headPoseStatus = headPoseStatus; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/alert/dto/AlertRequest.java`
```java
package com.drivelinker.alert.dto;

import java.time.LocalDateTime;

public class AlertRequest {
    private String eventId;
    private String alertType;
    private String severityLevel;
    private Integer drowsinessScore;
    private Double latitude;
    private Double longitude;
    private LocalDateTime occurredAt;

    public AlertRequest() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public Integer getDrowsinessScore() { return drowsinessScore; }
    public void setDrowsinessScore(Integer drowsinessScore) { this.drowsinessScore = drowsinessScore; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
```

---

### 6. SERVICE (XỬ LÝ NGHIỆP VỤ)
**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/service/AiResultService.java`
```java
package com.drivelinker.ai.service;

import com.drivelinker.ai.dto.AiResultRequest;
import com.drivelinker.ai.entity.AiResult;
import com.drivelinker.ai.repository.AiResultRepository;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiResultService {

    private final AiResultRepository aiResultRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;

    public AiResultService(AiResultRepository aiResultRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository) {
        this.aiResultRepository = aiResultRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public void saveAiResult(AiResultRequest request, Integer deviceId) {
        if (request.getDrowsinessScore() != null && request.getDrowsinessScore() > 100) {
            throw new RuntimeException("Drowsiness score không được vượt quá 100");
        }

        if (aiResultRepository.existsByEventId(request.getEventId())) {
            return; // Đã nhận event này rồi, bỏ qua
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();
        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào"));

        AiResult result = new AiResult();
        result.setEventId(request.getEventId());
        result.setVehicle(vehicle);
        result.setMonitoringSession(activeSession);
        result.setDrowsinessScore(request.getDrowsinessScore());
        result.setEyeStatus(request.getEyeStatus());
        result.setHeadPoseStatus(request.getHeadPoseStatus());
        result.setOccurredAt(request.getOccurredAt());

        aiResultRepository.save(result);
    }
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/alert/service/AlertService.java`
```java
package com.drivelinker.alert.service;

import com.drivelinker.alert.dto.AlertRequest;
import com.drivelinker.alert.entity.Alert;
import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AlertService {
    private final AlertRepository alertRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;

    public AlertService(AlertRepository alertRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository) {
        this.alertRepository = alertRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public void saveAlert(AlertRequest request, Integer deviceId) {
        if (alertRepository.existsByEventId(request.getEventId())) {
            return; 
        }

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();
        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào"));

        Alert alert = new Alert();
        alert.setEventId(request.getEventId());
        alert.setOrganization(device.getOrganization());
        alert.setVehicle(vehicle);
        alert.setMonitoringSession(activeSession);
        alert.setAlertType(request.getAlertType());
        alert.setSeverityLevel(request.getSeverityLevel());
        alert.setDrowsinessScore(request.getDrowsinessScore());
        alert.setLatitude(request.getLatitude());
        alert.setLongitude(request.getLongitude());
        alert.setOccurredAt(request.getOccurredAt());

        alertRepository.save(alert);
    }
}
```

---

### 7. CONTROLLER (ĐIỂM TIẾP NHẬN API)
**Đường dẫn 1:** `src/main/java/com/drivelinker/ai/controller/AiResultController.java`
```java
package com.drivelinker.ai.controller;

import com.drivelinker.ai.dto.AiResultRequest;
import com.drivelinker.ai.service.AiResultService;
import com.drivelinker.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot/ai-results")
public class AiResultController {
    private final AiResultService aiResultService;

    public AiResultController(AiResultService aiResultService) {
        this.aiResultService = aiResultService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> receiveAiResult(
            @RequestBody AiResultRequest request,
            Authentication authentication) {
        
        Integer deviceId = (Integer) authentication.getPrincipal();
        aiResultService.saveAiResult(request, deviceId);
        
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận kết quả AI thành công"));
    }
}
```

**Đường dẫn 2:** `src/main/java/com/drivelinker/alert/controller/AlertController.java`
```java
package com.drivelinker.alert.controller;

import com.drivelinker.alert.dto.AlertRequest;
import com.drivelinker.alert.service.AlertService;
import com.drivelinker.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot/alerts")
public class AlertController {
    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> receiveAlert(
            @RequestBody AlertRequest request,
            Authentication authentication) {
        
        Integer deviceId = (Integer) authentication.getPrincipal();
        alertService.saveAlert(request, deviceId);
        
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận Cảnh báo thành công"));
    }
}
```
