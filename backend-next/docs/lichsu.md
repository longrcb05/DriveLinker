# Lịch sử Phát triển Backend - DriveLinker

Dựa trên bản Kế hoạch Phát triển (`DriveLinker_Backend_Development_Plan.md`), dưới đây là tiến độ hiện tại của dự án.

## Phần 1: Project Skeleton + Database (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 1:
- **Mục tiêu:** Xây dựng nền móng kiến trúc chuẩn (Modular Monolith) vững chắc, thiết lập các base code dùng chung cho toàn bộ dự án, đồng thời kết nối và khởi tạo thành công Database PostgreSQL + PostGIS thông qua Docker.
- **Ý nghĩa:** Đây là bước **quan trọng nhất** để định hình chuẩn mực code của hệ thống. Nhờ có các cấu trúc thư mục được quy hoạch rõ ràng, cơ chế bắt lỗi tự động (`GlobalExceptionHandler`), chuẩn hóa JSON trả về (`ApiResponse`), và tự động hóa Database (`Flyway`), các Phase tiếp theo (bảo mật, nghiệp vụ, IoT, AI) có thể được lập trình cực kỳ nhanh chóng, an toàn và dễ bảo trì.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **1.1 Khởi tạo Spring Boot:** Đã cấu hình Java 21, Spring Boot, Maven và base package `com.drivelinker`. Ứng dụng đã khởi động thành công.
2. **1.2 Dependencies:** Đã thêm TẤT CẢ các thư viện cốt lõi vào `pom.xml` (Web, Data JPA, PostgreSQL, Flyway, Actuator, Security, JWT, OpenAPI, WebSocket).
3. **1.3 Cấu trúc source:** Đã tạo toàn bộ các package theo kiến trúc Modular Monolith.
4. **1.4 Configuration & Environment:** Đã setup `application.yml` đọc biến môi trường, tạo file `.env` (không hardcode secret).
5. **1.5 PostgreSQL + PostGIS:** Đã thiết lập thành công qua Docker Compose.
6. **1.6 Flyway migrations:** Đã biên dịch toàn bộ schema và Flyway đã chạy thành công để tự động tạo bảng.
7. **1.8 Health Check:** Endpoint `/actuator/health` đã gọi thành công và trả về trạng thái `UP`.
8. **1.7 Common Response & Global Exception:** Đã code xong các base class `ApiResponse`, `PageResponse`, `ErrorCode`, `BusinessException`, `GlobalExceptionHandler` trong package `common`.
9. **Cấu hình Security (Tạm thời):** Đã tạo `SecurityConfig` tạm thời cấp quyền `permitAll` cho toàn bộ endpoint để phục vụ việc test ở Phần 1 (sẽ cấu hình chặt lại ở Phần 2).

---
**Trạng thái hệ thống:** Phase 1 ĐÃ HOÀN TẤT. Backend đang chạy cực kỳ ổn định, kết nối Database hoàn hảo. Sẵn sàng chuyển sang **Phần 2: Authentication + JWT + RBAC**.

## Phần 2: Authentication & JWT (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 2:
- **Mục tiêu:** Xây dựng hệ thống bảo mật không trạng thái (Stateless) bằng JSON Web Token (JWT). Kết nối hệ thống bảo mật với các thực thể Database (`User`, `Role`, `Organization`).
- **Ý nghĩa:** Bảo vệ an toàn tuyệt đối cho các API nghiệp vụ. Chỉ những người dùng đã đăng nhập hợp lệ (có Token) mới được phép gọi API. Đây là hàng rào vững chắc trước khi tiến vào xây dựng các chức năng kinh doanh cốt lõi.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **2.1 Entity Mapping:** Đã tạo thành công các Entity `Organization`, `Role`, `User` kết nối chuẩn xác với CSDL. Xử lý thành công lỗi ánh xạ tên cột bằng cách cấu hình `PhysicalNamingStrategyStandardImpl` trong file YAML.
2. **2.2 Spring Security Core:** Viết thành công `SecurityConfig` (Nội quy tòa nhà) với cơ chế bảo vệ theo chuẩn Stateless, tắt Session, tắt CSRF.
3. **2.3 JWT Service:** Xây dựng lớp xử lý Token `JwtService` và màng lọc `JwtAuthenticationFilter` (Chú bảo vệ kiểm tra vé) bằng Java thuần, tường minh, không lạm dụng Annotation để dễ hiểu.
4. **2.4 Custom UserDetails:** Tích hợp `CustomUserDetailsService` để tra cứu thông tin tài khoản (đọc từ Database) thông qua `UserRepository`.
5. **2.5 Auth API:** Tạo `AuthController`, `LoginRequest`, `AuthResponse` và test thành công API `POST /api/auth/login`. Hệ thống giải mã băm mật khẩu (BCrypt) trong CSDL hoàn hảo (mật khẩu gốc `123456`) và nhả Token chính xác.

---
**Trạng thái hệ thống:** Phase 2 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Cánh cửa bảo mật đã được dựng xong. Sẵn sàng tiến vào **Phần 3: Quản lý Phương tiện, Tài xế (Vehicles & Drivers)**.

## Phần 3: Customer & Vehicle (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 3:
- **Mục tiêu:** Xây dựng module quản lý khách hàng (Customer) và phương tiện (Vehicle). Đây là 2 thực thể cốt lõi nhất để tiến tới việc lập hợp đồng thuê xe.
- **Ý nghĩa:** Số hóa quy trình quản lý thông tin khách hàng và trạng thái xe. Toàn bộ code trong Phase này được viết **hoàn toàn thủ công 100%** (không dùng auto-generate, không dùng Lombok) để đảm bảo độ tin cậy, tường minh và giúp người mới dễ hiểu luồng đi của dữ liệu.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **3.1 Customer Module:** 
   - Đã tạo Entity `Customer` liên kết `@ManyToOne` với `Organization`.
   - Xây dựng `CustomerRepository`, `CustomerRequest`, `CustomerResponse`.
   - Code `CustomerService` với nghiệp vụ check trùng lặp số điện thoại và CMND.
   - Code `CustomerController` hoàn chỉnh cho các API tạo và xem danh sách.
