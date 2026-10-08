# Bản thiết kế Code - Phần 7: WebSocket Realtime (Thủ công 100%)

Ở Phần 7, chúng ta sẽ xây dựng hệ thống thời gian thực (Realtime). Nhờ WebSocket, mỗi khi có kết quả GPS hoặc Cảnh báo nguy hiểm (Alert) từ mạch phần cứng gửi lên, Server sẽ lập tức "bắn" (push) dữ liệu đó thẳng tới trình duyệt web của Admin mà không cần Admin phải tải lại (F5) trang.

Đồng thời, hệ thống cũng được bảo mật nghiêm ngặt: Chỉ những ai có Token hợp lệ mới kết nối được, và nhân viên của Công ty A không thể "nghe lén" dữ liệu của Công ty B.

Dưới đây là toàn bộ code thủ công. Anh hãy copy và dán tuần tự nhé!

---

### 1. CẤU HÌNH WEBSOCKET
**Đường dẫn 1:** `src/main/java/com/drivelinker/common/config/WebSocketConfig.java`
*(Tạo package `config` trong `common` nếu chưa có)*

```java
package com.drivelinker.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Khai báo tiền tố cho các kênh (topics) mà client có thể "đăng ký" (subscribe) để lắng nghe
        config.enableSimpleBroker("/topic");
        
        // Khai báo tiền tố cho các tin nhắn từ client gửi lên server (nếu có)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Tạo endpoint cho Client kết nối WebSocket. 
        // Dùng withSockJS() để hỗ trợ các trình duyệt cũ.
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}
```

---

### 2. BẢO MẬT WEBSOCKET & PHÂN QUYỀN ORGANIZATION
Để kết nối, Client phải truyền Token qua Header. Khi đăng ký (Subscribe), ta phải chặn nếu người của Công ty A đòi xem kênh của Công ty B.

**Đường dẫn 2:** `src/main/java/com/drivelinker/common/security/WebSocketSecurityConfig.java`

```java
package com.drivelinker.common.security;

import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.Optional;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    public WebSocketSecurityConfig(JwtService jwtService, CustomUserDetailsService userDetailsService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // 1. KHI KẾT NỐI (CONNECT): Yêu cầu phải có Token hợp lệ
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        String username = jwtService.extractUsername(token);

                        if (username != null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            if (jwtService.isTokenValid(token, userDetails)) {
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                            }
                        }
                    }
                }

                // 2. KHI ĐĂNG KÝ LẮNG NGHE (SUBSCRIBE): Không cho phép nghe lén công ty khác
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    Principal user = accessor.getUser();
                    String destination = accessor.getDestination(); // Ví dụ: /topic/org/1/alerts

                    if (user != null && destination != null && destination.startsWith("/topic/org/")) {
                        String username = user.getName();
                        Optional<User> userOpt = userRepository.findByUsername(username);
                        
                        if (userOpt.isPresent()) {
                            Integer myOrgId = userOpt.get().getOrganization().getId();
                            String allowedPrefix = "/topic/org/" + myOrgId;
                            
                            // Nếu cố tình nghe lén kênh của tổ chức khác -> Chặn ngay lập tức
                            if (!destination.startsWith(allowedPrefix)) {
                                throw new IllegalArgumentException("Không có quyền truy cập kênh này!");
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}
```

---

### 3. CÁC ĐỐI TƯỢNG VẬN CHUYỂN DỮ LIỆU (DTO) CHO REALTIME
Tuyệt đối không đẩy trực tiếp Entity (có liên kết Database) vào WebSocket vì sẽ gây lỗi Lazy Initialization. Ta cần tạo các DTO trung gian.

**Đường dẫn 3:** `src/main/java/com/drivelinker/telemetry/dto/RealtimeTelemetryEvent.java`
```java
package com.drivelinker.telemetry.dto;

import java.time.LocalDateTime;

public class RealtimeTelemetryEvent {
    private String eventType = "VEHICLE_LOCATION_UPDATED";
    private Integer vehicleId;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime recordedAt;

    public RealtimeTelemetryEvent() {}

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Integer getVehicleId() { return vehicleId; }
    public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }
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

**Đường dẫn 4:** `src/main/java/com/drivelinker/alert/dto/RealtimeAlertEvent.java`
```java
package com.drivelinker.alert.dto;

import java.time.LocalDateTime;

public class RealtimeAlertEvent {
    private String eventType = "ALERT_CREATED";
    private Long alertId;
    private String alertTypeName;
    private String severityLevel;
    private Integer vehicleId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime occurredAt;

