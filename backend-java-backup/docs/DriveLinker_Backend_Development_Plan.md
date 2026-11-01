DRIVELINKER

BACKEND DEVELOPMENT PLAN

Intelligent Rental Vehicle Management and Driver Monitoring System

Phạm vi

Backend only

Kiến trúc

Modular Monolith

Công nghệ chính

Java 21, Spring Boot 3.5.x, PostgreSQL/PostGIS

Kế hoạch

9 giai đoạn phát triển

0. Tổng quan kế hoạch

Mục tiêu của kế hoạch là triển khai Backend DriveLinker theo đúng thứ tự phụ thuộc nghiệp vụ, hoàn thành từng phase, test và commit trước khi chuyển sang phase tiếp theo. Frontend do thành viên khác phụ trách và sẽ tích hợp qua REST API + WebSocket.

Thứ tự

Module

Mức độ

Thời gian dự kiến

1

Project Skeleton + Database

🔴 Bắt đầu

1–2 ngày

2

Authentication + JWT + RBAC

🔴 Core

2–3 ngày

3

Customer + Vehicle + Device

🔴 Core

3–4 ngày

4

Rental Contract + Monitoring Session

🔴 Core

3–4 ngày

5

GPS + IoT Authentication

🔴 Core

3–4 ngày

6

AI Result + Alert

🔴 Core

3–4 ngày

7

WebSocket Realtime

🔴 Core

2 ngày

8

Dashboard + History

🟡 Important

2–3 ngày

9

Report + Test + Docker

🟡 Finalize

3–4 ngày

Luồng phát triển tổng thể

Foundation   ↓Auth   ↓Customer / Vehicle / Device   ↓Rental Contract   ↓Monitoring Session   ↓GPS / IoT   ↓AI Alert   ↓WebSocket   ↓Dashboard   ↓Report / Test / Deploy

1. Project Skeleton + Database  [Bắt đầu]

Mục tiêu: Tạo nền móng Backend ổn định để tất cả module sau có thể phát triển mà không phải thay đổi lớn về cấu trúc, cấu hình và database.

1.1 Khởi tạo Spring Boot

Java 21

Spring Boot 3.5.x

Maven

Base package: com.drivelinker

1.2 Dependencies

Spring Web

Spring Data JPA

Spring Security

Spring Validation

Spring WebSocket

PostgreSQL Driver

Flyway

Lombok

JWT library

Spring Boot Actuator

Springdoc OpenAPI

JUnit 5, Mockito, Testcontainers

1.3 Cấu trúc source

src/main/java/com/drivelinker/├── DriveLinkerApplication.java├── common/│   ├── config/│   ├── security/│   ├── exception/│   ├── response/│   ├── constant/│   └── util/├── auth/├── organization/├── user/├── customer/├── vehicle/├── device/├── rental/├── monitoring/├── telemetry/├── ai/├── alert/├── dashboard/├── report/└── audit/

1.4 Configuration & Environment

Tạo application.yml, application-dev.yml, application-prod.yml và .env.example.

Environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD, JWT_SECRET, JWT_EXPIRATION, CORS_ALLOWED_ORIGINS.

Không hardcode password, JWT secret, DB credentials hoặc device secret.

1.5 PostgreSQL + PostGIS

Chạy PostgreSQL/PostGIS bằng Docker Compose.

Database: drivelinker.

Enable PostGIS extension để phục vụ dữ liệu GPS.

CREATE EXTENSION IF NOT EXISTS postgis;

1.6 Flyway migrations

V1__create_identity_tables.sqlV2__create_business_tables.sqlV3__create_rental_tables.sqlV4__create_tracking_tables.sqlV5__create_ai_alert_tables.sqlV6__create_indexes.sqlV7__seed_initial_data.sql

Không dùng ddl-auto=create cho môi trường phát triển nhóm.

Khuyến nghị spring.jpa.hibernate.ddl-auto=validate.

1.7 Common Response & Global Exception

ApiResponse.java

PageResponse.java

GlobalExceptionHandler.java

BusinessException.java

ResourceNotFoundException.java

DuplicateResourceException.java

ErrorCode.java

{"success": true, "message": "Success", "data": {}}

1.8 Health Check

Method

Endpoint

Mục đích

Quyền

GET

/actuator/health

Kiểm tra trạng thái ứng dụng

Public / internal

Definition of Done

☐ mvn clean test chạy thành công