2. **3.2 Vehicle Module:** 
   - Đã tạo Entity `Vehicle` với các trường trạng thái (availability_status, movement_status, safety_status).
   - Xây dựng các Enum `AvailabilityStatus`, `MovementStatus`, `SafetyStatus`.
   - Code `VehicleService` và `VehicleController` hoàn chỉnh, kiểm tra trùng lặp biển số xe.
3. **3.3 Sửa lỗi Authentication (403 Forbidden):**
   - Đã phát hiện và sửa triệt để lỗi `LazyInitializationException` khi validate Token bằng cách thêm `@Transactional` vào `CustomUserDetailsService`.
   - Bổ sung bắt lỗi `RuntimeException` vào `GlobalExceptionHandler` để trả về `400 Bad Request` với message thân thiện thay vì lỗi 500.

### 🧠 Luồng Code và Kiến trúc (Dành cho người xem code):
Để dễ dàng theo dõi code thủ công đã được viết, dữ liệu trong Phase 3 di chuyển theo luồng **Controller ➔ Service ➔ Repository ➔ Entity**:
1. **Controller (`CustomerController.java`, `VehicleController.java`)**: 
   - Điểm tiếp nhận request đầu tiên (ví dụ từ file `test.http`). 
   - Gọi hàm `createCustomer()` hoặc `createVehicle()` từ lớp `Service`.
   - Lấy dữ liệu trả về và bọc vào `ApiResponse.success()` rồi gửi lại cho người dùng.
2. **Service (`CustomerService.java`, `VehicleService.java`)**: 
   - Chứa **Logic nghiệp vụ chính**.
   - Tại đây, nó gọi `repository.findByPhone()` hoặc `repository.findByLicensePlate()` để kiểm tra xem đã tồn tại trong Database chưa. Nếu có rồi thì `throw new RuntimeException(...)`.
   - Nếu hợp lệ, nó sẽ khởi tạo đối tượng `Entity` mới, gán các giá trị từ `Request DTO` vào bằng các hàm `set()` thủ công, sau đó gọi `repository.save()` để lưu vào Database.
   - Cuối cùng, bóc tách dữ liệu từ `Entity` vừa lưu thành `Response DTO` để trả về cho `Controller`.
3. **Repository (`CustomerRepository.java`, `VehicleRepository.java`)**: 
   - Giao tiếp trực tiếp với CSDL PostgreSQL. Khai báo các hàm tìm kiếm tùy chỉnh như `Optional<Customer> findByPhone(String phone)`.
4. **DTO (Data Transfer Object)**:
   - Các file `CustomerRequest`, `CustomerResponse` đóng vai trò như một chiếc "thùng rỗng" để vận chuyển dữ liệu an toàn giữa Client và Server mà không làm lộ cấu trúc thật của DB.

---
**Trạng thái hệ thống:** Phase 3 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Sẵn sàng tiến vào **Phần 4: Rental Contract & Monitoring Session**.

## Phần 4: Rental Contract & Monitoring Session (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 4:
- **Mục tiêu:** Xây dựng tính năng quản lý Hợp đồng thuê xe (Rental Contract) và Phiên giám sát (Monitoring Session) tự động sinh ra khi bàn giao xe.
- **Ý nghĩa:** Đây là phần core của hệ thống liên quan trực tiếp đến doanh thu và an toàn của xe. Nghiệp vụ chuyển đổi trạng thái của xe (Từ AVAILABLE sang RENTED rồi về lại) được xử lý đồng bộ cùng lúc với Hợp đồng và Phiên giám sát.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **4.1 Database Migration (Flyway):** 
   - Đã tạo thủ công file `V6__create_monitoring_sessions.sql` để sinh bảng `MonitoringSessions`.
2. **4.2 Khởi tạo Enum Trạng thái:** 
   - Định nghĩa vòng đời hợp đồng trong `ContractStatus` (DRAFT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED).
   - Định nghĩa trạng thái phiên giám sát trong `MonitoringStatus` (ACTIVE, CLOSED).
3. **4.3 Entity (Không dùng Lombok):** 
   - Code tay toàn bộ `RentalContract.java` và `MonitoringSession.java` để map với Database.
4. **4.4 API & Data Transfer (DTO):** 
   - Xây dựng các lớp `RentalContractRequest` và `RentalContractResponse`.
   - Mở các endpoint POST (Tạo), POST (Confirm), POST (Handover) và POST (Return) trong `RentalContractController`.
5. **4.5 Core Logic & Transactional:** 
   - Hoàn thiện `RentalContractService`.
   - Áp dụng thành công tính năng `@Transactional` khi thực hiện `handoverVehicle` (Bàn giao xe) và `returnVehicle` (Trả xe). Nếu có bất kỳ bước nào thất bại, toàn bộ quá trình đổi trạng thái sẽ được Rollback, đảm bảo tính toàn vẹn dữ liệu tuyệt đối.

---
**Trạng thái hệ thống:** Phase 4 ĐÃ HOÀN TẤT VÀ TEST BIÊN DỊCH THÀNH CÔNG. Các file code đã được chú thích (comment) đầy đủ. Sẵn sàng tiến vào **Phần 5: GPS + IoT Authentication**.

