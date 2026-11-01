# DriveLinker — Source Audit & Backend Backlog

**Ngày rà soát:** 10/10/2026  
**Nguồn:** `Capstone1_now.zip` (`Capstone1/DriveLinker`), đối chiếu `DriveLinker_Backend_Development_Plan(2).docx`.  
**Giới hạn:** Rà soát tĩnh source; chưa chạy Maven/Docker, chưa kết nối database, chưa có bằng chứng test runtime. `backend/docs/lichsu.md` là nhật ký tự đánh giá, không thay thế test.

## 1. Cách đánh giá

- **Có:** Có mã nguồn tương ứng, *không tự động đồng nghĩa đã chạy/test*.
- **Một phần:** Có thành phần nhưng thiếu endpoint, validation, RBAC hoặc kịch bản nghiệp vụ.
- **Thiếu:** Không tìm thấy triển khai trong bản ZIP.
- **Chưa kiểm chứng:** Cần chạy/build/integration test.
- **P0:** Lỗ hổng quyền truy cập/cách ly dữ liệu, dữ liệu nhạy cảm, chặn tích hợp.
- **P1:** Chức năng core chưa đầy đủ, cần hoàn thành để nghiệm thu.
- **P2:** Hoàn thiện, vận hành, tối ưu và chất lượng.

## 2. Kiểm kê hiện trạng

- `backend/src/main/java`: **81** file Java.
- **9** Controller, **15** endpoint ánh xạ HTTP: `AuthController` (1), `CustomerController` (2), `VehicleController` (2), `RentalContractController` (4), `TelemetryController` (1), `AiResultController` (1), `AlertController` (1), `DashboardController` (2), `ReportController` (1).
- `backend/src/main/resources/db/migration/`: **10** file Flyway (`V0`–`V9`).
- Có `pom.xml` (Java 21, Spring Boot **3.3.4**), `Dockerfile`, `docker-compose.yml`, JWT, thiết bị IoT, STOMP WebSocket, ApiResponse, Swagger dependency.
- Có `tests/all_api_tests.http` và `tests/test_websocket.html` — kịch bản **thủ công**, không phải unit/integration test tự động.
- Không tìm thấy `backend/src/test` trong ZIP.
- Có `.env` nằm trong ZIP và các literal nhạy cảm trong source/test: phải xem lại quản lý secret, không đưa token/mật khẩu vào tài liệu công khai.
- Bản kế hoạch Word định hướng Java 21 / Spring Boot **3.5.x**; source hiện tại **3.3.4**. Cần thống nhất phiên bản, không nâng cấp mù quáng.

### Ma trận module

| Module | Đã có trong source | Thiếu/cần chứng minh |
|---|---|---|
| Skeleton & Database | Maven, Docker/PostGIS, Flyway, common response | Build/test thực tế, schema diff, config/secret, migration không mất dữ liệu |
| Authentication | `/api/auth/login`, JWT, BCrypt, Spring Security | `/api/auth/me`, kiểm tra user/org ACTIVE; **chưa có Company Code trong form/DTO/service/database**; kiểm thử 401 và 2 tenant cùng username |
| RBAC | `Role`, quyền từ UserDetails | Không thấy `@EnableMethodSecurity`; phần lớn endpoint chỉ `authenticated()`, không role rules; contract `permitAll()` |
| Organization | Entity có organizationId/quan hệ org | `findAll()` Customer/Vehicle không filter; lookup theo ID chưa scope; login username unique toàn cục |
| Customer | GET list, POST create, validate thủ công | GET detail, PUT, search/filter/sort/pagination, scoping theo org |
| Vehicle | GET list, POST create | GET detail, PUT, validate workflow, status theo kế hoạch, tenant scoping |
| Device | Entity/Repository, DeviceAuthenticationFilter | Device register, issue/rotate token, bind/unbind vehicle, quản trị API |
| Rental/Monitoring | POST create/confirm/handover/return; session Entity/Repository | GET list/detail, PUT, cancel, scoping & ownership, double-book/race tests, actor thật (đang hardcode `staffId=1`) |
| GPS/IoT | POST telemetry, lưu GPS, publish STOMP | POST batch, latest location, journey theo route chuẩn, validate lat/lon/speed, duplicate event handling, PostGIS point/GiST |
| AI Result | POST `/api/iot/ai-results`, entity/service | Cấu hình AI GET/PUT, quản lý rule, validation nâng cao |
| Alert | POST từ device, publish STOMP, AlertActions schema | GET list/detail, processing/resolve, alert action history/service, RBAC, idempotency race |
| WebSocket | `/ws`, broker, CONNECT parsing, org topic | Bắt buộc JWT hợp lệ; bảo vệ SUBSCRIBE tất cả destinations, vehicle topic/tenant, prefix chính xác, test reconnect |
| Dashboard/History | summary, journey tại `/api/dashboard/vehicles/{id}/journey` | Đối chiếu endpoint Plan `/api/vehicles/{id}/journey`, location/vehicle overview, org scope cho journey, thống kê đầy đủ |
| Report | GET `/api/reports/analytics` | `/api/reports/alerts`, `/journeys`, `/vehicles` theo Plan hoặc ký lại API contract; response thống nhất; quyền ADMIN |
| Audit | Entity/Repository | Service, ghi log trên user/vehicle/contract/alert/config; API nếu cần |
| Tests/Deploy | Docker, file `.http` test thủ công | JUnit5/Mockito/Testcontainers, CI, smoke-test, E2E, config production an toàn |