☐ Spring Boot khởi động thành công

☐ PostgreSQL kết nối thành công

☐ PostGIS được enable

☐ Flyway migration PASS

☐ /actuator/health trả UP

☐ Docker PostgreSQL hoạt động

☐ Không có secret hardcode

☐ Project structure chuẩn

2. Authentication + JWT + RBAC  [Core]

Mục tiêu: Xây dựng nền bảo mật cho toàn bộ hệ thống: Organization, User, Role, Login, JWT, authorization và cách ly dữ liệu theo organization.

2.1 Database

organizations: id, name, phone, email, address, status, created_at, updated_at.

roles: id, name. Seed ADMIN và STAFF.

users: id, organization_id, role_id, username, password_hash, full_name, phone, email, status, created_at, updated_at.

2.2 Password & JWT

Password bắt buộc hash bằng BCryptPasswordEncoder.

JWT claims: sub, username, role, organizationId.

Request sử dụng Authorization: Bearer <JWT>.

Tài khoản INACTIVE không được đăng nhập.

2.3 Security classes

common/security/├── SecurityConfig.java├── JwtService.java├── JwtAuthenticationFilter.java└── CustomUserDetailsService.java

2.4 API

Method

Endpoint

Mục đích

Quyền

POST

/api/auth/login

Đăng nhập và cấp JWT

Public

GET

/api/auth/me

Lấy user đang đăng nhập

ADMIN/STAFF

GET

/api/users

Danh sách user

ADMIN

POST

/api/users

Tạo Staff/Admin theo rule

ADMIN

GET

/api/users/{id}

Chi tiết user

ADMIN

PUT

/api/users/{id}

Cập nhật user

ADMIN

PATCH

/api/users/{id}/status

Khóa/mở tài khoản

ADMIN

2.5 RBAC

ADMIN: quản lý user, vehicle, device, AI config; xem dashboard; xử lý alert; report.

STAFF: quản lý customer, contract, handover/return, xem vehicle.

Backend phải enforce role bằng Spring Security; không dựa vào việc Frontend ẩn nút.

2.6 Test

Login đúng / sai password

Username không tồn tại

Account INACTIVE

JWT hợp lệ / hết hạn / bị sửa

Không có JWT

STAFF gọi ADMIN API

Organization A truy cập dữ liệu organization B

Definition of Done

☐ Login hoạt động

☐ BCrypt hoạt động

☐ JWT cấp và validate đúng

☐ /api/auth/me hoạt động

☐ ADMIN/STAFF phân quyền đúng

☐ Account INACTIVE bị block

☐ Organization isolation hoạt động

3. Customer + Vehicle + Device  [Core]

Mục tiêu: Hoàn thiện dữ liệu nền phục vụ rental: khách hàng, xe và thiết bị IoT.

3.1 Customer

Bảng customers: id, organization_id, full_name, phone, id_card_number, driving_license, address, created_at, updated_at.

Validate số điện thoại, CCCD/ID, bằng lái theo phạm vi dự án.

Hỗ trợ search, pagination, sorting.

Method

Endpoint

Mục đích

Quyền

GET

/api/customers

Danh sách + search customer

ADMIN/STAFF

POST

/api/customers

Tạo customer

ADMIN/STAFF

GET

/api/customers/{id}

Chi tiết customer

ADMIN/STAFF

PUT

/api/customers/{id}

Cập nhật customer

ADMIN/STAFF

3.2 Vehicle

Bảng vehicles: id, organization_id, license_plate, vehicle_type, brand, model, availability_status, movement_status, safety_status, created_at, updated_at.

availability_status: AVAILABLE, RENTED, MAINTENANCE.

movement_status: RUNNING, STOPPED, OFFLINE.

safety_status: NORMAL, WARNING, DANGER.

Không gộp tất cả trạng thái xe vào một cột duy nhất.

Method

Endpoint

Mục đích

Quyền

GET

/api/vehicles

Danh sách + filter xe

ADMIN/STAFF

POST

/api/vehicles

Tạo xe

ADMIN

GET

/api/vehicles/{id}

Chi tiết xe

ADMIN/STAFF

PUT

/api/vehicles/{id}

Cập nhật xe

ADMIN

3.3 Device

Bảng devices: id, organization_id, vehicle_id, device_code, device_type, secret_hash, status, last_seen_at, created_at, updated_at.