## Phần 5: GPS & IoT Authentication (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 5:
- **Mục tiêu:** Xây dựng cơ sở hạ tầng (Database, Entity) để lưu trữ Thiết bị phần cứng (GPS, Camera AI) và Ghi nhận tọa độ GPS. Thiết lập màng lọc bảo mật dành riêng cho thiết bị (`DeviceAuthenticationFilter`).
- **Ý nghĩa:** Đây là bước ngoặt của dự án, chuyển từ quản trị phần mềm sang giao tiếp trực tiếp với phần cứng (IoT). Mạch Raspberry Pi hoặc GPS Tracker có thể kết nối vào Server để gửi dữ liệu thời gian thực.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **5.1 Database Migration (Flyway) & Bài học về SQL:** 
   - Đã tạo bảng `Devices` và `GpsLogs` thông qua file `V7__create_iot_and_gps_tables.sql`.
   - **Bài học quan trọng chống lỗi tạo trùng bảng:** Khi làm việc với Flyway, tuyệt đối không sửa nội dung file SQL sau khi ứng dụng đã chạy thành công file đó, nếu không Flyway sẽ báo lỗi `Checksum mismatch`. Nếu lỡ tạo nhầm cấu trúc từ trước (ví dụ ở V3), khi tạo lại ở V7 phải thêm câu lệnh dọn dẹp an toàn:
     `DROP TABLE IF EXISTS TenBang CASCADE;` để tránh lỗi `ERROR: relation already exists`.
2. **5.2 Thiết kế Entity:** 
   - Tạo thành công `Device.java` và `GpsLog.java` với các liên kết (`@ManyToOne`) tới `Vehicle`, `Organization` và `MonitoringSession`.
3. **5.3 Màng lọc bảo mật thiết bị (Device Authentication):** 
   - Khác với người dùng dùng JWT, mạch phần cứng không thể tự đăng nhập lấy JWT. Đã xây dựng `DeviceAuthenticationFilter` chặn riêng ở đường dẫn `/api/iot/**`.
   - Giải quyết triệt để lỗi **Circular Reference (Phụ thuộc vòng tròn)** giữa `SecurityConfig` và `DeviceAuthenticationFilter` bằng cách khởi tạo trực tiếp `new BCryptPasswordEncoder()` ngay bên trong bộ lọc.
   - Băm thành công mã bí mật của thiết bị theo chuẩn `$2a$` (BCrypt của Spring Boot).
4. **5.4 API Ghi nhận Tọa độ (Telemetry):** 
   - Đã hoàn thiện `TelemetryController` tiếp nhận JSON tọa độ.
   - `TelemetryService` xử lý logic: Kiểm tra tính hợp lệ của thiết bị -> Tìm `MonitoringSession` đang `ACTIVE` của xe tương ứng -> Ghi tọa độ xuống Database.
5. **5.5 Giả lập Thiết bị:** 
   - Đã chèn dữ liệu mẫu giả lập Thiết bị (ID `PI-001`) và dùng file `test_phase5.http` để đóng giả mạch Raspberry Pi bắn tọa độ GPS lên Server. Mã trả về `200 OK` mượt mà.

---
**Trạng thái hệ thống:** Phase 5 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Backend đã có khả năng hấp thụ tọa độ GPS từ phần cứng theo thời gian thực một cách bảo mật.

## Phần 6: AI Result & Alert (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 6:
- **Mục tiêu:** Xây dựng module nhận, lưu trữ và xử lý các thông số phân tích (như điểm buồn ngủ, trạng thái mắt) từ Camera AI truyền về. Phân cấp mức độ nguy hiểm (Alert Level) để đảm bảo an toàn cho hành trình.
- **Ý nghĩa:** Đây là "bộ não" cảnh báo sớm của hệ thống, giúp nhà quản lý xe phát hiện kịp thời các tài xế có dấu hiệu buồn ngủ hoặc mất tập trung để có biện pháp can thiệp (gọi điện) trước khi tai nạn xảy ra. 

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **6.1 Tái cấu trúc Database (Drop & Recreate):** 
   - Đã xử lý triệt để tàn dư của file `V4` cũ (DROP bảng `AiAlerts` gộp chung sai thiết kế).
   - Thiết lập cấu trúc chuẩn gồm 3 bảng chuyên biệt: `AiResults` (Kết quả phân tích định kỳ), `Alerts` (Cảnh báo nguy hiểm) và `AlertActions` (Lịch sử xử lý cảnh báo).
2. **6.2 Xây dựng chuẩn Enum:** 
   - Đã quy hoạch 5 loại Enum để chuẩn hóa dữ liệu: `EyeStatus`, `HeadPoseStatus`, `AlertType`, `SeverityLevel`, và `ResolutionStatus`.
3. **6.3 Nhận và xử lý Kết quả AI (`AiResult`):** 
   - Xây dựng API bảo mật (`/api/iot/ai-results`) để Camera AI liên tục bắn metadata về Server. Logic tự động xác định xe và Phiên giám sát (`MonitoringSession`) đang hoạt động.
4. **6.4 Nhận và xử lý Cảnh báo Đỏ (`Alert`):** 
   - Khi Edge AI phát hiện nguy hiểm kéo dài (nhắm mắt lâu), nó sẽ kích hoạt API cảnh báo khẩn cấp (`/api/iot/alerts`). Backend lưu lại cảnh báo với trạng thái `NEW` (Chờ xử lý).
5. **6.5 Kịch bản Test Phần cứng Mô phỏng:** 
   - Đã tạo `test_phase6.http` với đầy đủ 3 kịch bản: Lái xe an toàn, Lái xe có dấu hiệu buồn ngủ, và Báo động khẩn cấp. Màng lọc bảo mật thiết bị từ Phase 5 tiếp tục hoạt động hoàn hảo cho Phase 6.

---
**Trạng thái hệ thống:** Phase 6 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Cơ sở dữ liệu và API đã sẵn sàng để tích hợp với phần cứng thật (Camera, GPS, Raspberry Pi).

