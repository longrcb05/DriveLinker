# DriveLinker Backend 🚗

Hệ thống Backend (Spring Boot + PostgreSQL/PostGIS) cho dự án DriveLinker - Nền tảng quản lý đội xe tích hợp giám sát IoT và Cảnh báo an toàn AI.

## 🛠 Công nghệ sử dụng
- **Ngôn ngữ:** Java 21
- **Framework:** Spring Boot 3.3.4
- **Cơ sở dữ liệu:** PostgreSQL + PostGIS (Hỗ trợ truy vấn địa lý)
- **Bảo mật:** Spring Security + JWT (JSON Web Token)
- **Realtime:** WebSocket (STOMP)
- **Quản lý CSDL:** Flyway Migration
- **Triển khai:** Docker & Docker Compose (Multi-stage build)

---

## 🚀 Hướng dẫn khởi chạy dự án (Dành cho máy mới)

Với kiến trúc đã được Docker hóa hoàn toàn, việc triển khai Backend trên một máy tính mới cực kỳ đơn giản. Bạn **KHÔNG CẦN** phải cài đặt Java, Maven, hay PostgreSQL trên máy thật của mình.

### 1. Yêu cầu chuẩn bị
Máy tính cần được cài đặt sẵn 2 phần mềm:
- **Git** (Dùng để clone mã nguồn)
- **Docker Desktop** (Dùng để chạy container ảo)

### 2. Các bước cài đặt & chạy ứng dụng

**Bước 1: Tải mã nguồn**
Mở Terminal / Command Prompt và chạy lệnh sau:
```bash
git clone https://github.com/longrcb05/DriveLinker.git
cd DriveLinker/backend
```

**Bước 2: Cấu hình biến môi trường**
Hệ thống sử dụng file `.env` để bảo mật thông tin (Password, JWT Secret). 
Trong thư mục `backend`, hãy tìm file có tên `.env.example`, copy nội dung của nó và tạo ra một file mới tên là `.env` nằm cùng cấp.

**Bước 3: Khởi chạy ma thuật Docker**
Vẫn tại thư mục `backend`, chạy lệnh khởi động Docker Compose:
```bash
docker-compose up -d --build
```
> ⏳ **Quá trình này sẽ mất khoảng 2-3 phút cho lần chạy đầu tiên. Docker sẽ tự động thực hiện:**
> - Tải image PostgreSQL có kèm PostGIS.
> - Tải môi trường Java, Maven để biên dịch toàn bộ mã nguồn Spring Boot thành file `.jar`.
> - Chạy Flyway để tự động tạo cấu trúc các Bảng (Tables) trong Database.
> - Khởi động Server Backend.

**Bước 4: Kiểm tra thành quả**
Sau khi terminal báo done, hãy mở trình duyệt và truy cập:
- Kiểm tra trạng thái Server: `http://localhost:8080/actuator/health` (Nếu trả về chữ `UP` là hệ thống đã hoạt động).
- Xem Tài liệu API (Swagger UI): `http://localhost:8080/swagger-ui.html`
- Cổng kết nối Web Socket Realtime: `ws://localhost:8080/ws`

---

## 📚 Tổ chức thư mục (Modular Monolith)

Mã nguồn được thiết kế chặt chẽ theo từng module nghiệp vụ (Domain-Driven Design cơ bản):
- `alert/`: Giám sát và xử lý Cảnh báo an toàn (AI Alerts).
- `audit/`: Nhật ký theo dõi vết hành động hệ thống.
- `auth/`: Đăng nhập và xác thực User.
- `common/`: Lõi cấu hình dùng chung (Exception, Response, JWT, Security, WebSocket).
- `customer/`: Quản lý khách hàng thuê xe.
- `dashboard/`: API tổng hợp dữ liệu tốc độ cao cho trang chủ.
- `organization/`: Quản lý dữ liệu doanh nghiệp (Phân quyền cách ly dữ liệu - Multi-tenant).
- `rental/`: Quản lý hợp đồng và quá trình bàn giao xe.
- `report/`: Báo cáo, thống kê phân tích số liệu.
- `telemetry/`: Xử lý luồng tọa độ GPS từ mạch IoT.
- `user/`: Quản lý danh sách nhân sự (Admin, Staff, Manager).
- `vehicle/`: Quản lý phương tiện và trạng thái đội xe.