Device type: GPS, AI_CAMERA, EDGE_DEVICE.

Status: ACTIVE, INACTIVE.

Backend sinh device token và chỉ trả plaintext token một lần; DB chỉ lưu hash.

Device phải cùng organization với vehicle trước khi bind.

Method

Endpoint

Mục đích

Quyền

POST

/api/devices

Đăng ký device

ADMIN

POST

/api/vehicles/{vehicleId}/devices

Bind device vào vehicle

ADMIN

Definition of Done

☐ Customer CRUD + search

☐ Vehicle CRUD

☐ Duplicate license plate bị reject

☐ Vehicle statuses đúng

☐ Device registration

☐ Device token generated

☐ Token chỉ lưu hash

☐ Device bind vehicle

☐ Organization isolation

4. Rental Contract + Monitoring Session  [Core]

Mục tiêu: Triển khai nghiệp vụ thuê xe và quản lý phiên giám sát khi xe được bàn giao.

4.1 Rental Contract

rental_contracts: id, organization_id, customer_id, vehicle_id, created_by, start_time, end_time, actual_return_time, status, notes, created_at, updated_at.

Status: DRAFT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED.

Không cho start_time >= end_time.

Không cho thuê xe MAINTENANCE.

Không cho một xe có hai contract ACTIVE.

4.2 Workflow

Create → DRAFT → Confirm → CONFIRMED → Handover → ACTIVE → Return → COMPLETEDDRAFT / CONFIRMED → CANCELLED

Method

Endpoint

Mục đích

Quyền

GET

/api/contracts

Danh sách hợp đồng

ADMIN/STAFF

POST

/api/contracts

Tạo hợp đồng

ADMIN/STAFF

GET

/api/contracts/{id}

Chi tiết hợp đồng

ADMIN/STAFF

PUT

/api/contracts/{id}

Sửa hợp đồng hợp lệ

ADMIN/STAFF

POST

/api/contracts/{id}/confirm

Xác nhận hợp đồng

ADMIN/STAFF

POST

/api/contracts/{id}/handover

Bàn giao xe

ADMIN/STAFF

POST

/api/contracts/{id}/return

Trả xe

ADMIN/STAFF

POST

/api/contracts/{id}/cancel

Hủy hợp đồng

ADMIN/STAFF

4.3 Monitoring Session

monitoring_sessions: id, contract_id, vehicle_id, started_at, ended_at, status.

Status: ACTIVE, CLOSED.

Handover: Contract CONFIRMED → ACTIVE; Vehicle AVAILABLE → RENTED; tạo MonitoringSession ACTIVE.

Return: Contract ACTIVE → COMPLETED; đóng session; cập nhật vehicle AVAILABLE hoặc MAINTENANCE theo rule.

Toàn bộ Handover/Return phải chạy trong @Transactional.

4.4 Test

Create contract

Ngày không hợp lệ

Customer/Vehicle không tồn tại

Xe MAINTENANCE

Double booking

Confirm contract

Handover / Handover 2 lần

Return / Return 2 lần

Cancel contract

Definition of Done

☐ Contract workflow đúng

☐ Double booking bị chặn

☐ Handover transaction atomic

☐ Monitoring session tạo/đóng đúng

☐ Vehicle status cập nhật đúng

5. GPS + IoT Authentication  [Core]

Mục tiêu: Cho phép Raspberry Pi/GPS gửi telemetry an toàn, hỗ trợ mất mạng và lịch sử hành trình.

5.1 Device Authentication

Web user dùng JWT.

IoT device dùng X-Device-Id + X-Device-Token.

Hai cơ chế authentication phải tách biệt.

DeviceAuthenticationFilter: tìm device, verify token hash, kiểm tra ACTIVE và vehicle binding, sau đó mới cho request đi tiếp.

5.2 GPS schema

gps_logs: id, event_id, vehicle_id, monitoring_session_id, latitude, longitude, location geography(Point,4326), speed, recorded_at, received_at.

event_id dùng UUID UNIQUE để chống duplicate khi offline sync.

Index B-Tree (vehicle_id, recorded_at).

GIST index cho location.

5.3 API IoT & Web

Method

Endpoint

Mục đích

Quyền

POST

/api/iot/telemetry

Gửi 1 GPS event

Device

POST

/api/iot/telemetry/batch

Gửi batch sau offline

Device

GET

/api/vehicles/{id}/location

Vị trí mới nhất