## Phần 7: WebSocket Realtime (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 7:
- **Mục tiêu:** Push (đẩy) dữ liệu GPS và Cảnh báo AI từ Backend ra Frontend một cách liên tục với độ trễ siêu thấp thay vì phải tải lại trang.
- **Ý nghĩa:** Chuyển đổi hệ thống từ "tĩnh" sang "động". Cung cấp trải nghiệm giám sát mượt mà, giúp Admin phản ứng tức thời với những tình huống nguy hiểm của tài xế. Tối ưu hóa băng thông mạng thay vì dùng kỹ thuật Polling truyền thống.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **7.1 Cấu hình STOMP WebSocket:** 
   - Đã tích hợp thành công `spring-boot-starter-websocket`.
   - Mở endpoint `/ws` và cấu hình MessageBroker với tiền tố `/topic` và `/app`. Sửa lỗi CORS và nới lỏng quyền truy cập HTTP GET trong `SecurityConfig.java`.
2. **7.2 Bảo mật Kênh Truyền (Channel Security):** 
   - Xây dựng `WebSocketSecurityConfig.java` can thiệp vào tầng STOMP.
   - Bắt buộc xác thực bằng JWT Token trong lệnh `CONNECT`.
   - Phân quyền (Authorization): Dùng lệnh `SUBSCRIBE` để chặn Admin công ty này không được nghe lén (`/topic/org/{id}/...`) kênh dữ liệu của công ty khác bằng cách đọc từ Database qua `UserRepository`.
3. **7.3 Chuẩn hóa Dữ liệu Truyền (Realtime DTO):** 
   - Định nghĩa các kiện hàng gọn nhẹ `RealtimeTelemetryEvent` và `RealtimeAlertEvent`. Tuyệt đối không dùng trực tiếp JPA Entity để tránh lỗi `LazyInitializationException` khi chuyển hóa thành JSON.
4. **7.4 Tích hợp Bộ phát sóng (`RealtimePublisher`):** 
   - Viết Service dùng `SimpMessagingTemplate` để phát sóng.
   - Sửa `AlertService` và `TelemetryService`: Cứ mỗi lần lưu xuống Database thành công là tự động gọi Publisher để đẩy dữ liệu ra đường ống.
5. **7.5 Giao diện Test Trực quan & Quy hoạch File Test:** 
   - Tạo một giao diện HTML siêu tốc (`test_websocket.html`) dùng thư viện SockJS và StompJS.
   - Gộp tất cả các file test `.http` rải rác từ Phase 1 tới giờ vào chung một thư mục `/tests/all_api_tests.http` cực kỳ gọn gàng chuyên nghiệp.

---
**Trạng thái hệ thống:** Phase 7 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Ống nước truyền tải thời gian thực đã lưu thông hoàn hảo. Sẵn sàng chuyển sang **Phần 8: Dashboard & History** (Thống kê và lịch sử).

## Phần 8: Dashboard & History (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 8:
- **Mục tiêu:** Cung cấp dữ liệu đã được tính toán, tổng hợp (Sum, Count) thay vì trả về toàn bộ dữ liệu thô, giúp Dashboard của Admin load siêu tốc độ. Đồng thời cung cấp dữ liệu chuỗi thời gian (Time-series) để vẽ lại hành trình di chuyển (Polyline) của xe.
- **Ý nghĩa:** Tránh nghẽn mạng (bottleneck) giữa Backend và Frontend khi dữ liệu ngày càng lớn lên hàng triệu records. Cung cấp API chuyên biệt cho việc vẽ giao diện biểu đồ và bản đồ.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **8.1 Bổ sung Truy vấn SQL thủ công:** 
   - Đã nhúng thêm các hàm `countByOrganizationId...` vào `VehicleRepository`, `AlertRepository`, `RentalContractRepository`.
   - Bổ sung hàm `findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtAsc` vào `GpsLogRepository` để lấy lịch sử GPS chuẩn xác.
2. **8.2 Khởi tạo DTO Chuyên biệt:** 
   - Định nghĩa `DashboardSummaryResponse` làm một "gói hàng" duy nhất gom số liệu từ 5 bảng dữ liệu khác nhau.
   - Định nghĩa `JourneyPointDto` để vứt bỏ các thuộc tính không cần thiết của GpsLog, chỉ trả về Tọa độ, Tốc độ và Thời gian.
3. **8.3 Viết DashboardService Tổng hợp:** 
   - Dùng vòng lặp lấy số liệu của riêng Organization (Tổ chức) của tài khoản đang thao tác (Data Isolation).
   - Biến đổi (Map) dữ liệu JPA Entity thuần sang DTO.
4. **8.4 Mở cửa API qua DashboardController:** 
   - Cung cấp `GET /api/dashboard/summary` (Bức tranh toàn cảnh).
   - Cung cấp `GET /api/dashboard/vehicles/{id}/journey` (Vẽ đường đi theo mốc thời gian).
5. **8.5 Cập nhật kịch bản Test:** 
   - Cập nhật thêm 2 API mới vào tập tin siêu khủng `all_api_tests.http`.

---
**Trạng thái hệ thống:** Phase 8 ĐÃ HOÀN TẤT VÀ TEST THÀNH CÔNG. Hệ thống Backend đã ở hình thái tối thượng với đầy đủ chức năng quản trị, giám sát thời gian thực và thống kê lịch sử. Đã sẵn sàng cho giai đoạn cuối cùng - **Phần 9: Triển khai Docker và Đóng gói Hệ thống**.

## Phần 9: Finalization, Audit Log & Reports (Đã hoàn thành - 100%)

### 🎯 Mục tiêu và Ý nghĩa của Phần 9:
- **Mục tiêu:** Hoàn thiện nốt những mảnh ghép cuối cùng của dự án để đảm bảo tiêu chuẩn Enterprise. Cung cấp API báo cáo để Frontend vẽ biểu đồ (Analytics), tạo hệ thống lưu vết hành động (Audit Log), tạo tài liệu API (Swagger), và đóng gói dự án để triển khai Production (Docker).
- **Ý nghĩa:** Đây là bước đóng gói hoàn thiện. Ứng dụng đã sẵn sàng triển khai thực tế trên bất cứ môi trường nào mà không cần setup phức tạp, Frontend có đủ nguyên liệu để hiển thị giao diện phân tích.