## 3. Các phát hiện P0 kèm bằng chứng

**P0-01. Contract API public:** `common/security/SecurityConfig.java` chứa `"/api/contracts/**"` trong nhóm `permitAll()`. `RentalContractController` còn hardcode `staffId=1`. Điều này cho phép gọi luồng thay đổi hợp đồng không qua xác thực trong cấu hình hiện tại. **Sửa ngay trước mọi demo/API public.**

**P0-02. Chưa enforce Role đầy đủ:** Không thấy `@EnableMethodSecurity`. `@PreAuthorize` mới xuất hiện ở `ReportController`, quyền đang ghi cho cả STAFF dù Backend Plan nêu report ADMIN. Định nghĩa access matrix ở `SecurityFilterChain` và/hoặc bật method security, test 403.

**P0-03. Rò rỉ tenant:** `CustomerService.getAllCustomer()` và `VehicleService.getAllVehicle()` dùng `repository.findAll()`; `DashboardService.getVehicleJourney(vehicleId,from,to)` không nhận/lọc `orgId`; `RentalContractService` load customer/vehicle/contract theo ID không đối chiếu quyền và cùng organization. Áp `organizationId` đáng tin cậy từ Authentication, không tin client gửi tenant.

**P0-04. Company Code hoàn toàn chưa được triển khai:** `frontend/src/Login.tsx` chỉ có username/password và dùng login giả lập; `auth/dto/LoginRequest.java` chỉ có `username`, `password`; `AuthController`/`CustomUserDetailsService` gọi `findByUsername`; `Organization.java` và `V1__init_core.sql` chưa có cột `CompanyCode`; `Users.Username` đang unique toàn hệ thống. Chốt thiết kế đăng nhập `(companyCode, username, password)` với tài khoản riêng theo tenant, `UNIQUE(OrganizationID,Username)`; dùng `userId` bất biến + `organizationId` trong JWT. **Đã tồn tại claim `organizationId` trong JWT nhưng nó không giải quyết việc chọn đúng tenant lúc login.** Nếu dùng tài khoản chung nhiều tổ chức cần UserMembership khác (không gộp hai kiến trúc khi chưa quyết định).

**P0-05. Trạng thái account/organization:** `CustomUserDetailsService` chưa kiểm tra `status=ACTIVE`; JWT validity xác minh chủ yếu username và expiry. Bổ sung block user/org inactive, quyền hiện hành và phiên đã thu hồi nếu nghiệp vụ yêu cầu.

**P0-06. WebSocket tenant:** `WebSocketSecurityConfig` chỉ so sánh `startsWith("/topic/org/"+myOrgId)` — có thể nhầm tổ chức ID 1 với 10; subscribe vehicle topic chưa đối chiếu org, unauthenticated SUBSCRIBE không bị chặn rõ ràng. Yêu cầu từ chối CONNECT/SUBSCRIBE không hợp lệ, kiểm tra topic bằng cấu trúc segment và xe thuộc org.