ADMIN/STAFF

GET

/api/vehicles/{id}/journey

Lịch sử hành trình

ADMIN/STAFF

5.4 Validation

latitude trong [-90, 90].

longitude trong [-180, 180].

speed >= 0.

Device ACTIVE và đúng vehicle.

Vehicle có active monitoring session.

eventId unique.

recordedAt là thời gian xảy ra trên Edge; receivedAt là thời gian server nhận.

Definition of Done

☐ Device authentication

☐ GPS single ingest

☐ GPS batch ingest

☐ UUID chống duplicate

☐ recordedAt + receivedAt

☐ PostGIS hoạt động

☐ Latest location

☐ Journey history

☐ Invalid device rejected

☐ Offline sync hoạt động

6. AI Result + Alert  [Core]

Mục tiêu: Nhận metadata từ Edge AI, lưu dữ liệu cần thiết và quản lý cảnh báo Level 2. Backend không chạy YOLO/OpenCV/MediaPipe inference.

6.1 AI Result

ai_results: id, event_id, vehicle_id, monitoring_session_id, drowsiness_score, eye_status, head_pose_status, occurred_at, received_at.

Không lưu mọi camera frame; chỉ lưu state change, sample cần thiết hoặc event liên quan cảnh báo.

Method

Endpoint

Mục đích

Quyền

POST

/api/iot/ai-results

Nhận AI metadata

Device

6.2 Two-level Alert

Level 1: xử lý local tại Edge bằng buzzer; nếu tài xế hồi phục thì không tạo server alert.

Level 2: Edge gửi alert về Backend nếu nguy hiểm tiếp tục.

Không upload raw video liên tục; Backend nhận metadata.

6.3 Alerts schema

alerts: id, event_id, organization_id, vehicle_id, monitoring_session_id, alert_type, severity_level, drowsiness_score, latitude, longitude, resolution_status, occurred_at, received_at, resolved_by, resolved_at, resolution_note.

Alert types core: DROWSINESS, YAWNING, HEAD_NOD, CAMERA_TAMPERING.

Resolution status: NEW, PROCESSING, RESOLVED.

Method

Endpoint

Mục đích

Quyền

POST

/api/iot/alerts

Tạo Level 2 alert từ Edge

Device

GET

/api/alerts

Danh sách/filter alert

ADMIN

GET

/api/alerts/{id}

Chi tiết alert

ADMIN

PATCH

/api/alerts/{id}/processing

Nhận xử lý alert

ADMIN

PATCH

/api/alerts/{id}/resolve

Resolve alert

ADMIN

6.4 Alert action history

alert_actions: id, alert_id, action, performed_by, note, created_at.

Actions: ALERT_CREATED, PROCESSING_STARTED, RESOLVED.

6.5 AI Configuration

ai_configs: id, organization_id, eye_closed_seconds, warning_score, danger_score, tampering_seconds, version, updated_by, updated_at.

Default tham khảo: eyeClosedSeconds=3, warningScore=60, dangerScore=80, tamperingSeconds=15.

Method

Endpoint

Mục đích

Quyền

GET

/api/config/ai

Xem AI config

ADMIN

PUT

/api/config/ai

Cập nhật AI config

ADMIN

GET

/api/iot/config

Edge lấy config

Device

6.6 Test

AI result hợp lệ

Score >100 reject

Device giả reject

Duplicate event

Không active session

Create Level2 alert

Camera tampering

NEW → PROCESSING

PROCESSING → RESOLVED

Không resolve 2 lần

Definition of Done

☐ AI result ingestion hoạt động

☐ Level 2 alert lưu đúng 1 lần

☐ Alert workflow đúng

☐ Camera tampering hoạt động

☐ AI config hoạt động

☐ Event idempotency hoạt động

7. WebSocket Realtime  [Core]

Mục tiêu: Push dữ liệu realtime từ Backend đến Frontend thay vì polling liên tục.

7.1 WebSocket components

WebSocketConfig

WebSocketSecurityConfig

AlertWebSocketPublisher / RealtimePublisher

Có thể dùng STOMP over WebSocket.

7.2 Topics

/topic/org/{organizationId}/alerts/topic/org/{organizationId}/vehicles/topic/vehicle/{vehicleId}/telemetry

7.3 Event types

ALERT_CREATED

ALERT_PROCESSING

ALERT_RESOLVED