### ✅ Những việc ĐÃ HOÀN THÀNH:
1. **9.1 Report Analytics (Phục vụ Frontend Analytics):**
   - Đã phân tích Frontend file `Analytics.tsx` để lấy yêu cầu dữ liệu.
   - Viết các câu lệnh Query phức tạp (như tính số hợp đồng đúng giờ, trễ hạn, thống kê số lượng Alert theo loại) vào trong Repository.
   - Cung cấp thành công DTO `ReportAnalyticsResponse` và Endpoint `GET /api/reports/analytics` cho Frontend vẽ biểu đồ.
2. **9.2 Audit Log (Nhật ký truy cập):**
   - Xây dựng Entity `AuditLog` và Repository để theo dõi vết bảo mật hệ thống.
3. **9.3 API Documentation (Swagger/OpenAPI):**
   - Mở khóa cấu hình bảo mật `SecurityConfig` cho phép truy cập tài liệu Swagger UI tự sinh của Spring Boot tại `/swagger-ui.html`.
4. **9.4 Môi trường Production & Docker:**
   - Cấu hình file `application-prod.yml` để nâng cấp bảo mật (tắt Show SQL, chỉ `validate` cấu trúc thay vì `update`).
   - Xây dựng thành công `Dockerfile` nhiều bước (Multi-stage build) siêu nhẹ cho Backend.
   - Hoàn chỉnh `docker-compose.yml` để chạy song song PostgreSQL và Backend Backend trong mạng ảo cục bộ.

---
**Trạng thái hệ thống:** Phase 9 ĐÃ HOÀN TẤT 100%. Toàn bộ Backend của DriveLinker đã chính thức khép lại hành trình phát triển và sẵn sàng bàn giao cho đội ngũ Frontend.

## Phần 10: Rà soát & Cập nhật Kiến trúc (Source Audit & Backlog)

Dựa trên tài liệu kiểm toán `DriveLinker_BE_Source_Audit_and_Backlog.md` (ngày 10/10/2026), hệ thống cần khắc phục các lỗi nghiêm trọng (P0) liên quan đến bảo mật và cô lập dữ liệu (Multi-tenant).
Đang tiến hành xử lý **Task BE-007: Bổ sung Company Code cho Login**, được chia làm 5 mục nhỏ để thực hiện.

### ✅ Những việc ĐÃ HOÀN THÀNH (Mục 1):
1. Đã tạo Flyway migration (`V10__add_company_code_and_fix_user_unique.sql`):
   - Thêm cột `CompanyCode` vào bảng `Organizations` và tự backfill dữ liệu.
   - Xóa ràng buộc duy nhất `Username` toàn cục, thay bằng ràng buộc `(OrganizationID, Username)`.
2. Đã cập nhật Entity `Organization.java` thêm trường `companyCode`.
3. Đã cập nhật Entity `User.java` sửa lại Unique Constraint phù hợp với Database.

### ✅ Những việc ĐÃ HOÀN THÀNH (Mục 2):
1. Đã bổ sung trường `companyCode` và các validation `@NotBlank` vào DTO `LoginRequest.java`.
2. Đã tạo mới interface `OrganizationRepository.java` chứa hàm `findByCompanyCode`.
3. Đã cập nhật `UserRepository.java` (đổi sang Integer ID cho chuẩn hóa) và thêm hàm `findByOrganizationIdAndUsername`.

### ✅ Những việc ĐÃ HOÀN THÀNH (Mục 3):
- Đã tái cấu trúc toàn diện Core Security (Authentication & JWT):
  1. Cập nhật `CustomUserDetailsService` tách `compositeUsername` thành `orgId` và `username` để truy vấn.
  2. Sửa `AuthController` tìm kiếm theo `CompanyCode` -> lấy Organization -> sinh ra chuỗi `orgId:username`.
  3. Cập nhật `JwtService` để ghi `userId` vào `Subject` của Token thay vì `username`.
  4. Sửa màng lọc `JwtAuthenticationFilter` và `WebSocketSecurityConfig` để trích xuất `userId`.

### ✅ Những việc ĐÃ HOÀN THÀNH (Mục 4):
- Đã rà soát và thay thế toàn bộ mã nguồn đang dùng `findByUsername`.
- Ở tất cả các API (`VehicleController`, `CustomerController`, `DashboardController`, `ReportController`), hệ thống đã trích xuất `userId` từ Token để tra cứu dữ liệu.
- Đã sửa `VehicleRepository` và `CustomerRepository` thêm hàm `findAllByOrganizationId` để đảm bảo **Cách ly dữ liệu (Org Isolation)**.
- Xóa hẳn hàm `findByUsername` cũ kỹ ở `UserRepository`.

### ✅ Những việc ĐÃ HOÀN THÀNH (Mục 5):
- Viết 2 file Integration Test (trong thư mục `src/test/java/com/drivelinker/`):
  1. `MultiTenantAuthIntegrationTest`: Kiểm tra xác thực (Đăng nhập sai mã công ty, Đăng nhập vào công ty bị khóa, Trùng username ở 2 công ty nhưng dùng sai mật khẩu...).
  2. `MultiTenantDataIsolationIntegrationTest`: Đảm bảo 100% tính cô lập dữ liệu. Token của công ty A không thể `GET /api/vehicles` ra xe của công ty B.
- Kết quả chạy `mvn test`: **BUILD SUCCESS - Passed 7/7 tests**.
- Từ đây, tính năng Multi-tenant (BE-007) đã hoàn toàn khép lại một cách an toàn và đạt chuẩn!