**P0-07. Secret / origin:** `application.yml` có datasource password và JWT signing key dạng literal; test HTTP chứa bearer token mẫu; ZIP chứa `.env`. `SecurityConfig` và WebSocket cho phép origin wildcard. Chuyển sang env/secret manager, thay secret đã lộ, kiểm soát CORS/WebSocket origin, không để file test đính kèm token thật.

**P0-08. Migration an toàn:** `V7__create_iot_and_gps_tables.sql` `DROP TABLE ... GpsLogs CASCADE`, `V8__create_ai_and_alert_tables.sql` `DROP TABLE ... AiAlerts CASCADE`. Kiểm tra data-loss và migration từ database đang chạy, tạo migration bổ sung thay vì sửa migration đã áp dụng; backup trước khi nâng cấp.

**P0-09. Kiểm tra lỗi hoạt động thật:** README và `lichsu.md` công bố chạy thành công; bộ ZIP không có test tự động. Cần xác nhận build, Flyway, API, DB, WebSocket ở môi trường sạch trước khi kết luận hoàn tất.

## 4. Phương pháp audit source trước khi sửa

| Bước | Phạm vi | Việc kiểm tra | Bằng chứng bắt buộc |
|---|---|---|---|
| A01 | Baseline | Ghi commit/branch, chụp tree, cấu hình, phiên bản | Snapshot danh sách file + commit ID |
| A02 | Runtime | `./mvnw clean test`, `docker compose config`, `docker compose up --build`, health | Logs build, health, startup |
| A03 | Database | Liệt kê tables, indexes, FK, constraints; diff SQL migrations với Entity và Plan | Schema checklist, Flyway history, dữ liệu mẫu |
| A04 | HTTP endpoints | Lập API Inventory: Controller/Method/Path/DTO/Role/Org/Response | API Matrix + Swagger + test output |
| A05 | Auth & Tenant | Đối chiếu form/DTO/DB cho `companyCode`; test expired/invalid JWT, no JWT, staff/admin, 2 org cùng username, mã công ty sai, ID enumeration | 401/403/404 assertions; tenant login chính xác; truy cập chéo bị chặn |
| A06 | Nghiệp vụ | Contract status + double booking + concurrent handover; IoT auth + duplicate + offline | Test case + DB before/after |
| A07 | Realtime | CONNECT/SUBSCRIBE ACL, topic vehicle/org, realtime event, reconnect | WebSocket test logs theo tenant |
| A08 | Integration | Frontend Router gọi API thật, response format, CORS, errors, paths | FE-BE contract, 1 flow E2E |
| A09 | Quality | Test coverage, exception codes, query pagination, secret scan, dependency scan | Report lỗi + regression tests |
| A10 | Handover | Rà soát docs vs source, chốt API version, PR và Definition of Done | Backlog đã cập nhật + PR links |

## 5. Backlog công việc riêng cho Backend Developer

### P0 — Chặn lỗi bảo mật và nền tảng (thực hiện trước)

- [ ] **BE-001**: Lưu baseline source, inventory 15 endpoint và 10 Flyway, lập bảng status `Có / Một phần / Thiếu / PASS / FAIL`; lưu log.
- [ ] **BE-002**: Build/test/deploy từ môi trường sạch; ghi lỗi thực tế, không suy đoán từ `lichsu.md`.
- [ ] **BE-003**: Xóa `/api/contracts/**` khỏi `permitAll`, bảo vệ tất cả API quản lý theo JWT.
- [ ] **BE-004**: Bật và kiểm thử method-level security hoặc xây AuthorizationManager tập trung; chốt matrix ADMIN/STAFF theo Plan.
- [ ] **BE-005**: Chuẩn hóa currentUser/currentOrganization lấy từ trusted principal; bỏ `staffId=1`.
- [ ] **BE-006**: Enforce tenant-scoped repository & resource ownership trên Customer, Vehicle, Rental, Dashboard/Journey, Alerts, Report và các ID liên quan; test org A → B fail.
- [ ] **BE-007 — P0: BỔ SUNG COMPANY CODE CHO LOGIN**: Quyết định mô hình tài khoản theo tenant; thiết kế DB `Organizations.CompanyCode` UNIQUE, bỏ UNIQUE toàn cục của `Users.Username`, thay bằng UNIQUE `(OrganizationID, Username)`; sửa DTO và `POST /api/auth/login` nhận `companyCode`, `username`, `password`; xác thực theo đúng công ty + username; JWT gắn `userId` bất biến, `organizationId`, `role`; sửa JwtFilter/UserDetailsService/Controller đang lookup chỉ bằng username; kiểm thử bảo mật và không chọn nhầm công ty. **Chi tiết và tiêu chí nghiệm thu: xem Mục 5A.**
- [ ] **BE-008**: Block user/org inactive, JWT invalid/expired; thêm `GET /api/auth/me` trả đúng user, role và organization đã xác thực; tiêu chuẩn 401/403.
- [ ] **BE-009**: Vá STOMP CONNECT/SUBSCRIBE: JWT bắt buộc, validate quyền mọi channel, match segment chính xác, vehicle ownership, hạn chế destination.
- [ ] **BE-010**: Rotate/remove all exposed secrets and test tokens; CORS/WS allowed origins cấu hình chặt; `.env.example` placeholder; hạn chế health details.
- [ ] **BE-011**: Audit Flyway DROP/CASCADE, ngừng reset dữ liệu ngoài sandbox, tạo migration sửa schema có kế hoạch và back-up.
- [ ] **BE-012**: Thêm JUnit + integration security tests tối thiểu cho Auth/RBAC/tenant/contract permissions.