VEHICLE_LOCATION_UPDATED

VEHICLE_STATUS_CHANGED

7.4 Security

WebSocket connection cần authenticated user.

User organization A không được subscribe topic organization B.

Vehicle topic phải kiểm tra quyền truy cập theo organization.

7.5 Flow

Raspberry Pi   ↓POST /api/iot/alerts   ↓AlertService   ↓Database   ↓WebSocket Publisher   ↓/topic/org/{organizationId}/alerts   ↓Frontend popup

Definition of Done

☐ Connection có JWT

☐ Connection không JWT bị chặn

☐ Wrong organization bị chặn

☐ Alert realtime

☐ GPS realtime

☐ Reconnect xử lý được

8. Dashboard + History  [Important]

Mục tiêu: Cung cấp dữ liệu tổng hợp và lịch sử phục vụ Dashboard/Monitoring mà không buộc Frontend tải toàn bộ dữ liệu thô.

8.1 Dashboard Summary

Method

Endpoint

Mục đích

Quyền

GET

/api/dashboard/summary

Tổng hợp số xe, hợp đồng, cảnh báo

ADMIN

{  "totalVehicles": 30,  "availableVehicles": 12,  "rentedVehicles": 15,  "maintenanceVehicles": 3,  "runningVehicles": 10,  "dangerVehicles": 2,  "activeContracts": 15,  "activeAlerts": 2}

8.2 Vehicle Overview

Method

Endpoint

Mục đích

Quyền

GET

/api/vehicles/{id}/overview

Tổng hợp monitoring của xe

ADMIN/STAFF

Vehicle information

Current location

Current speed

Last seen

Current contract

Customer/driver

Monitoring session

AI status

Active alerts

8.3 History APIs

Method

Endpoint

Mục đích

Quyền

GET

/api/vehicles/{id}/journey

GPS history theo from/to

ADMIN/STAFF

GET

/api/alerts

Alert history + filters

ADMIN

GET

/api/contracts

Contract history + filters

ADMIN/STAFF

Journey phải sort theo recordedAt ASC, không sort theo receivedAt để giữ đúng lịch sử khi offline sync.

Tất cả list API hỗ trợ pagination, filtering, sorting.

Tránh N+1 query; không load toàn bộ GPS history nếu chỉ cần current location.

Definition of Done

☐ Dashboard summary

☐ Vehicle overview

☐ Alert history

☐ Journey history

☐ Contract history

☐ Pagination

☐ Filtering

☐ Sorting

☐ Organization isolation

9. Report + Test + Docker  [Finalize]

Mục tiêu: Hardening toàn hệ thống, hoàn thiện report, audit, test tích hợp, Swagger và triển khai Docker.

9.1 Reports

Method

Endpoint

Mục đích

Quyền

GET

/api/reports/alerts

Thống kê cảnh báo

ADMIN

GET

/api/reports/journeys

Thống kê hành trình

ADMIN

GET

/api/reports/vehicles

Thống kê sử dụng xe

ADMIN

Alerts per day

Alerts per vehicle

Alert type distribution

Vehicle rental count

Vehicle usage

Distance travelled

9.2 Audit Log

audit_logs: id, organization_id, user_id, action, entity_type, entity_id, metadata, created_at.

Log các hành động quan trọng: USER_CREATED, USER_DISABLED, VEHICLE_CREATED, DEVICE_BOUND, CONTRACT_CREATED, CONTRACT_CONFIRMED, VEHICLE_HANDOVER, VEHICLE_RETURN, AI_CONFIG_CHANGED, ALERT_PROCESSING, ALERT_RESOLVED.

9.3 Unit & Integration Test

Unit test: AuthService, UserService, VehicleService, DeviceService, RentalService, TelemetryService, AlertService.

Integration test: SpringBootTest + Testcontainers PostgreSQL/PostGIS.

Kiểm tra migration, security, transaction, organization isolation, idempotency.

9.4 E2E Backend Scenario

Admin Login

Create Staff

Create Customer

Create Vehicle

Register Device

Bind Device

Create Contract

Confirm Contract

Handover Vehicle

Monitoring Session ACTIVE

Device sends GPS

Device sends AI result

Level 1 local

Level 2 sent to Backend

Alert NEW

WebSocket push

Admin PROCESSING

Admin RESOLVED

Return Vehicle

Session CLOSED

Contract COMPLETED

View journey + alert history

