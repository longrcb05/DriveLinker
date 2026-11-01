🛠 TỔNG HỢP YÊU CẦU KỸ THUẬT BACKEND (BE TASKS)
Tài liệu này liệt kê chi tiết các công việc và luồng xử lý mà Backend (BE) cần thực hiện để đáp ứng logic cho các component/màn hình ở Frontend.

📦 1. RequestPriceChangeModal
1. Thiết kế API tiếp nhận yêu cầu (Create Request)
BE cần cung cấp một endpoint để Frontend gọi khi người dùng bấm "Gửi yêu cầu".

Endpoint gợi ý: POST /api/contracts/{contractId}/price-change-requests (hoặc POST /api/contracts/request-price-change)

Payload (Request Body) nhận vào:

contractId: Mã hợp đồng (lấy từ URL param hoặc body).

reason (string): Lý do và mức giá mong muốn (lấy từ form).

Lưu ý: ID của người gửi yêu cầu (nhân viên) nên được BE tự động lấy từ Token (JWT) để đảm bảo bảo mật, không truyền từ FE lên.

2. Cập nhật Database (Lưu trữ lịch sử/yêu cầu)
Vì yêu cầu này cần "Quản lý xem xét", BE không thể update trực tiếp giá hợp đồng mà phải lưu vào một bảng tạm hoặc bảng lịch sử.

Tạo bảng mới (VD: ContractPriceChangeRequests):

id: Khóa chính.

contract_id: Liên kết với bảng hợp đồng.

requested_by: ID của nhân viên tạo yêu cầu.

reason: Nội dung đề xuất (từ textarea).

status: Trạng thái yêu cầu (VD: PENDING - Chờ duyệt, APPROVED - Đã duyệt, REJECTED - Từ chối).

created_at: Thời gian tạo.

3. Xử lý Business Logic & Validation (Service Layer)
Trước khi lưu yêu cầu vào Database, BE cần kiểm tra các điều kiện:

Validate input: Đảm bảo reason không bị rỗng (FE đã chặn nhưng BE vẫn phải check).

Kiểm tra tồn tại: Hợp đồng (contractId) có tồn tại trong hệ thống không?

Kiểm tra trạng thái hợp đồng: Đúng như dòng text ở UI "Hợp đồng đã được xác nhận", BE cần check xem hợp đồng có đang ở đúng trạng thái cho phép đổi giá không (VD: Không cho phép sửa nếu hợp đồng đã thanh toán xong hoặc đã hủy).

Tránh spam/trùng lặp: Kiểm tra xem hợp đồng này có đang có một yêu cầu đổi giá nào ở trạng thái PENDING chưa. Nếu có rồi thì chặn không cho gửi thêm (tránh 1 hợp đồng gửi chục cái request cùng lúc).

4. Luồng Thông báo (Notification System)
Ngay sau khi lưu thành công yêu cầu vào Database với trạng thái PENDING, BE cần trigger một sự kiện để thông báo cho Quản lý.

Hình thức có thể là: Bắn thông báo in-app (qua Socket.io/Firebase), gửi Email, hoặc gửi tin nhắn Zalo ZNS (tùy vào hệ thống của bạn).

5. Chuẩn bị các API cho bước tiếp theo (Luồng của Quản lý)
Mặc dù UI này chỉ là form gửi yêu cầu, nhưng BE phải làm luôn phần cho người duyệt (Quản lý) để quy trình được khép kín:

API lấy danh sách: GET /api/price-change-requests?status=PENDING (Để quản lý xem có bao nhiêu yêu cầu đang chờ).

API Duyệt/Từ chối: PUT /api/price-change-requests/{requestId}/review

Nếu Từ chối: Đổi status thành REJECTED, thông báo lại cho nhân viên.

Nếu Duyệt: Đổi status thành APPROVED, cập nhật lại giá tiền mới vào bảng Contracts chính, tính toán lại tổng tiền, và thông báo cho nhân viên.

📊 2. Admin Dashboard
Vì hiện tại code đang dùng localStorage để làm dữ liệu giả (mock), Backend (BE) sẽ cần xây dựng các luồng API và Database sau để thay thế hoàn toàn:

1. Quản lý Authentication & Authorization (Core Admin)
API Đăng nhập/Đăng xuất: Cấp phát và thu hồi sys_core_token.

Middleware Phân quyền: Đảm bảo toàn bộ các endpoint dưới đây chỉ được truy cập bởi role Core_Admin. Các tài khoản quản lý (Manager) hay nhân viên (Staff) của Tenant tuyệt đối không được gọi vào các API này.

2. Quản lý hàng đợi bản vá (Staging / Pending Changes)
Thay vì lưu sys_staging_changes dưới LocalStorage, BE cần tạo bảng SystemPatches (hoặc StagingConfigs) và cung cấp các API:

API Lấy danh sách chờ: GET /api/core/patches?status=PENDING (Đổ dữ liệu vào list "Quản lý Đồng bộ").

API Tạo bản vá mới: POST /api/core/patches

Payload nhận vào: module (VD: API Gateway), description, config_data (chuỗi JSON chứa thông số cấu hình thật), target_tenant_id (áp dụng cho 1 hay tất cả doanh nghiệp).

3. Luồng Đồng bộ dữ liệu (Sync to Production) - Quan trọng nhất
Khi Admin bấm "Bắt đầu Đồng bộ lên Production", BE cần cung cấp 1 API POST /api/core/sync-production xử lý chuỗi logic phức tạp sau:

Phase 1 - Validate (CHECKING): Kiểm tra tính hợp lệ của config_data trong các bản vá, đảm bảo không bị xung đột khóa ngoại (foreign key) hoặc sai kiểu dữ liệu trước khi chạy thật.

Phase 2 - Execution (SYNCING): Mở một Database Transaction. Tiến hành update các bảng cấu hình (hoặc giới hạn Rate Limit, feature toggle,...) trên Database Production.

Phase 3 - Commit/Rollback:

Nếu thành công: Commit transaction, đổi status của các bản vá từ PENDING sang APPLIED. Bắn thông báo (Socket/Redis PubSub) để các service của Manager và Staff tự động nhận cấu hình mới.

Nếu thất bại: Rollback toàn bộ transaction để tránh làm chết hệ thống (giống như thông báo lỗi "Xung đột khóa ngoại. Đã rollback..." trên UI). Trả về mã lỗi chi tiết.

4. Ghi nhận nhật ký hệ thống (Audit Logs)
Thay vì lưu sys_core_audit_logs ở frontend, BE cần tự động ghi log ở phía server để bảo mật:

Tạo bảng CoreAuditLogs để lưu vết mọi hành động (Ai là người đồng bộ? Đồng bộ lúc nào? Trạng thái thành công hay thất bại? Chi tiết thay đổi là gì?).