### 5A. Chi tiết mới bổ sung — BE-007: Đăng nhập có Company Code (P0)

**Kết quả rà soát source ngày 10/10/2026: CHƯA CÓ.** Đây là yêu cầu bổ sung cho hệ thống đa doanh nghiệp, không phải chức năng đã có trong bản `Capstone1_now.zip`. Backend Plan hiện ghi login/JWT/organizationId nhưng chưa mô tả field `companyCode` như dưới đây.

| Lớp cần kiểm tra/sửa | Bằng chứng hiện có | Việc Backend cần làm |
|---|---|---|
| `frontend/src/Login.tsx` | Chỉ có 2 ô username/password, đăng nhập giả lập | **FE phối hợp** bổ sung ô Company Code và gọi API thật; BE cung cấp request/response contract |
| `auth/dto/LoginRequest.java` | Chỉ có `username`, `password` | Thêm `companyCode` bắt buộc, validation `@NotBlank`, giới hạn độ dài/định dạng |
| `auth/controller/AuthController.java` | `AuthenticationManager` xác thực username đơn lẻ; `findByUsername` lần 2 | Xác thực đúng tenant + user, không tự lấy user đầu tiên trùng username |
| `organization/entity/Organization.java` | Không có thuộc tính CompanyCode | Thêm `companyCode` duy nhất, không thay đổi khi đổi tên công ty |
| `user/entity/User.java` | `@Column(unique = true)` cho Username | Bỏ unique toàn cục, đồng bộ entity/DB với unique theo organization |
| `user/repository/UserRepository.java` | Chỉ có `findByUsername` | Thêm lookup `findByOrganizationIdAndUsername(...)` (hoặc truy vấn join CompanyCode), đồng thời có `findById` cho principal |
| `common/security/CustomUserDetailsService.java` | `loadUserByUsername(username)` tìm toàn hệ thống | Thiết kế lại theo định danh duy nhất; tránh nhập nhằng khi hai công ty trùng username |
| `common/security/JwtService.java` & `JwtAuthenticationFilter.java` | `sub=username`, sau xác thực tải lại bằng username | Đề xuất `sub=userId`, claim `organizationId`+`role` và validate trạng thái user/org + tenant hiện hành |
| `db/migration/V1__init_core.sql` | Organizations chưa có CompanyCode; Users.Username UNIQUE | Tạo migration Flyway **mới** (không sửa file migration đã apply) để thêm/backfill CompanyCode và điều chỉnh unique constraint |
| Các Controller khác | `CustomerController`, `VehicleController`, `DashboardController`, `ReportController`, `WebSocketSecurityConfig` còn `findByUsername` | Đọc principal theo userId/orgId từ backend-trusted auth context; không lấy dữ liệu theo username chung toàn hệ thống |