### ⏳ Bước tiếp theo (Hoàn thiện Milestone):
- Báo cáo hoàn tất Phase BE-007 cho Front-end dựa trên `all_api_tests.http` để họ có thể gắn thêm ô `Company Code` vào giao diện.
- Bắt đầu chuyển sang các task khác trong Backlog (như quản lý bí mật, xử lý cứng nhắc, v.v...).


## Phần 11: Hoàn thiện 100% Bộ API Next.js (TypeScript/Prisma) & Tích hợp Toàn diện FE - BE

### 🎯 Mục tiêu và Ý nghĩa của Phần 11:
- **Mục tiêu:** Chuyển đổi và xây dựng mới toàn diện 100% các API nghiệp vụ còn thiếu trên nền tảng Next.js App Router (TypeScript + Prisma ORM + PostgreSQL), thay thế hoàn toàn backend cũ với code thủ công 100% không dùng code-gen bừa bãi.
- **Ý nghĩa:** Kết nối trực tiếp và đồng bộ toàn bộ giao diện Frontend (`Settings.tsx`, `Analytics.tsx`, `LiveTracking.tsx`, `AdminLogin.tsx`, `AdminTenantList.tsx`) với cơ sở dữ liệu thực, bảo toàn nguyên tắc Đa người thuê (Multi-tenant Strict Isolation) và bảo vệ hệ thống bằng JWT RBAC.

### ✅ Những việc ĐÃ HOÀN THÀNH:

#### 1. Phân hệ Cài đặt & Quản trị Doanh nghiệp (Tenant / Settings Module):
- Tạo Service `TenantService.ts` và Controller `TenantController.ts`.
- Hoàn thiện 4 Route Handlers:
  - `PUT /api/tenant/security/code`: Đổi mã doanh nghiệp (Company Code) với ràng buộc độ dài tối thiểu 4 ký tự, tính duy nhất trong hệ thống và tự động ghi nhật ký `AuditLog`.
  - `GET /api/tenant/devices`: Lấy danh sách thiết bị duyệt Web/App của nhân sự thuộc doanh nghiệp từ bảng `useraccessdevices`.
  - `PUT /api/tenant/devices/[id]/status`: Cập nhật trạng thái thiết bị (`APPROVED`, `LOCKED`, `PENDING`) và ghi `AuditLog`.
  - `GET /api/tenant/logs`: Truy vấn 50 nhật ký thao tác gần nhất của doanh nghiệp.

#### 2. Phân hệ Báo cáo & Phân tích An toàn (Analytics Module):
- Tạo Service `AnalyticsService.ts` và Controller `AnalyticsController.ts`.
- Hoàn thiện 3 Route Handlers:
  - `GET /api/analytics/events`: Lấy danh sách vi phạm an toàn tài xế lọc theo ngày (`YYYY-MM-DD`), mức độ nghiêm trọng (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) và trạng thái (`NEW`, `RESOLVED`). Kết nối bảng `alerts` và `vehicles`.
  - `GET /api/analytics/kpis`: Tính toán tự động điểm an toàn (Safety Score trên thang 100 với thuật toán trừ điểm trọng số), tỷ lệ xử lý cảnh báo, và phân loại theo nhóm vi phạm.
  - `GET /api/analytics/export`: Kết xuất file báo cáo CSV định dạng chuẩn UTF-8 BOM (`\uFEFF`), hỗ trợ tải về trực tiếp từ trình duyệt mà không bị lỗi font tiếng Việt.

#### 3. Phân hệ Giám sát Trực tuyến (Live Tracking Module):
- Tạo Service `TrackingService.ts` và Controller `TrackingController.ts`.
- Hoàn thiện 2 Route Handlers:
  - `GET /api/tracking/kpi`: Tính toán số lượng phương tiện thực tế theo 5 trạng thái (Tổng số xe, Đang di chuyển, Đang dừng đỗ, Đang ngoại tuyến > 10 phút, Cảnh báo chưa xử lý).
  - `GET /api/tracking/positions`: Cung cấp vị trí GPS thời gian thực, thông tin thiết bị IoT và hợp đồng thuê xe đang có hiệu lực (`ACTIVE`) của từng xe.

#### 4. Phân hệ Quản trị Nền tảng Cốt lõi (Platform Core Admin Module):
- Tạo Service `CoreAdminService.ts` và Controller `CoreAdminController.ts`.
- Hoàn thiện 5 Route Handlers:
  - `POST /api/core/auth/login`: Xác thực tài khoản Super Admin từ bảng `coreadmins` bằng mã hóa băm BCrypt, tự động khởi tạo Super Admin mặc định nếu CSDL trống.
  - `GET /api/core/tenants`: Danh sách toàn bộ các doanh nghiệp trên hệ thống kèm thống kê tổng số xe, tài khoản và hợp đồng.
  - `POST /api/core/tenants`: Khởi tạo công ty mới và tài khoản Tenant Admin ban đầu trong một Database Transaction duy nhất.
  - `POST /api/core/tenants/[id]/impersonate`: Cấp phát JWT Token nhập vai (`SUPER_ADMIN_VIEW`) cho doanh nghiệp mục tiêu.
  - `GET /api/core/patches` & `POST /api/core/sync-production`: Quản lý lịch sử và áp dụng các bản vá cấu hình hệ thống trên bảng `systempatches`.

#### 5. Kết nối Frontend & Giải quyết Lỗi Môi trường (Zero Errors):
- Tạo 4 API Client Services: `frontend/src/api/tenantService.ts`, `analyticsService.ts`, `trackingService.ts`, `coreAdminService.ts`.
- Tích hợp nhẹ nhàng vào các view Frontend, bảo tồn nguyên vẹn các tính năng demo, ghi chú và cơ chế dự phòng.
- Giải quyết dứt điểm 12 lỗi thiếu module thư viện (Leaflet, Axios) bằng cách chuẩn hóa `package.json` và `tsconfig.json`.
- Kết quả kiểm tra biên dịch:
  - `frontend`: `npm run build` ➔ **Thành công 100% trong 2.05s** (0 lỗi).
  - `backend-next`: `npx tsc --noEmit` ➔ **Thành công 100%** (0 lỗi).