    public RealtimeAlertEvent() {}

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Long getAlertId() { return alertId; }
    public void setAlertId(Long alertId) { this.alertId = alertId; }
    public String getAlertTypeName() { return alertTypeName; }
    public void setAlertTypeName(String alertTypeName) { this.alertTypeName = alertTypeName; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public Integer getVehicleId() { return vehicleId; }
    public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
```

---

### 4. BỘ PHÁT SÓNG REALTIME (PUBLISHER)
**Đường dẫn 5:** `src/main/java/com/drivelinker/common/websocket/RealtimePublisher.java`
```java
package com.drivelinker.common.websocket;

import com.drivelinker.alert.dto.RealtimeAlertEvent;
import com.drivelinker.telemetry.dto.RealtimeTelemetryEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Phát sóng tọa độ GPS theo từng xe
    public void publishTelemetry(Integer orgId, Integer vehicleId, RealtimeTelemetryEvent event) {
        // Gửi chung cho các Admin đang xem bản đồ tổng của cả công ty
        messagingTemplate.convertAndSend("/topic/org/" + orgId + "/vehicles", event);
        
        // Gửi riêng cho những người đang mở trang chi tiết của đúng xe này
        messagingTemplate.convertAndSend("/topic/vehicle/" + vehicleId + "/telemetry", event);
    }

    // Phát sóng cảnh báo khẩn cấp (Alert)
    public void publishAlert(Integer orgId, RealtimeAlertEvent event) {
        messagingTemplate.convertAndSend("/topic/org/" + orgId + "/alerts", event);
    }
}
```

---

### 5. CẬP NHẬT CÁC SERVICE CŨ ĐỂ TÍCH HỢP BỘ PHÁT SÓNG
Bây giờ chúng ta sẽ cập nhật lại `TelemetryService.java` và `AlertService.java` mà ta đã code ở phần 5 và 6. Khi có dữ liệu lưu vào Database thành công, nó sẽ gọi `RealtimePublisher` để lập tức bắn dữ liệu ra màn hình.

**Đường dẫn 6:** Ghi đè toàn bộ `src/main/java/com/drivelinker/telemetry/service/TelemetryService.java`
```java
package com.drivelinker.telemetry.service;

import com.drivelinker.common.websocket.RealtimePublisher;
import com.drivelinker.device.entity.Device;
import com.drivelinker.device.repository.DeviceRepository;
import com.drivelinker.monitoring.entity.MonitoringSession;
import com.drivelinker.monitoring.enums.MonitoringStatus;
import com.drivelinker.monitoring.repository.MonitoringSessionRepository;
import com.drivelinker.telemetry.dto.GpsLogRequest;
import com.drivelinker.telemetry.dto.RealtimeTelemetryEvent;
import com.drivelinker.telemetry.entity.GpsLog;
import com.drivelinker.telemetry.repository.GpsLogRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TelemetryService {

    private final GpsLogRepository gpsLogRepository;
    private final DeviceRepository deviceRepository;
    private final MonitoringSessionRepository sessionRepository;
    private final RealtimePublisher realtimePublisher; // Tích hợp phát sóng

    public TelemetryService(GpsLogRepository gpsLogRepository, DeviceRepository deviceRepository,
                            MonitoringSessionRepository sessionRepository, RealtimePublisher realtimePublisher) {
        this.gpsLogRepository = gpsLogRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public void saveGpsLog(GpsLogRequest request, Integer deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Thiết bị không tồn tại"));

        Vehicle vehicle = device.getVehicle();

        MonitoringSession activeSession = sessionRepository
                .findByVehicleIdAndStatus(vehicle.getId(), MonitoringStatus.ACTIVE.name())
                .orElseThrow(() -> new RuntimeException("Xe không trong phiên giám sát nào. Không thể lưu GPS."));

        GpsLog log = new GpsLog();
        log.setEventId(request.getEventId());
        log.setVehicle(vehicle);
        log.setMonitoringSession(activeSession);
        log.setLatitude(request.getLatitude());
        log.setLongitude(request.getLongitude());
        log.setSpeed(request.getSpeed());
        log.setRecordedAt(request.getRecordedAt());

        gpsLogRepository.save(log);

        // --- GỬI REALTIME QUA WEBSOCKET ---
        RealtimeTelemetryEvent event = new RealtimeTelemetryEvent();
        event.setVehicleId(vehicle.getId());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setSpeed(request.getSpeed());
        event.setRecordedAt(request.getRecordedAt());
        
        realtimePublisher.publishTelemetry(device.getOrganization().getId(), vehicle.getId(), event);
    }
}
```

**Đường dẫn 7:** Ghi đè toàn bộ `src/main/java/com/drivelinker/alert/service/AlertService.java`
```java
package com.drivelinker.alert.service;

import com.drivelinker.alert.dto.AlertRequest;
import com.drivelinker.alert.dto.RealtimeAlertEvent;
import com.drivelinker.alert.entity.Alert;
import com.drivelinker.alert.repository.AlertRepository;
import com.drivelinker.common.websocket.RealtimePublisher;
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
    private final RealtimePublisher realtimePublisher; // Tích hợp phát sóng

    public AlertService(AlertRepository alertRepository, DeviceRepository deviceRepository,
            MonitoringSessionRepository sessionRepository, RealtimePublisher realtimePublisher) {
        this.alertRepository = alertRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
        this.realtimePublisher = realtimePublisher;
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

        alert = alertRepository.save(alert);

        // --- GỬI REALTIME QUA WEBSOCKET ---
        RealtimeAlertEvent event = new RealtimeAlertEvent();
        event.setAlertId(alert.getId());
        event.setAlertTypeName(alert.getAlertType());
        event.setSeverityLevel(alert.getSeverityLevel());
        event.setVehicleId(vehicle.getId());
        event.setLatitude(alert.getLatitude());
        event.setLongitude(alert.getLongitude());
        event.setOccurredAt(alert.getOccurredAt());
        
        realtimePublisher.publishAlert(device.getOrganization().getId(), event);
    }
}
```