**API contract đề xuất** (đây là thay đổi cần triển khai, không phải endpoint đã hỗ trợ đầy đủ):

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "companyCode": "CTY_A",
  "username": "staff@gmail.com",
  "password": "<mat-khau>"
}
```

- Backend tra `Organizations.CompanyCode = CTY_A`, kiểm tra tổ chức ACTIVE; sau đó tìm User với `OrganizationID` tương ứng và `Username`; kiểm tra tài khoản ACTIVE và BCrypt password; khi hợp lệ mới cấp JWT.
- JWT/Principal phải có **userId bất biến** và **organizationId được backend xác minh**; tuyệt đối không tin `organizationId` do client tự gắn vào request sau đăng nhập. Mọi GET/POST/PATCH/DELETE phải kiểm tra tenant ở tầng nghiệp vụ/repository.
- Mã công ty sai, username sai hoặc mật khẩu sai trả **thông báo đăng nhập thất bại chung**, tránh tiết lộ tổ chức/tài khoản tồn tại; áp rate limit/log cảnh báo khi cần. Không liệt kê danh sách công ty của người dùng trong thông báo lỗi.
- FE hiển thị 3 trường `Company Code + Username + Password`; định tuyến sau login theo công ty đã xác thực. FE chịu trách nhiệm UI, BE chịu trách nhiệm dữ liệu, authentication, authorization và contract.
- **Migration:** Kiểm tra dữ liệu cũ; cấp `CompanyCode` cho từng tổ chức hiện có, đảm bảo unique/not-null trước khi bật ràng buộc; gỡ ràng buộc unique toàn cục Username và thêm `UNIQUE(OrganizationID, Username)`. Thực hiện trong Flyway migration mới có backup và test upgrade; không DROP/recreate bảng Users.

**Checklist triển khai (BE-007.1–BE-007.8):**

- [ ] **BE-007.1** — Thiết kế quy tắc cấp Company Code (unique, ổn định, chuẩn hóa chữ hoa/thường, không dùng Name làm khóa đăng nhập); thống nhất FE-BE contract.
- [ ] **BE-007.2** — Migration bổ sung `Organizations.CompanyCode`, backfill và unique constraint; đổi unique key Users sang `(OrganizationID, Username)`, chạy thử upgrade trên bản sao dữ liệu.
- [ ] **BE-007.3** — Bổ sung entity `Organization.companyCode` và `LoginRequest.companyCode` + Bean Validation.
- [ ] **BE-007.4** — Sửa Repository/Authentication để lookup theo đúng Company Code + Username, kiểm tra trạng thái Organization/User và mật khẩu BCrypt.
- [ ] **BE-007.5** — Sửa JWT (subject userId), custom principal, JwtAuthenticationFilter; không dùng username duy nhất toàn cục trong phiên.
- [ ] **BE-007.6** — Rà soát tất cả điểm `findByUsername` trong Customer/Vehicle/Dashboard/Report/WebSocket và thay bằng lookup theo principal tin cậy; enforce org isolation.
- [ ] **BE-007.7** — Viết Unit + Integration Tests cho cùng username/password ở 2 công ty, companyCode sai, công ty/user INACTIVE, tenant mismatch, JWT đổi org.
- [ ] **BE-007.8** — Cung cấp ví dụ Swagger và request/response để FE tích hợp ô Company Code, test end-to-end từ giao diện khi FE hoàn tất.

**Tiêu chí nghiệm thu bắt buộc:**

1. Company A và Company B có thể có **cùng username và cùng password**; nhập `CTY_A` chỉ xác thực tài khoản thuộc A, nhập `CTY_B` chỉ xác thực tài khoản thuộc B.
2. Không có/để trống `companyCode` bị từ chối validation (400); mã công ty sai hoặc sai mật khẩu bị từ chối xác thực (401) mà không tiết lộ công ty nào có tài khoản.
3. User/Organization INACTIVE bị từ chối; JWT hợp lệ chứa định danh user và tenant tương ứng, `/api/auth/me` phản hồi đúng tenant.
4. Token Công ty A không đọc, sửa hoặc subscribe dữ liệu Công ty B, kể cả khi người dùng sửa path, params, body hoặc WebSocket topic.
5. Sau khi có username trùng ở hai công ty, **mọi Controller và WebSocket vẫn xác định đúng user bằng ID**, không lỗi `NonUniqueResultException`, không chọn nhầm tổ chức.
6. Flyway chạy PASS ở **database mới** và **database cũ có dữ liệu**, không làm mất dữ liệu/tài khoản.
7. Có bằng chứng test tự động (PASS) và test FE-BE tối thiểu một luồng đăng nhập/đăng xuất cho từng công ty.

**Phụ thuộc:** BE-003, BE-004, BE-005, BE-006, BE-008 và BE-009 phải nhất quán với định danh/tenant mới; thực hiện BE-007 trước khi nghiệm thu Multi-tenant. **Thời điểm:** Sprint 1 / P0.

### P1 — Hoàn thiện nghiệp vụ core theo Backend Development Plan

- [ ] **BE-013**: `UserController/UserService`: list/create/detail/update/status cho ADMIN; kiểm tra role và org.
- [ ] **BE-014**: Customer APIs: GET detail, PUT, search, filter, sort, pagination; trùng lặp theo rule tenant đã chọn.
- [ ] **BE-015**: Vehicle APIs: GET detail, PUT, filter/sort/page; thống nhất availability/movement/safety thay vì 1 status nếu chốt theo Plan.
- [ ] **BE-016**: Device APIs: register, generate one-time token, hash secret, bind/unbind, disable/revoke, rotate; check cùng tenant.
- [ ] **BE-017**: Contract APIs: list/detail/update/cancel; validate thời gian, xe maintenance, scope tenant, transition đúng trạng thái.
- [ ] **BE-018**: Fix rental concurrency: kiểm tra overlap hợp đồng, idempotent confirm/handover/return, transaction, row lock/DB constraints khi cần.
- [ ] **BE-019**: Telemetry validation (`lat`, `lon`, `speed`, `recordedAt`, `eventId`); idempotent duplicate GPS kể cả gọi đồng thời.
- [ ] **BE-020**: API IoT batch/offline-sync `/api/iot/telemetry/batch` và latest GPS; response per-event trong batch.
- [ ] **BE-021**: Journey API & scope: thống nhất `/api/vehicles/{id}/journey` hay đường dẫn hiện tại; kiểm tra `from<=to`, limit, sort recordedAt ASC.
- [ ] **BE-022**: Cập nhật PostGIS: geography(Point,4326), GiST index nếu đúng yêu cầu giám sát địa lý; migration không phá dữ liệu.
- [ ] **BE-023**: AI config: GET/PUT `/api/config/ai`, GET `/api/iot/config`, RBAC và config theo org/version.
- [ ] **BE-024**: Alert management: list/detail/process/resolve; lưu `AlertActions`, thao tác đúng workflow và theo role/org.
- [ ] **BE-025**: AI/alert chống trùng event dưới concurrency và validate type/severity/score/coordinates; publish realtime sau commit.
- [ ] **BE-026**: Vehicle overview + Dashboard summary đủ dữ liệu; tránh query không lọc tenant và N+1.
- [ ] **BE-027**: Reports APIs và response chuẩn: chốt `/reports/analytics` hiện có so với `/reports/alerts|journeys|vehicles` trong Plan; ADMIN-only nếu theo Plan.
- [ ] **BE-028**: AuditLogService ghi các sự kiện bảo mật và nghiệp vụ quan trọng.
- [ ] **BE-029**: Đồng bộ FE-BE API contract: request/response, role, orgCode, 401/403, URL; cập nhật Swagger/OpenAPI examples.
- [ ] **BE-030**: Integration tests bằng Testcontainers PostgreSQL/PostGIS cho User, Tenant, Rental, GPS, Alert, Flyway.

### P2 — Hoàn thiện chất lượng, vận hành, giao nhóm

- [ ] **BE-031**: Chuẩn hóa exception mapping và HTTP status; RuntimeException nghiệp vụ không bị quy hết về 400.
- [ ] **BE-032**: Pagination/sorting/filter cho các list lớn; indexes và query performance (đặc biệt GPS).
- [ ] **BE-033**: Hạn chế REST/WS payload, rate limiting/device replay protections theo phạm vi demo.
- [ ] **BE-034**: Add unit tests cho service, mocks cho external components, E2E demo (Auth → Rental → GPS → AI → Alert → Return).
- [ ] **BE-035**: Thiết lập CI `test/build/static checks`, test `docker compose` và smoke tests trong môi trường sạch.
- [ ] **BE-036**: Cập nhật tài liệu triển khai, Swagger, ERD, module status, lỗi còn tồn và bàn giao FE.

## 6. Sprint đề xuất (ước lượng để lập kế hoạch, không phải thời gian đã kiểm chứng)

| Sprint | Trọng tâm | Task | Điều kiện chuyển tiếp |
|---|---|---|---|
| Sprint 0 — 1–2 ngày | Audit & baseline | BE-001–002 | Có build log, inventory, risk register |
| Sprint 1 — 4–6 ngày | P0 security / tenant, **Company Code Login (BE-007.1–007.8)** | BE-003–012 | Login (companyCode+username+password), JWT/principal theo userId, 401/403 đúng, không thể đọc/chỉnh dữ liệu org khác; WS deny; test tối thiểu PASS |
| Sprint 2 — 4–6 ngày | User/Customer/Vehicle/Device | BE-013–016 | CRUD + RBAC + tenant + validation PASS |
| Sprint 3 — 4–6 ngày | Rental/Monitoring/GPS | BE-017–022 | Contract E2E + offline batch + journey + concurrency PASS |
| Sprint 4 — 3–5 ngày | AI/Alert/Realtime/Report | BE-023–029 | AI alert workflow, realtime, dashboard, API contract PASS |
| Sprint 5 — 3–5 ngày | Test + quality + handover | BE-030–036 | CI, integration, Docker, E2E và docs PASS |

Thời lượng **ước lượng tổng 19–30 ngày công** cho một BE developer, tùy mức độ sửa lỗi và yêu cầu thay đổi schema. Nếu thiếu môi trường chạy có thể dài hơn. Quy tắc: không chuyển sprint khi P0 blocking chưa được test/đóng.

## 7. Definition of Done cho mỗi task

- Có commit/PR và mô tả phạm vi sửa, không vô tình sửa FE khi chưa thống nhất.
- Có yêu cầu nghiệp vụ và API contract được đối chiếu Plan; riêng BE-007 có `companyCode` trong request, migration và test 2 tenant cùng username.
- Có unit hoặc integration test phù hợp, negative tests khi liên quan auth/security.
- Không lộ secret; mọi DB truy vấn tenant đều lấy ngữ cảnh đáng tin cậy.
- `./mvnw clean test` pass, Flyway pass, endpoint đúng Swagger/HTTP, không làm hỏng module đã hoàn thành.
- Có bằng chứng test: request/response che token, log, DB before/after, tên test + kết quả.

## 8. Các quyết định nhóm cần chốt trước khi làm thay đổi schema/API

1. Mô hình user đa doanh nghiệp: tài khoản độc lập theo org (`orgCode+username`) hay identity toàn cục + membership? Trường hợp công ty A/B không biết nhau cần tenant selector/lối vào riêng, tuyệt đối không tự động chọn org khi username trùng.
2. Version Spring Boot: Plan 3.5.x vs source 3.3.4.
3. Trạng thái xe: 1 trường `Status` hay 3 trường `availability/movement/safety` theo Backend Plan.
4. Endpoint FE-BE và nhóm quyền: dashboard/reports/alerts, đặc biệt các khác biệt giữa source và Plan.
5. Chính sách dữ liệu vị trí, video/ảnh, IoT offline sync, tổ chức sử dụng 1 database hay các schema tách biệt.

## 9. Chạy kiểm tra ở máy có môi trường phù hợp (không thay thế audit bảo mật)

```bash
cd Capstone1/DriveLinker/backend
./mvnw clean test
./mvnw package
docker compose config
docker compose up -d --build
# Sau khi chạy: kiểm tra health, Flyway, Swagger, endpoint bằng token hợp lệ/không hợp lệ
```

Trên Windows PowerShell, dùng `./mvnw.cmd clean test` hoặc `.\\mvnw.cmd clean test` tùy shell. Tránh dùng dữ liệu production để test migration có thao tác DROP.

> **Kết luận audit tĩnh:** Snapshot đã có kiến trúc và phần lớn tuyến nghiệp vụ chính, nhưng không thể chấp nhận tuyên bố “Phase 1–9 hoàn thành 100%” trước khi sửa P0 và có chứng cứ test hoạt động. Ưu tiên quyền truy cập, multi-tenant, security, migration an toàn rồi mới hoàn thiện CRUD, IoT, AI/Alert, report.