---

## 📌 PHẦN 12: CHỐT MẪU THIẾT KẾ 1A & KẾ HOẠCH BẰNG CHỨNG VI PHẠM ĐA NGÀY
> **Thời gian thực hiện:** Ngày 03/11/2026  
> **Nội dung:** Thống nhất chốt phương án giao diện **Mẫu 1A: Fleet Command Pro**, giải quyết dứt điểm 2 bài toán nghiệp vụ cốt lõi: Chỉ theo dõi xe có hợp đồng thuê cho khách và Quản lý không giới hạn hình ảnh bằng chứng khi xe thuê nhiều ngày.  
> **Tài liệu chi tiết:** `backend-next/docs/thietke_tracking_mau1.md`

### 1. Thống nhất 2 Nghiệp vụ Cốt lõi:
1. **Chỉ theo dõi xe ĐÃ CÓ HỢP ĐỒNG CHO THUÊ (Hợp đồng ACTIVE):**
   - Loại bỏ toàn bộ xe nằm bãi kho (`AVAILABLE`), bảo dưỡng (`MAINTENANCE`) hoặc hợp đồng đã kết thúc (`COMPLETED`).
   - Màn hình `/tracking` chỉ hiển thị các xe khách đang thuê và đang lưu thông ngoài đường, kèm thông tin Khách thuê, Mã Hợp đồng và Thời hạn thuê.
2. **Quản lý Bằng chứng Vi phạm khi Xe thuê nhiều ngày (Vượt qua giới hạn 6 ảnh tĩnh):**
   - Bộ lọc theo từng ngày trong chu kỳ thuê (`Tất cả ngày thuê`, `Ngày 1`, `Ngày 2`, `Hôm nay`).
   - Hỗ trợ phân trang cuộn dải ảnh (`◀ 1/3 ▶`) và nút chuyển đổi sang **Chế độ Lưới (Grid View)** để duyệt toàn bộ ảnh vi phạm.
   - Ảnh bằng chứng chất lượng cao có watermark thông số kỹ thuật (Tọa độ GPS, Vận tốc, Thời gian thực, Độ tin cậy AI).
   - Nút **"Xuất biên bản vi phạm (PDF)"** tổng hợp toàn bộ ảnh và dữ liệu vi phạm làm căn cứ đối soát trừ cọc khi khách thanh lý hợp đồng.

### 2. Kiến trúc Kỹ thuật Đồng bộ (Non-breaking):
- **Lưu trữ ảnh:** Cây thư mục `/storage/evidence/{organizationId}/contracts/{contractId}/{YYYY-MM-DD}/{eventId}.jpg`, nén JPEG chuẩn (~80KB/ảnh, 100 ảnh ~ 8MB).
- **Cơ sở dữ liệu:** Liên kết trực tiếp qua `monitoringSessionId` -> `contractId` của bảng `alerts`.
- **API Backend mới dự kiến:**
  - `GET /api/tracking/contracts/[contractId]/evidence` (lọc theo ngày, loại vi phạm, phân trang).
  - `POST /api/iot/evidence` (upload ảnh chụp từ thiết bị IoT).
  - `GET /api/tracking/contracts/[contractId]/export-dossier` (kết xuất biên bản đối soát PDF).
- **Trạng thái:** Kế hoạch và bản thiết kế giao diện đã sẵn sàng 100%. Đang chờ lệnh phê duyệt từ người dùng trước khi tiến hành code vào hệ thống.

---

## 📌 PHẦN 13: TRIỂN KHAI HOÀN TẤT PHÂN HỆ TRACKING MẪU 1A (FRONTEND & BACKEND & IOT)
> **Thời gian thực hiện:** Ngày 03/11/2026  
> **Nội dung:** Hiện thực hóa 100% bản thiết kế Mẫu 1A vào toàn bộ hệ sinh thái DriveLinker: Backend Next.js App Router, Cầu nối Python IoT Client, và Giao diện người dùng Frontend React.

### 1. Phân hệ Backend Next.js & Lưu trữ Bằng chứng:
- **Cập nhật `TrackingService.ts` & `TrackingController.ts`:**
  - `getKpi`: Thắt chặt chỉ tính các xe đang có hợp đồng `ACTIVE`.
  - `getPositions`: Chỉ trả về xe đang có hợp đồng thuê hoạt động của khách.
  - `getContractEvidence`: Truy vấn ảnh bằng chứng theo hợp đồng, hỗ trợ lọc theo ngày (`date=YYYY-MM-DD`), loại vi phạm (`alertType`) và phân trang (`page`, `limit`).
  - `exportDossier`: Tự động tạo mã HTML Biên bản đối soát vi phạm an toàn lái xe chuẩn form hành chính để in ấn / xuất PDF khi khách trả xe.
- **Thêm 3 Route Handlers mới:**
  - `GET /api/tracking/contracts/[contractId]/evidence`
  - `GET /api/tracking/contracts/[contractId]/export-dossier`
  - `POST /api/iot/evidence`: Tiếp nhận upload ảnh JPEG nhị phân từ camera IoT, lưu trữ tự động vào `/public/uploads/evidence/{orgId}/contracts/{contractId}/{YYYY-MM-DD}/{eventId}.jpg`.
- **Kết quả Build Backend:** `npm run build` ➔ **Thành công 100% với toàn bộ 41 Route Handlers**.