API này được BE tự động gọi ngầm mỗi khi API Sync (mục 3) chạy xong.

5. Dashboard Metrics (Thông số chẩn đoán)
Cung cấp API GET /api/core/health-metrics trả về dữ liệu cho 3 thẻ thống kê trên cùng:

Trạng thái API Lõi: Tỷ lệ uptime (VD: 99.9%), lấy từ tool monitor (Prometheus/Grafana) hoặc tự tính toán.

Kết nối Database: Check health của DB (SELECT 1) trả về true/false.

Ticket chờ: Count số lượng lỗi/báo cáo từ hệ thống Tenant gửi lên đang ở trạng thái chưa xử lý (Pending).

🔐 3. AdminLogin
Dựa vào đoạn code UI AdminLogin, Backend (BE) cần xây dựng các API và cấu trúc cơ sở dữ liệu sau để thay thế hoàn toàn logic kiểm tra (hardcode) và dữ liệu mẫu hiện tại:

1. API Xác thực Đăng nhập (Authentication)
Endpoint: POST /api/core/auth/login

Payload nhận vào: username và password.

Xử lý: BE tìm tài khoản trong Database, giải mã và so sánh mật khẩu (password băm). Nếu hợp lệ, BE sinh ra một JWT (JSON Web Token) chứa thông tin role là SUPER_ADMIN và họ tên (adminName).

Response trả về: Token xác thực, adminName (ví dụ: Nguyễn Nhật Long), và role.

2. Quản lý Cơ sở dữ liệu System Admin
Tạo bảng CoreAdmins (hoặc tương đương) lưu thông tin của các Super Admin (như ADMINLONG, ADMINAN).

Bảng này cần tách biệt hoàn toàn hoặc phân quyền rõ ràng với bảng người dùng thường của các Tenant (Doanh nghiệp) để đảm bảo bảo mật cấp hệ thống. Mật khẩu lưu trong Database phải được băm (hash) bằng bcrypt hoặc argon2.

3. API Quản lý Danh sách Doanh nghiệp (Tenants)
Đoạn code hiện tại đang tạo dữ liệu giả (COMPANY_A, COMPANY_B, COMPANY_C) vào localStorage. BE cần viết API GET /api/core/tenants để FE gọi và lấy danh sách doanh nghiệp thật từ hệ thống ngay sau khi đăng nhập thành công.

Danh sách trả về phải bao gồm: id, name, code và trạng thái hoạt động của doanh nghiệp đó.