9.5 Swagger / OpenAPI

Dùng springdoc-openapi.

Tài liệu endpoint theo các tag: Authentication, Users, Customers, Vehicles, Devices, Rental Contracts, IoT, Telemetry, AI, Alerts, Dashboard, Reports.

9.6 Docker & Production Config

docker-compose.yml tối thiểu gồm backend + postgres/postgis.

Tách application-dev.yml và application-prod.yml.

Production: ddl-auto=validate, show-sql=false, secret từ environment, CORS giới hạn, secure logging.

Definition of Done

☐ Build PASS

☐ Unit Test PASS

☐ Integration Test PASS

☐ Flyway PASS

☐ Docker Compose PASS

☐ Swagger hoạt động

☐ Auth/RBAC hoạt động

☐ Vehicle/Rental flow hoạt động

☐ IoT Authentication hoạt động

☐ GPS ingest + offline sync hoạt động

☐ AI Level 2 alert hoạt động

☐ WebSocket hoạt động

☐ Dashboard/History hoạt động

☐ Organization isolation hoạt động

☐ Không plaintext password/device secret

10. Kế hoạch commit & milestone

10.1 Commit đề xuất

feat: initialize Spring Boot backend structurefeat: configure PostgreSQL PostGIS and Flywayfeat: add global exception and API responsefeat: implement authentication and JWTfeat: implement RBAC authorizationfeat: implement user managementfeat: implement customer managementfeat: implement vehicle managementfeat: implement IoT device managementfeat: implement rental contract workflowfeat: implement monitoring sessionsfeat: implement device authenticationfeat: implement GPS telemetry ingestionfeat: implement telemetry batch synchronizationfeat: implement journey historyfeat: implement AI result ingestionfeat: implement level two alert systemfeat: implement alert resolution workflowfeat: implement AI configurationfeat: implement websocket realtime eventsfeat: implement dashboard summaryfeat: implement vehicle monitoring overviewfeat: implement reportingtest: add backend integration testschore: add production docker configuration

10.2 Milestones

Milestone

Phase

Kết quả chính

Điều kiện chuyển tiếp

M1 - Backend Foundation

1–2

Database, Login, JWT, RBAC

Auth test PASS

M2 - Rental Management

3–4

Customer, Vehicle, Device, Contract, Handover/Return

Rental integration flow PASS

M3 - Intelligent Monitoring

5–7

GPS, IoT, AI Level2 Alert, WebSocket

Realtime monitoring flow PASS

M4 - Complete Product

8–9

Dashboard, History, Report, Test, Docker

E2E backend PASS

10.3 Nguyên tắc triển khai

Không triển khai đồng thời cả 9 phase.

Mỗi phase phải: code → test → review → commit → mới chuyển phase tiếp theo.

Không làm P2/advanced feature trước khi P0/Core ổn định.

Nếu AI coding agent thực hiện, yêu cầu agent dừng và báo cáo sau mỗi phase thay vì tự chạy xuyên suốt toàn dự án.

11. Phụ lục — Cấu trúc thư mục Backend chuẩn

backend/├── pom.xml├── Dockerfile├── docker-compose.yml├── .env.example├── .gitignore├── README.md├── docs/│   ├── api/│   ├── database/│   └── architecture/└── src/    ├── main/    │   ├── java/com/drivelinker/    │   │   ├── DriveLinkerApplication.java    │   │   ├── common/    │   │   │   ├── config/    │   │   │   ├── security/    │   │   │   ├── exception/    │   │   │   ├── response/    │   │   │   ├── constant/    │   │   │   └── util/    │   │   ├── auth/    │   │   ├── organization/    │   │   ├── user/    │   │   ├── customer/    │   │   ├── vehicle/    │   │   ├── device/    │   │   ├── rental/    │   │   ├── monitoring/    │   │   ├── telemetry/    │   │   ├── ai/    │   │   ├── alert/    │   │   ├── dashboard/    │   │   ├── report/    │   │   └── audit/    │   └── resources/    │       ├── application.yml    │       ├── application-dev.yml    │       ├── application-prod.yml    │       └── db/migration/    └── test/java/com/drivelinker/

Kết luận: Đây là thứ tự triển khai chuẩn cho Backend DriveLinker. Giai đoạn 1 là điểm bắt đầu thực tế; chỉ khi foundation chạy ổn và test PASS mới chuyển sang Authentication + JWT + RBAC.