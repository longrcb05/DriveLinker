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