4. Bảo mật Luồng Phiên (Session)
Thay vì để Frontend tự set sessionStorage.setItem('sys_core_role', 'SUPER_ADMIN') (rất dễ bị user can thiệp qua DevTools), BE phải là nơi duy nhất quyết định quyền SUPER_ADMIN qua Token. Mọi API thuộc nhánh /api/core/* (như trang AdminDashboard bạn gửi trước đó) đều phải có Middleware kiểm tra tính hợp lệ và role của Token này.

🏢 4. AdminTennantList
Việc Frontend tự set localStorage.setItem('userRole', 'SUPER_ADMIN_VIEW') và isAdminImpersonating hiện tại chỉ là mock data và rất không an toàn. Để hệ thống chạy thực tế và bảo mật, Backend (BE) cần xây dựng các luồng sau:

1. API Lấy danh sách Doanh nghiệp (Tenants)
Endpoint: GET /api/core/tenants

Chức năng: Trả về danh sách tất cả các doanh nghiệp đang sử dụng hệ thống DriveLinker.

Dữ liệu trả về: mảng chứa id, name, code, status (hoạt động/khóa), số lượng user, v.v.

Bảo mật: API này yêu cầu phải có Token hợp lệ của SUPER_ADMIN.

2. Xây dựng Luồng Impersonate (Đăng nhập mạo danh/Chuyển context) - Rất Quan Trọng
BE không bao giờ được tin tưởng cờ isAdminImpersonating từ Frontend gửi lên hay Role do FE tự tạo. Thay vào đó, BE cần làm:

Endpoint: POST /api/core/tenants/{tenantId}/impersonate

Chức năng: Khi Admin bấm vào 1 doanh nghiệp, FE sẽ gọi API này.

Xử lý tại BE:

Kiểm tra Token hiện tại có đúng là của System Admin không.

Nếu hợp lệ, BE tạo ra một JWT Token Mới (Tạm gọi là Impersonate Token). Token này sẽ chứa payload: { "userId": "ID_Của_Admin", "tenantId": "{tenantId}", "role": "SUPER_ADMIN_VIEW" }.

Trả token mới này về cho FE. FE sẽ dùng token này để gọi các API thuộc về doanh nghiệp đó.

3. Phân quyền Middleware cho role SUPER_ADMIN_VIEW
Khi System Admin "nhảy" vào hệ thống của khách hàng (Tenant), BE cần có cơ chế kiểm soát quyền hạn:

Đa số các hệ thống SaaS chỉ cho phép role SUPER_ADMIN_VIEW quyền Read-Only (chỉ xem dashboard, báo cáo, danh sách hợp đồng).

BE phải chặn (block) toàn bộ các request POST, PUT, DELETE, PATCH từ role này vào dữ liệu của Tenant để tránh việc Quản trị viên hệ thống lỡ tay sửa/xóa dữ liệu kinh doanh của khách hàng.

4. Ghi log Audit (Truy vết bảo mật)
Hành động truy cập vào dữ liệu của khách hàng là một hành động cực kỳ nhạy cảm.

BE phải tự động ghi lại vào bảng AuditLogs hoặc SecurityLogs mỗi khi API Impersonate (mục 2) được gọi.

Nội dung log: "Admin [Tên/ID] đã truy cập vào Workspace của Doanh nghiệp [TenantID] vào lúc [Thời gian]" (Bắt buộc phải có để giải trình nếu khách hàng khiếu nại lộ lọt dữ liệu).

5. API Đăng xuất (Logout)
Endpoint: POST /api/core/auth/logout

Chức năng: Thu hồi (Revoke) Token của System Admin (thêm vào Blacklist trên Redis hoặc xóa HTTP-only cookie) để đảm bảo phiên đăng nhập thực sự bị hủy từ phía server, thay vì chỉ sessionStorage.removeItem ở FE.

📈 5. Analytics
1. API Lấy Danh sách Sự kiện & Cảnh báo (Events/Alerts)
Endpoint: GET /api/tenants/{tenantId}/events (hoặc GET /api/analytics/events)

Query Parameters (Bộ lọc):

date: Lọc theo ngày cụ thể (để đáp ứng thanh DatePicker).

startDate & endDate: (Nên làm để mở rộng tính năng lọc theo khoảng thời gian sau này).

status: (Ví dụ: Chỉ lấy các sự kiện UNRESOLVED).

severity: (Ví dụ: Chỉ lọc các sự kiện HIGH).

Dữ liệu trả về (Response): Một danh sách các sự kiện chứa đầy đủ thông tin như mã sự kiện, thời gian, biển số xe, tên tài xế, loại vi phạm, mức độ nghiêm trọng và trạng thái xử lý.

2. Cấu trúc Bảng Cố sở Dữ liệu (Database Tables)
BE cần thiết kế ít nhất các bảng sau để lưu trữ dữ liệu liên quan:

Bảng Events (hoặc Alerts): Lưu trữ thông tin từng cảnh báo (ID, loại vi phạm, thời gian, mức độ, trạng thái, ID chuyến đi, ID tài xế, ID xe).

Bảng Vehicles: Chứa thông tin phương tiện (Biển số xe, ...).

Bảng Drivers: Chứa thông tin tài xế.

Bảng Trips: Liên kết sự kiện với chuyến đi cụ thể (tùy chọn, nhưng thường có trong các hệ thống quản lý vận tải).

3. Tích hợp IoT/AI để Ghi nhận Sự kiện (Event Ingestion)
Hệ thống cần có luồng dữ liệu (pipeline) để nhận các sự kiện vi phạm một cách tự động (ví dụ: camera AI trên xe phát hiện tài xế ngáp hoặc vượt tốc độ).

Cần xây dựng API Ingest (ví dụ: POST /api/webhooks/events hoặc thông qua MQTT/Kafka) để các thiết bị phần cứng/AI gửi dữ liệu sự kiện lên server.

Khi có sự kiện mới mức độ HIGH, BE nên có cơ chế đẩy thông báo (Push Notification/WebSocket) real-time xuống Frontend.

4. API Tính toán Thống kê (Statistics/KPIs)
Mặc dù Frontend hiện tại đang tự tính toán các chỉ số (Tổng số, Tỷ lệ xử lý, Chỉ số an toàn DMS), nhưng với dữ liệu lớn, việc trả về toàn bộ danh sách để FE tính là không khả thi.

Endpoint: GET /api/tenants/{tenantId}/analytics/kpis

Nhiệm vụ của BE: Query thẳng vào Database (dùng các hàm COUNT, SUM, GROUP BY) để tính toán các con số tổng hợp này theo khoảng thời gian được yêu cầu và trả về kết quả cuối cùng cho FE.

5. Hỗ trợ Xuất dữ liệu (Export)
Hiện tại FE đang tự build file CSV. Nếu tập dữ liệu lớn (hàng vạn dòng), trình duyệt sẽ bị treo. BE cần cung cấp tính năng này.

Endpoint: GET /api/tenants/{tenantId}/analytics/export?date=...

Nhiệm vụ của BE: Query dữ liệu, tạo file CSV/Excel ở phía Server và trả về luồng stream (hoặc URL tải file) cho người dùng.

6. Bảo mật và Phân tách dữ liệu (Data Isolation)
Vì đây là hệ thống Multi-tenant, BE phải đảm bảo mọi truy vấn dữ liệu (events, kpis) đều phải kèm theo điều kiện lọc tenantId (lấy từ Token hoặc Session), tuyệt đối không để lọt dữ liệu của doanh nghiệp A sang doanh nghiệp B.

🏢 6. CompanyLogin
1. Xây dựng API Đăng nhập (Authentication Endpoint)
Endpoint: POST /api/auth/login (hoặc POST /api/tenant/login).

Payload nhận vào: email và password.

Luồng xử lý:

BE truy vấn Database để tìm user theo email.

So sánh mật khẩu (sử dụng thư viện băm mật khẩu như bcrypt hoặc argon2, tuyệt đối không lưu plaintext 123456).

Kiểm tra trạng thái của Doanh nghiệp (Tenant) chứa user đó có đang hoạt động hay không (bị khóa thì không cho login).

Response trả về: Nếu thành công, trả về thông tin User, Role (TENANT_ADMIN hoặc TENANT_STAFF), thông tin Tenant (tenantId, tenantName) và một JWT Token.

2. Thiết kế Cơ sở dữ liệu (Database Schema)
BE cần cấu trúc Database phân tách rõ ràng dữ liệu của từng doanh nghiệp:

Bảng Tenants (Doanh nghiệp): Lưu id, name (VD: Công ty A), status.

Bảng TenantUsers (Tài khoản nhân viên): Lưu id, email, password_hash, role (Admin/Staff), và khóa ngoại tenant_id liên kết chặt chẽ với bảng Tenants.

3. Quản lý Phiên & Phân quyền (JWT & RBAC)
Việc Frontend tự set localStorage.setItem('userRole', 'TENANT_ADMIN') rất nguy hiểm vì người dùng có thể tự sửa qua F12 để leo thang đặc quyền.

Giải pháp BE: Toàn bộ thông tin định danh (bao gồm userId, tenantId, role) phải được mã hóa bên trong Payload của JWT Token và ký bằng Secret Key ở BE.

Khi FE gọi các API lấy dữ liệu (VD: lấy danh sách xe, xem báo cáo), BE sẽ giải mã Token này để biết request đến từ ai, thuộc công ty nào, và chỉ trả về đúng dữ liệu của công ty đó (Data Isolation).

4. Cơ chế Bảo mật bổ sung (Security)
Rate Limiting: Chặn brute-force (dò mật khẩu) bằng cách giới hạn số lần gọi API đăng nhập sai (ví dụ: khóa IP hoặc khóa tài khoản 15 phút nếu nhập sai quá 5 lần).

Ghi log đăng nhập: Lưu lại lịch sử đăng nhập (IP, thời gian, thiết bị) vào bảng LoginHistories để phục vụ audit khi có sự cố truy cập trái phép.

📍 7. LiveTracking
1. Xây dựng hạ tầng Real-time (WebSocket / Socket.io)
UI có ghi chú Kết nối WebSocket/Socket.io để lắng nghe stream tọa độ xe liên tục. BE cần:

Thiết lập WebSocket Server: Dùng Node.js (Socket.io/ws), Python (FastAPI/Django Channels), hoặc Go, Java để mở kết nối hai chiều với Frontend.

Quản lý Session: Xác thực (Authentication) khi FE kết nối vào WebSocket, đảm bảo chỉ user có quyền mới xem được data.

Heartbeat/Ping-pong: Quản lý trạng thái kết nối (để FE đổi trạng thái nút "Đang chờ tín hiệu" sang "Đã kết nối").

2. Xử lý Dữ liệu GPS & Cập nhật KPI Đội xe
Frontend có thanh thống kê (Tổng, Đang lăn bánh, Dừng/đỗ, Cảnh báo, Mất kết nối) và Bản đồ. BE cần:

Tiếp nhận dữ liệu từ thiết bị (IoT/GPS): Lắng nghe dữ liệu từ phần cứng gắn trên xe gửi về (thường qua giao thức MQTT, TCP/UDP hoặc HTTP POST).

Xử lý và phân loại trạng thái: Tính toán dựa trên vận tốc và thời gian cập nhật cuối cùng để phân loại xe:

Đang lăn bánh: Vận tốc > 0 và vừa cập nhật.

Dừng/Đỗ: Vận tốc = 0 hoặc tắt máy.

Mất kết nối: Không nhận được tín hiệu sau một khoảng thời gian (VD: quá 5 phút).

Push data lên Frontend: Bắn dữ liệu tọa độ (Lat, Lng), hướng di chuyển (heading), và trạng thái của các xe qua WebSocket với tần suất phù hợp (ví dụ 3-5 giây/lần) để bản đồ (Mapbox/Leaflet) render.

3. Xử lý Luồng Video (Camera AI)
Giao diện có khu vực hiển thị Live Stream từ Camera AI. BE có hai hướng xử lý tùy thuộc vào công nghệ (HLS hoặc WebRTC):

Nếu dùng HLS (HTTP Live Streaming): BE (hoặc Media Server như Nginx-RTMP, SRS) cần nhận luồng RTSP từ camera trên xe, convert sang định dạng HLS (.m3u8) và cung cấp URL cho FE.

Nếu dùng WebRTC (Độ trễ cực thấp): BE cần đóng vai trò là Signaling Server (trao đổi SDP, ICE candidates) để thiết lập kết nối P2P giữa FE và Camera (hoặc qua một Media Server trung gian).

Trạng thái Camera: Cung cấp API hoặc đẩy event qua Web-socket báo cho FE biết camera đang Online hay Offline để FE đổi màu "dot xanh/đỏ" trên UI.

4. Quản lý Log Sự kiện & Cảnh báo (Hệ thống)
Khu vực "Cập nhật hệ thống" yêu cầu hiển thị log dạng [12:30:45] Xe 29C-12345 mất tín hiệu. BE cần:

Hệ thống Rule Engine: Đánh giá dữ liệu cấu hình để tạo ra cảnh báo. Ví dụ: Xe vượt quá tốc độ, đi sai tuyến đường, tài xế ngủ gật (từ Camera AI), hoặc thiết bị mất kết nối.

Lưu trữ Log: Ghi các sự kiện này vào Database (như MongoDB, Elasticsearch, hoặc TimescaleDB).

Realtime push: Ngay khi có sự kiện (Event) xảy ra, bắn gói tin Log đó qua WebSocket để FE thêm (prepend) vào danh sách log trên màn hình.

5. Cung cấp các RESTful APIs cơ bản (Khởi tạo dữ liệu)
Trước khi WebSocket hoạt động, FE cần gọi API để lấy trạng thái ban đầu:

GET /api/v1/vehicles: Lấy danh sách toàn bộ xe thuộc quyền quản lý của user, thông tin cơ bản (Biển số, loại xe) và tọa độ/trạng thái lần cuối cùng lưu trong DB.

GET /api/v1/tracking/kpi: Lấy số liệu tổng quan ban đầu cho 5 ô KPI.

GET /api/v1/tracking/logs: Lấy lịch sử log (ví dụ 50 log gần nhất trong ngày) để fill vào bảng Cập nhật hệ thống lúc mới load trang.

🔑 8. Login
1. Thiết kế Cơ sở dữ liệu (Database Schema)
Dựa vào cấu trúc object giả lập, BE cần thiết kế ít nhất 3 bảng (tables) với mối quan hệ Nhiều - Nhiều (Many-to-Many):

Bảng Tenants (Doanh nghiệp): Lưu thông tin công ty.

Cột: id (PK), name (Tên Cty), code (Mã đăng nhập, UNIQUE), status...

Bảng Users (Người dùng): Lưu thông tin tài khoản đăng nhập.

Cột: id (PK), username (UNIQUE), password_hash (Mật khẩu đã mã hóa), full_name...

Bảng User_Tenant_Roles (Phân quyền): Bảng trung gian nối User và Tenant.

Cột: user_id (FK), tenant_id (FK), role_code (VD: TENANT_ADMIN, TENANT_STAFF).

Điều này giải quyết bài toán: Tài khoản owner.an vừa làm Admin công ty A, vừa làm Admin công ty B.

2. Xây dựng API Đăng nhập
Tạo một endpoint (VD: POST /api/v1/auth/login) nhận payload từ Frontend.

Payload yêu cầu từ FE:

JSON
{
  "tenantCode": "CTA2026",
  "username": "owner.an",
  "password": "raw_password_123456"
}
Luồng xử lý Logic tại BE (tương ứng với các bước FE đang mock):

Query Tenant: Tìm doanh nghiệp có code = "CTA2026". Nếu không thấy, trả lỗi 404/400 (Mã doanh nghiệp không tồn tại).

Query User: Tìm user có username = "owner.an". Nếu không thấy, trả lỗi 404/400 (Tài khoản không tồn tại).

Xác thực Password: Sử dụng thư viện (như bcrypt, argon2) để so sánh password FE gửi lên với password_hash lưu trong DB. Tuyệt đối không lưu raw password.

Kiểm tra Phân quyền (Authorization): Query bảng User_Tenant_Roles xem user_id này có record nào ứng với tenant_id vừa tìm được ở bước 1 không. Nếu không, trả lỗi 403 Forbidden (Không có quyền truy cập doanh nghiệp này).

3. Xử lý Token / Phiên làm việc (Session)
Thay vì để FE tự gán localStorage như code hiện tại, BE phải là nơi quyết định và sinh ra Token (Thường dùng JWT - JSON Web Token).

BE cần trả về (Response):

JSON
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...", // FE sẽ lấy cái này gắn vào Header Bearer
    "tenant": {
      "id": "COMPANY_A",
      "code": "CTA2026",
      "name": "Demo CTY A"
    },
    "user": {
      "username": "owner.an",
      "role": "TENANT_ADMIN" // Quyền CỦA USER NÀY TẠI TENANT NÀY
    }
  }
}
Lưu ý cho BE: Trong payload của JWT (nội dung mã hóa của accessToken), BE nên nhúng sẵn tenant_id và role. Điều này giúp các API request sau này không cần query DB nhiều lần để biết user đang thao tác dưới danh nghĩa công ty nào.

4. Thiết lập Middleware cho Multi-tenant (Bước tiếp theo)
Sau khi Login xong, mọi API phía sau (như lấy danh sách xe, xem báo cáo...) FE sẽ đều gửi kèm cái accessToken. BE cần viết một Middleware:

Giải mã JWT để lấy tenant_id.

Tự động filter dữ liệu theo tenant_id (Ví dụ: SELECT * FROM vehicles WHERE tenant_id = ?). Điều này đảm bảo dữ liệu của Công ty A hoàn toàn cách ly, Công ty B không thể xem trộm được.

🧑‍💼 9. Manager
1. Nhóm API Khởi tạo & Truy xuất dữ liệu (RESTful APIs)
Frontend cần fetch dữ liệu ban đầu cho các thẻ thống kê và bảng danh sách xe.

API Thống kê (Stats): GET /api/v1/fleet/stats

BE cần query DB (hoặc Cache như Redis) để đếm (count) số lượng xe theo từng trạng thái: Tổng số, Đang chạy, Dừng đỗ, Sẵn sàng, Bảo dưỡng, và đặc biệt là đếm số xe đang có Cảnh báo AI.

API Danh sách xe (Table Data): GET /api/v1/fleet/vehicles

Trả về danh sách phương tiện, join với bảng Tài xế (Driver), bảng Thiết bị (Device/GPS) để map ra object tương đương với tableData trong code.

2. Xử lý logic Phân trang (Pagination), Tìm kiếm (Search) & Lọc (Filter)
Trong code UI có thanh Search, Filter theo cụm xe và phân trang (Hiển thị 1-10 trên 1,248 xe). BE cần nhận các query parameters từ FE:

Request URL mẫu: GET /api/v1/fleet/vehicles?page=1&limit=10&search=29C&group=ALL

Backend Task:

Thực hiện câu lệnh SQL LIMIT 10 OFFSET 0 (hoặc Keyset Pagination) để tối ưu hiệu năng khi số lượng xe lớn (1,248 xe).

Tìm kiếm (Search) theo LIKE %29C% trên các cột: Biển số, Số VIN, hoặc Tên tài xế.

Response bắt buộc phải trả về tổng số bản ghi (totalRecords) để FE render bộ nút phân trang (1, 2, 3... 125).

3. Tích hợp Real-time (WebSocket / MQTT) cho GPS & Cảnh báo AI
UI hiển thị "Kết nối Telematics trực tiếp", trạng thái xe (RUNNING, WARNING), tọa độ GPS và thông số EAR/MAR (độ mở mắt/miệng) từ Camera AI.

Luồng dữ liệu BE:

Lắng nghe dữ liệu đẩy lên liên tục từ thiết bị phần cứng (GPS, Camera) qua MQTT hoặc TCP Socket.

Chuyển đổi tọa độ (Lat/Lng) thành địa chỉ văn bản (Reverse Geocoding) bằng API của Google Maps/Mapbox để FE hiển thị (VD: "Quốc lộ 1A - KM 1024, Ninh Thuận").

Bắn event qua WebSocket xuống FE để UI tự động chớp đỏ (animate-pulse) khi có xe rơi vào trạng thái cảnh báo ngáp/ngủ gật.

4. API Điều khiển thiết bị từ xa (IoT Command)
Trên UI, ở phần xe bị cảnh báo ngủ gật, có một nút "Kích hoạt còi".

API Command: POST /api/v1/fleet/vehicles/:id/commands

Backend Task: Khi FE gọi API này (payload: {"action": "TRIGGER_HORN"}), BE phải gửi một lệnh (Command) ngược xuống phần cứng Camera AI/Hộp đen trên xe đó thông qua kết nối socket TCP hoặc MQTT Topic tương ứng để còi trong cabin xe réo lên, cảnh báo tài xế.

5. API Nhập liệu (Import) & Xuất báo cáo (Export)
Xuất Báo Cáo: GET /api/v1/fleet/vehicles/export?format=xlsx -> BE nhận request, query toàn bộ dữ liệu (có thể có filter), dùng các thư viện (như exceljs, Apache POI) để render ra file Excel và trả về stream cho người dùng tải xuống.

Nhập Liệu: POST /api/v1/fleet/vehicles/import -> BE nhận file Excel/CSV từ FE gửi lên, validate các cột (Biển số, số VIN), bỏ qua bản ghi trùng lặp và insert hàng loạt (Bulk Insert) vào Database.

6. Cung cấp Dữ liệu "Sức khỏe hệ thống" (System Health)
Phần Footer của UI hiển thị thông số chẩn đoán (Diagnostic) như "Độ phủ vệ tinh GPS", "Sai số 2cm", "Latency 12ms", "99.8% Online".

API/Event: GET /api/v1/system/telemetry-health

Backend Task: BE cần có một module monitoring giám sát chính các Server và Gateway của mình để tính toán độ trễ (latency), tỷ lệ thiết bị online/offline so với tổng số lượng xe đã đăng ký, và trả về cho FE hiển thị dưới Footer.

👁️ 10. Overview
1. API Cung cấp dữ liệu Tổng quan (Dashboard API)
Thay vì FE phải gọi nhiều API lẻ tẻ, BE nên xây dựng một endpoint tổng hợp (Aggregation API) để tối ưu thời gian load của trang chủ.

Endpoint đề xuất: GET /api/v1/dashboard/summary

Nhiệm vụ của BE:

Query danh sách xe: Lấy tọa độ (lat, lng), vận tốc, trạng thái (RENTING, AVAILABLE, MAINTENANCE) của toàn bộ xe thuộc Tenant này.

Query Cảnh báo AI (24h): Lấy danh sách các cảnh báo (ngủ gật, sai làn, quá tốc độ...) sinh ra trong vòng 24 giờ qua.

Tính toán Map Center: Thay vì hardcode tọa độ như FE, BE có thể trả về tọa độ trung tâm mặc định của trụ sở công ty đó, hoặc tự động tính toán điểm trung tâm dựa trên cụm tọa độ của các xe đang chạy.

2. Xử lý Phân quyền Dữ liệu (Data Masking & RBAC) - Rất quan trọng!
Trong code FE hiện tại có đoạn: javascript isManager ? revenueData.amount : '***' 
Nghĩa là FE đang tự che dữ liệu doanh thu nếu user chỉ là nhân viên. Tuy nhiên, đây là rủi ro bảo mật. BE phải chặn dữ liệu này từ gốc:

Khi nhận request GET /api/v1/dashboard/summary, BE cần giải mã Token để biết Role của user.

Nếu User là TENANT_STAFF, BE tuyệt đối không query và không trả về object revenue trong JSON.

Nếu User là SYS_ADMIN (Quản trị hệ thống), BE cần block request này (trả về 403 Forbidden) vì Sys Admin không được phép xem trộm dữ liệu vận hành của khách hàng (đúng như logic FE đang render màn hình chặn).

3. Tính toán Doanh thu theo thời gian thực (Hoặc theo Batch)
Khối "Doanh thu trong tháng" yêu cầu BE phải xử lý tính toán số liệu tài chính:

Doanh thu (amount): Sum toàn bộ giá trị hợp đồng/cuốc xe hoàn thành trong tháng hiện tại.

Tăng trưởng (growth): So sánh tổng doanh thu tháng này với cùng kỳ tháng trước để ra tỷ lệ % (Tăng/Giảm).

Tỷ lệ cho thuê (utilization): (Số ngày xe được thuê / Tổng số ngày của toàn bộ đội xe) * 100.

Thu hồi công nợ (collection): (Số tiền đã thu thực tế / Tổng doanh thu ghi nhận) * 100.
(Vì query này có thể nặng, BE có thể dùng Cronjob tính toán trước vào ban đêm và lưu vào Cache/Redis, thay vì tính live mỗi lần load trang).

4. Đảm bảo tính cô lập dữ liệu (Multi-tenant Isolation)
Mọi câu lệnh truy vấn (SQL/NoSQL) vào bảng Vehicles, Alerts, Revenue... bắt buộc phải có điều kiện WHERE tenant_id = ?.

Điều này đảm bảo khi COMPANY_A đăng nhập, họ không bao giờ nhận được xe hay cảnh báo của COMPANY_B.

5. (Tùy chọn) Luồng Real-time cho Bản đồ & KPI
Mặc dù UI hiện tại có nút "Làm mới dữ liệu", nhưng bản chất của Live Tracking là tự động cập nhật:

BE có thể thiết lập một kênh WebSocket / SSE (Server-Sent Events) cho trang Overview.

Khi có 1 xe thay đổi vị trí đáng kể, hoặc có 1 cảnh báo AI mới sinh ra (từ Camera bắn về BE), BE sẽ push event xuống FE.

FE sẽ cập nhật lại Marker trên bản đồ (Leaflet) và tăng bộ đếm "Cảnh báo AI" mà người dùng không cần bấm nút F5/Refresh.

💰 11. PriceApprovals
1. Thiết kế Cơ sở dữ liệu (Database Schema)
BE cần quản lý luồng này thông qua ít nhất 2 bảng có liên kết với nhau:

Bảng Contracts (Hợp đồng):

Cần có cột price (Đơn giá hiện tại).

Cột has_pending_request (Boolean): Để khóa (lock) hợp đồng, không cho nhân viên khác tiếp tục gửi yêu cầu khi đang có 1 yêu cầu chờ duyệt.

Bảng Price_Requests (Yêu cầu đổi giá):

id (PK)

contract_id (FK trỏ tới Contracts)

staff_id (Người tạo yêu cầu)

reason (Lý do/Nội dung đề xuất từ staff)

manager_note (Ghi chú phản hồi của quản lý khi duyệt/từ chối)

status (Enum: PENDING, APPROVED, REJECTED)

new_price (Giá trị giá mới được Manager chốt khi phê duyệt)

2. Xây dựng các APIs giao tiếp
FE cần 2 API chính để thay thế cho hàm loadData() và submitAction():

API 1: Lấy danh sách yêu cầu (GET /api/v1/price-requests)

Query params: ?status=PENDING (Tab Chờ xử lý) hoặc ?status=HISTORY (Tab Lịch sử).

Nhiệm vụ BE: Lấy danh sách từ bảng Price_Requests, JOIN với bảng Contracts để lấy current_price và JOIN với bảng Users để lấy tên Staff.

API 2: Xử lý yêu cầu - Duyệt/Từ chối (POST /api/v1/price-requests/:id/process)

Payload từ FE gửi lên:

JSON
{
  "action": "APPROVED", // hoặc "REJECTED"
  "newPrice": 850000,   // Gửi lên nếu APPROVED
  "managerNote": "Khách hàng VIP, đồng ý giảm giá"
}
3. Logic Xử lý Giao dịch (Database Transaction) - Rất Quan Trọng
Khi Manager bấm "Phê duyệt" hoặc "Từ chối", BE bắt buộc phải dùng Transaction vì hành động này cập nhật dữ liệu trên nhiều bảng cùng lúc. Nếu 1 bước lỗi, phải Rollback toàn bộ để tránh sai lệch dữ liệu tài chính.

Nếu action == 'APPROVED':

Update bảng Price_Requests: Set status = 'APPROVED', manager_note = payload.managerNote, new_price = payload.newPrice.

Update bảng Contracts: Set price = payload.newPrice, và has_pending_request = false.

(Tùy chọn) Insert 1 dòng vào bảng Contract_History_Logs để lưu lịch sử biến động giá (Giá cũ -> Giá mới, ai duyệt).

Nếu action == 'REJECTED':

Update bảng Price_Requests: Set status = 'REJECTED', manager_note = payload.managerNote.

Update bảng Contracts: Set has_pending_request = false (Mở khóa hợp đồng để staff có thể làm yêu cầu khác).

4. Xử lý Phân quyền (Authorization & Validation)
RBAC (Role-Based Access Control): API xử lý yêu cầu (/process) phải kiểm tra JWT Token, đảm bảo user gọi API này có quyền MANAGER, DIRECTOR hoặc ADMIN. Nếu Staff gọi API này -> Trả về 403 Forbidden.

Validation:

Kiểm tra xem yêu cầu (request_id) này có thực sự đang ở trạng thái PENDING không. (Tránh việc 2 manager cùng duyệt 1 yêu cầu).

Nếu APPROVED, newPrice phải lớn hơn 0.

Nếu REJECTED, managerNote không được để trống (đúng như logic FE đang rào).

5. Hệ thống Thông báo (Notification / WebSocket)
Sau khi Transaction thành công, BE nên:

Bắn một event qua WebSocket (hoặc tạo 1 record trong bảng Notifications) gửi trực tiếp đến staff_id (người tạo yêu cầu ban đầu) với nội dung:

"Yêu cầu đổi giá hợp đồng #123 của bạn đã được PHÊ DUYỆT (hoặc TỪ CHỐI) bởi [Tên Manager]."

Điều này giúp nhân viên sale cập nhật tình hình hợp đồng ngay lập tức để báo cho khách hàng.

⚙️ 12. Setting
1. Quản lý Mã đăng nhập doanh nghiệp (Company Code)
API Lấy cấu hình bảo mật: GET /api/v1/tenant/security

API Đổi mã doanh nghiệp: PUT /api/v1/tenant/security/code

Payload FE: { "newCode": "CTYA26", "confirmCode": "CTYA26" }

Logic BE:

Giải mã JWT, lấy tenant_id. Kiểm tra quyền TENANT_ADMIN.

Validate Regex mã 6 ký tự.

Truy vấn Database bảng Tenants kiểm tra newCode đã tồn tại chưa (Unique constraint).

Cập nhật mã mới, ghi log vào bảng Audit_Logs.

(Tùy chọn) Vô hiệu hóa toàn bộ Token hiện tại của nhân viên thuộc Tenant này để ép họ đăng nhập lại với mã mới.

2. Quản lý Dịch vụ lõi (Core Services) - Phân quyền System Admin
API Lấy cấu hình dịch vụ: GET /api/v1/tenant/services (Ai cũng xem được).

API Cập nhật dịch vụ: PUT /api/v1/admin/tenant/:tenantId/services

Logic BE Đặc Biệt (RBAC): API cập nhật này TUYỆT ĐỐI KHÔNG cho Tenant Admin gọi. Chỉ SYS_ADMIN (nhân viên của DriveLinker) mới có quyền đổi trạng thái gpsTracking, aiCamera cho khách hàng. Nếu Tenant Admin gọi, BE trả về 403 Forbidden.

Payload: { "gpsTracking": true, "aiCamera": false, "speedAlert": true }

3. Xét duyệt và Quản lý Thiết bị truy cập (Device Management) - Bảo mật đa lớp
Đây là tính năng bảo mật quan trọng (giống luồng đăng nhập thiết bị mới của ngân hàng). BE cần thiết kế bảng Devices và luồng như sau:

Luồng Đăng nhập (Login API thay đổi): Khi user login thành công, BE kiểm tra Device_Fingerprint (MAC Address / User Agent / IP).

Nếu là thiết bị mới -> BE tạo record trong bảng Devices với status = PENDING, đồng thời trả về FE lỗi 403_DEVICE_PENDING (Yêu cầu chờ Admin duyệt).

API Danh sách thiết bị: GET /api/v1/tenant/devices (Trả về các thiết bị PENDING, APPROVED, LOCKED).

API Xử lý thiết bị: PUT /api/v1/tenant/devices/:id/status

Payload: { "status": "APPROVED", "note": "Máy sale mới" }

Logic BE: Nếu Admin duyệt (APPROVED), thiết bị này được đánh dấu tin cậy. User trên thiết bị đó có thể đăng nhập bình thường.

4. Thuật toán phát hiện Xung đột IP (Anomaly Detection)
Trong code FE hiện có đoạn logic check deviceAnomaly (phát hiện nhiều tài khoản đăng nhập chung 1 IP).

Thay vì để FE tính toán dựa trên danh sách, BE nên là nơi thực hiện việc này thông qua SQL GROUP BY.

Lý do: FE chỉ load 1 trang (vd 50 thiết bị), nếu tính toán trên FE sẽ không chính xác. BE có cái nhìn toàn cảnh trên Database, có thể query: SELECT ip, COUNT(DISTINCT account_id) FROM devices WHERE tenant_id = ? GROUP BY ip HAVING COUNT(DISTINCT account_id) > 1.

BE có thể chạy Job định kỳ hoặc real-time và trả cờ isAnomaly: true kèm theo list thiết bị.

5. Ghi Log Thao tác (Audit Logs) Đa luồng
UI có 2 luồng log (Log nội bộ cho CTY, và Log tổng về Core Admin). BE xử lý bằng cách:

Bảng Audit_Logs: Có các cột tenant_id, actor_id, action, target, timestamp, ip.

Khi Tenant Admin thao tác (vd Đổi mã CTY) -> BE Insert 1 record có tenant_id của CTY đó.

Nếu SYS_ADMIN nhập vai và thao tác -> BE cũng Insert 1 record, nhưng actor_id là ID của Sys Admin, để lưu vết "Ai đã thao tác trên dữ liệu của khách".

API Lấy Log: GET /api/v1/tenant/logs (Hỗ trợ filter, pagination để table FE không bị treo khi dữ liệu log quá lớn).

🔀 13. AdminRouter
1. Hạ tầng Cơ sở dữ liệu & Kiến trúc Đa tiền thuê (Multi-tenant)
Thiết kế Database Schema: Xây dựng cấu trúc CSDL với các bảng chính: Tenants (Doanh nghiệp), Users, Roles, Vehicles (Xe), Devices (Thiết bị truy cập), Contracts (Hợp đồng), Price_Requests (Yêu cầu đổi giá), Audit_Logs, Telematics_Data (Dữ liệu GPS/AI).

Kiến trúc Isolation (Cô lập dữ liệu): Viết logic (hoặc ORM interceptor) để 100% các câu lệnh Query/Update/Delete đều phải gắn điều kiện WHERE tenant_id = ?. Tuyệt đối không để rò rỉ dữ liệu giữa các công ty.

2. Phân hệ Xác thực & Phân quyền (Auth & Security)
API Đăng nhập đa luồng:

Login cho doanh nghiệp (/api/auth/login): Check tenantCode + username + password.

Login cho Super Admin (/api/admin/login): Dành riêng cho quản trị viên hệ thống lõi.

Quản lý JWT Token: Sinh ra Access Token chứa sẵn tenant_id và role. Cấp Refresh Token để duy trì phiên đăng nhập.

Middleware RBAC (Role-Based Access Control): Viết các middleware bảo vệ Route: isStaff, isManager, isTenantAdmin, isSuperAdmin.

Bảo mật thiết bị truy cập: Bắt vân tay thiết bị (IP, Browser, OS). Nếu thiết bị mới -> khóa lại, yêu cầu TENANT_ADMIN duyệt.

Thuật toán phát hiện dị thường: Xây dựng Query check IP trùng lặp (nhiều tài khoản dùng chung 1 IP) để cảnh báo bảo mật.

3. Hạ tầng Real-time & IoT (Kết nối Thiết bị phần cứng)
Thiết lập WebSocket Server: Xây dựng kênh truyền thời gian thực (Socket.io hoặc native WS) để push data xuống Client.

Thu thập dữ liệu IoT (Ingestion): Viết service lắng nghe dữ liệu đẩy lên từ phần cứng (GPS Tracker, Camera AI) qua giao thức MQTT hoặc TCP/UDP.

Xử lý Luồng Video: Tích hợp Media Server để stream video camera trên xe (chuyển đổi RTSP sang HLS hoặc WebRTC).

Rule Engine (Hệ thống Cảnh báo): Xử lý luồng dữ liệu thô (Vận tốc, tọa độ, tọa độ mắt/miệng EAR/MAR) để sinh ra Cảnh báo (Ngủ gật, quá tốc độ, sai làn) và push ngay lập tức qua WebSocket.

API Lệnh điều khiển (IoT Commands): Viết API bắn lệnh ngược từ Server xuống Hộp đen/Camera xe (Ví dụ: Lệnh hú còi cảnh báo ngủ gật).

4. Các API Nghiệp vụ (Business Logic APIs)
API Quản lý Đội xe (Fleet Management): Lấy danh sách xe, tích hợp phân trang (Pagination), Tìm kiếm (LIKE query), và Lọc (Filter).

API Tổng quan (Dashboard Aggregation): Viết 1 API duy nhất gom dữ liệu: Tọa độ toàn bộ xe trên bản đồ, bộ đếm trạng thái, và danh sách cảnh báo AI mới nhất.

Xử lý Logic Doanh thu: Viết các câu query hoặc Job chạy ngầm (Cronjob) để tính toán: Tổng doanh thu, % tăng trưởng, Tỷ lệ khai thác xe, % thu hồi công nợ. (Che dữ liệu này nếu user không phải cấp Quản lý).

API Quy trình Duyệt Giá (Price Approvals): Thiết kế API tạo yêu cầu và API duyệt/từ chối. Bắt buộc dùng Database Transaction để đảm bảo việc cập nhật trạng thái yêu cầu và ghi đè giá mới vào Hợp đồng diễn ra đồng thời (Không bị lỗi nửa chừng).

API Nhập/Xuất Dữ liệu: Xử lý Import (đọc file Excel/CSV insert hàng loạt vào DB) và Export (query DB xuất ra file Excel tải về).

5. Phân hệ Quản trị (Admin) & Hệ thống (System)
Ghi Log Đa tầng (Audit Logging): Xây dựng service ghi log tự động. Bất cứ hành động nào làm thay đổi dữ liệu đều phải lưu lại vết (Ai làm, lúc nào, đối tượng nào, IP nào). Ghi log riêng cho Tenant và log riêng cho System Admin.

API Quản lý Cài đặt: API đổi Mã doanh nghiệp (cập nhật bảng Tenants).

Cấu hình Dịch vụ Lõi: API cho phép SUPER_ADMIN bật/tắt các module (GPS, AI Camera) cho từng doanh nghiệp.

Health Check & Monitoring: API theo dõi "sức khỏe" hệ thống (Độ trễ GPS, số lượng thiết bị Online/Offline) trả về cho màn hình Dashboard.

🖥️ 14. DashboardLayout
1. API Lấy thông tin User (Thay thế localStorage)
FE đang dùng localStorage.getItem('userRole') để vẽ Menu. Việc này ở thực tế rất nguy hiểm vì người dùng có thể tự sửa localStorage để hiện Menu Admin.

BE cần làm: Cung cấp API GET /api/v1/auth/me. Khi FE gửi Token lên, BE giải mã và trả về thông tin chuẩn: user_id, role, tenant_name, và cờ is_impersonating. FE sẽ dựa vào data từ API này để render các chức năng tương ứng.

2. Quản lý trạng thái "Core Mode" (Admin Hệ thống nhập vai)
Layout này có thanh công cụ màu đen ở dưới cùng dành cho SYS_ADMIN khi họ "đóng giả" làm người của doanh nghiệp để sửa lỗi.

BE cần làm:

Thiết kế cơ chế cấp JWT Token đặc biệt (Chứa role SYS_ADMIN nhưng thao tác trên tenant_id của khách).

Đặc biệt lưu ý: Bất cứ hành động nào (Thêm/Sửa/Xóa) được thực hiện bởi Token nhập vai này đều phải ghi Audit Log cực kỳ rõ ràng để truy vết (VD: "Admin lõi Nguyễn Văn A đã nhập vai và thêm xe cho doanh nghiệp B").

3. API Thêm mới phương tiện (Vehicle Management)
Trên Header có nút "Thêm mới" mở ra Modal nhập Biển số, Thương hiệu, Đời xe.

BE cần làm:

Cung cấp API POST /api/v1/vehicles.

Validate chặt chẽ: Biển số xe không được trùng lặp trên toàn hệ thống (hoặc trong cùng 1 Tenant).

Tự động gắn tenant_id lấy từ Token của người dùng đang đăng nhập vào bản ghi xe mới (Tuyệt đối không để FE gửi tenant_id lên để tránh lỗi bảo mật).

4. API Đồng bộ Hệ thống (System Sync)
Nút "Đồng bộ hệ thống" được dùng khi Admin cấu hình xong và muốn đẩy update xuống tất cả xe/nhân viên.

BE cần làm: Xây dựng API POST /api/v1/admin/sync. Khi gọi, BE sẽ xóa Cache cũ (Redis) và bắn một luồng sự kiện qua WebSocket (hoặc MQTT) xuống toàn bộ các trình duyệt đang online và các thiết bị phần cứng của doanh nghiệp đó để ép chúng tải lại cấu hình mới nhất.

🛡️ 15. ProtectedRouter
1. Viết Middleware Phân Quyền (RBAC Middleware)
Với mỗi allowedRoles ở Frontend, BE phải có một Middleware tương ứng chặn trước các API.

Ví dụ: Frontend khóa trang /settings chỉ cho TENANT_ADMIN.

BE phải làm: Tất cả các API cấp dữ liệu cho trang Settings (như GET /api/v1/tenant/devices hay PUT /api/v1/tenant/config) đều phải đi qua một Middleware kiểm tra quyền (VD: requireRole(['TENANT_ADMIN', 'SUPER_ADMIN_VIEW'])).

2. Xác thực bằng JWT Token (Không tin tưởng Client)
Khi FE gọi API, BE tuyệt đối không lấy Role từ Body hay Header do FE tự gõ lên.

BE phải đọc Access Token (JWT) được gửi kèm, dùng Secret_Key của server để giải mã. Role thực sự của người dùng nằm trong payload của Token này (đã được BE ký mã hóa lúc đăng nhập).

Nếu user dùng F12 sửa localStorage thành TENANT_ADMIN để lọt vào trang Cài đặt, nhưng JWT Token của họ vẫn chỉ là TENANT_STAFF, BE sẽ bóc trần sự giả mạo này.

3. Trả về đúng Mã trạng thái HTTP (HTTP Status Codes)
Khi một User cố tình "vượt rào" Frontend và gọi vào API mà họ không có quyền, BE phải phản hồi chuẩn xác để Frontend biết đường xử lý:

Trả về 401 Unauthorized: Nếu Token hết hạn, sai Token, hoặc không gửi Token. (Frontend nhận lỗi này sẽ đá user văng ra màn hình Login).

Trả về 403 Forbidden: Nếu Token hợp lệ (đúng là nhân viên của công ty), nhưng Role không đủ thẩm quyền (VD: Staff cố tình gọi API duyệt giá của Manager). (Frontend nhận lỗi này sẽ hiện thông báo "Bạn không có quyền thao tác").