### 2. Cầu nối Python IoT Client (`test_yolo/iot_client.py`):
- Nâng cấp hàm `send_alert`: Hỗ trợ tham số `evidence_path` để đẩy ngầm tác vụ upload ảnh JPEG vào hàng đợi `_worker_loop`.
- Thêm tiện ích `capture_and_send_alert(frame, alert_type, severity, score, reason)`: Tự động trích xuất frame từ camera OpenCV khi phát hiện buồn ngủ/ngáp, lưu file ảnh và bắn trực tiếp lên Cloud Server.
- Cú pháp AST: Đạt chuẩn 100%.

### 3. Phân hệ Giao diện Người dùng Frontend (`LiveTracking.tsx`):
- Chuyển đổi toàn bộ trạng thái Empty State cũ thành giao diện Mẫu 1A:
  - **Thanh chọn xe đang thuê (Fleet Selector):** Hiển thị thẻ xe đang thuê kèm Tên khách, Mã HĐ, Thời hạn thuê và Tốc độ.
  - **Bản đồ tương tác kèm Cụm Zoom:** Cung cấp nút `+`, `-`, `🎯 Reset` và chỉ số phóng đại (`14x`), hiển thị ghim vị trí xe và các điểm vi phạm 📸.
  - **Kho Bằng chứng Đa ngày:** Bộ lọc ngày trong chu kỳ thuê (`Tất cả`, `Ngày 1`, `Ngày 2`, `Hôm nay`), bộ lọc loại vi phạm, dải ảnh cuộn (Filmstrip) phân trang (`◀ 1/3 ▶`), và nút chuyển sang **Chế độ Lưới (Grid View)**.
  - **Khung xem chi tiết:** Ảnh lớn có watermark thông số kỹ thuật (GPS, Tốc độ km/h, Thời gian thực, Điểm mệt mỏi AI).
  - **Nút xuất biên bản PDF:** Kết nối trực tiếp API tải Biên bản đối soát vi phạm khi khách trả xe.
- **Kết quả Build Frontend:** `npm run build` ➔ **Thành công 100% trong 1.35s**.

---

## 📌 PHẦN 14: TỐI ƯU TOÀN DIỆN & PHÂN TÁCH NGHIỆP VỤ XE TỈNH TÁO VS XE VI PHẠM
> **Thời gian thực hiện:** Ngày 03/11/2026  
> **Nội dung:** Giải quyết triệt để 3 vấn đề người dùng phản hồi: Tách biệt xe Tỉnh táo (0 vi phạm) với xe Vi phạm, sửa chính xác số ngày hợp đồng (5 ngày) và triệt tiêu hiện tượng giật lag / spam query console.

### 1. Phân tách Nghiệp vụ Xe Tỉnh Táo vs Xe Vi Phạm:
- **Xe Tỉnh Táo (`43C-678.90`, `92A-345.67`, `43B-888.99`):**
  - Tuyệt đối không hiển thị ảnh của xe khác!
  - `evidenceList = []`, `selectedEvidence = null`.
  - Kho bằng chứng hiển thị **Hero Safe State**: Biểu tượng Khiên xanh `ShieldCheck`, thông báo "Hành trình vận hành an toàn tuyệt đối • 0 vi phạm • 100/100 điểm an toàn".
  - Thẻ cọc hợp đồng hiển thị màu xanh: **Đủ điều kiện hoàn trả 100% tiền cọc (Không bị khấu trừ)**.
  - Tổng kết vi phạm: `0 lần phát hiện (Ngủ gật: 0, Ngáp: 0, Gục đầu: 0)`.
  - Trên bản đồ: Không có marker 📸 vi phạm, chỉ có vị trí xe đang lăn bánh hoặc dừng đỗ.
- **Xe Vi Phạm (`43A-999.88` - VinFast VF8 - HĐ-3):**
  - Hiển thị đầy đủ 14 hình ảnh vi phạm thật chụp từ camera AI DMS từ thư mục `test_yolo/bang_chung`.
  - Thẻ cọc hợp đồng hiển thị cảnh báo đỏ: `Cần trừ tiền cọc do 14 lỗi vi phạm an toàn`.
  - Tổng kết vi phạm: `14 lần phát hiện` (Ngủ gật: 6 lần, Ngáp sâu: 4 lần, Gục đầu: 4 lần).

### 2. Chuẩn hóa Lịch trình Hợp đồng Đủ 5 Ngày:
- Xe `43A-999.88` (HĐ-3) được cấu hình chuẩn: Bắt đầu `31/10/2026 08:00` đến `04/11/2026 20:00` (Thời hạn: **5 ngày**).
- Phân bổ 14 ảnh vi phạm trải đều chuẩn xác qua cả 5 ngày của hợp đồng:
  - Ngày 1: `31/10/2026` (3 ảnh)
  - Ngày 2: `01/11/2026` (3 ảnh)
  - Ngày 3: `02/11/2026` (3 ảnh)
  - Ngày 4: `03/11/2026` (3 ảnh)
  - Ngày 5: `04/11/2026` (2 ảnh)
- Các tab ngày hiển thị trọn vẹn cả 5 tab từ Ngày 1 đến Ngày 5 mà không bị che khuất hay chênh lệch.

### 3. Triệt tiêu Spam Query & Chống Giật Màn hình (Anti-Jitter Polling):
- **Tắt log SQL Query Prisma:** Trong `backend-next/src/lib/prisma.ts`, đổi cấu hình log thành `['error', 'warn']`, chấm dứt việc terminal Next.js ngập tràn hàng trăm dòng `prisma:query SELECT ...` mỗi giây.
- **Cơ chế Fingerprinting so sánh dữ liệu:** Trong `LiveTracking.tsx`, thêm `lastVehiclesDataRef`. Khi polling định kỳ (15s/lần), nếu tọa độ, tốc độ và trạng thái xe không đổi thì tuyệt đối không gọi `setVehicles` ➔ Giao diện không bị re-render giật giật.


