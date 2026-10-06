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
