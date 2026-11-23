# NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI & TỐI ƯU HÓA HỆ THỐNG
## Tác giả: Nguyễn Nhật Minh (NhatMinh2004)
> **Dự án:** DriveLinker - Nền tảng Quản trị & Điều hành Cho thuê Xe Ô tô  
> **Nhánh làm việc:** `NhatMinh`  
> **Nguyên tắc xuyên suốt:** Bảo toàn 100% logic nghiệp vụ và dữ liệu thực tế; nâng cao trải nghiệm người dùng (UX/UI); tăng cường tính toàn vẹn dữ liệu (Data Validation); tối ưu hiệu năng hiển thị (Zero-lag Rendering); chuẩn hóa tài liệu kỹ thuật và mã nguồn.

---

## 1. TỔNG QUAN PHẠM VI CÔNG VIỆC

| Phân hệ / Màn hình | File tác động | Nội dung chính thực hiện |
| :--- | :--- | :--- |
| **Cổng Quản trị Tối cao** | `src/render/admin/AdminLogin.tsx` | Nâng cấp UI Dark/Luxury, hiệu ứng ảnh nền xe tự động, cảnh báo Caps Lock, gợi ý tài khoản mẫu. |
| **Bàn Điều hành Bản vá** | `src/render/admin/AdminDashboard.tsx` | Xây dựng Module Quản trị Bản vá (Staged Patches), quy trình Deploy 3 pha, Nhật ký kiểm toán Core. |
| **Quản trị Gói cước & Đối tác** | `src/render/admin/AdminTenantList.tsx` | Quản lý vòng đời Tenant (Trial, Active, Suspended), gia hạn & nâng cấp 4 gói thuê bao (Starter, Pro, Enterprise). |
| **Bàn Thu phí & Hóa đơn SaaS** | `src/render/admin/AdminBillingManagement.tsx` | Quản lý hóa đơn định kỳ, tính phí theo gói hoặc theo đầu xe (150.000đ/xe), đối soát thanh toán & ủy nhiệm chi. |
| **Quản lý Hợp đồng** | `src/render/ContractManagement.tsx` | Tối ưu hiệu năng bằng `useCallback`/`useMemo`, thuật toán tính hạn hợp đồng chính xác, giữ chuẩn A4 Viewer. |
| **Soạn thảo Hợp đồng** | `src/render/CreateContract.tsx` | Validation chặt chẽ (SĐT 10 số, CCCD 12 số, MST), tách `ContractPaperTemplate` chống giật lag, đàm phán giá. |
| **Bàn Phê duyệt Đơn giá** | `src/render/PriceApprovals.tsx` | Tra cứu $O(1)$ bằng `Map`, Optimistic UI Update, Preview chênh lệch giá (Delta), chống duyệt trùng. |
| **Cài đặt Doanh nghiệp** | `src/render/Settings.tsx` | Tái cấu trúc 4 tab (General, Accounts, Devices, Logs), phát hiện xung đột IP bất thường, khóa tài khoản tức thời. |
| **Đồng bộ & CI/CD** | Toàn bộ dự án | Đồng bộ code với nhánh `main`, giải quyết 4 file merge conflicts, kiểm tra build TypeScript & Vite. |

---

## 2. NHẬT KÝ THỰC HIỆN CHI TIẾT THEO TỪNG NGÀY

### 📅 Ngày 18/11/2026: Tối ưu Cổng Đăng nhập Root & Bàn Quản trị Cấp cao Super Admin

#### 1. Màn hình Đăng nhập Quản trị viên (`src/render/admin/AdminLogin.tsx`):
* **Thiết kế giao diện hiện đại & trang trọng:**
  * Bổ sung cơ chế trình chiếu hình ảnh nền tự động chuyển cảnh (`CAR_RENTAL_IMAGES`) với xe hạng sang trên nền tối.
  * Tích hợp cơ chế fallback thông minh: Tự động chuyển về nền màu tối gradient khi kết nối mạng chập chờn hoặc ảnh lỗi.
* **Tăng cường trải nghiệm & bảo mật người dùng:**
  * Thêm bộ phát hiện trạng thái phím **Caps Lock** (`capsLockOn`) để cảnh báo người dùng ngay khi nhập mật khẩu.
  * Tự động autofocus vào ô tài khoản thông qua `usernameInputRef`.
  * Hiển thị bảng gợi ý danh sách doanh nghiệp mẫu (`DEFAULT_TENANTS`: `COMPANY_A`, `COMPANY_B`, `COMPANY_C`) giúp kiểm thử nhanh chóng.
  * Thông báo lỗi xác thực đa ngôn ngữ (Tiếng Việt / English).

#### 2. Bàn Điều phối & Triển khai Bản vá Hệ thống (`src/render/admin/AdminDashboard.tsx`):
* **Xây dựng Trung tâm Quản trị Bản vá (Staged Patch Management):**
  * Cho phép Quản trị viên tối cao soạn thảo và gom nhóm các bản cập nhật theo từng phân hệ (`SYSTEM_MODULES`: GPS, DMS, Hợp đồng, Khách hàng, Báo cáo,...).
  * Hỗ trợ nạp nhanh các mẫu nội dung thường gặp (`QUICK_TEMPLATES`) giúp tiết kiệm thời gian vận hành.
  * Hỗ trợ chỉ định phạm vi áp dụng: Toàn hệ thống (`ALL`) hoặc từng đối tác thuê phần mềm cụ thể.
* **Quy trình Triển khai Đảm bảo An toàn (3-Stage Deployment Workflow):**
  * Quản lý trạng thái đồng bộ qua 4 pha: `IDLE` ➔ `CHECKING` ➔ `SYNCING` ➔ `SUCCESS`.
  * Modal hộp thoại xác nhận bắt buộc trước khi ghi đè dữ liệu lên môi trường vận hành (`confirmDeploy`).
  * Tự động ghi lại lịch sử thao tác vào `sys_core_audit_logs` phục vụ tra soát hệ thống sau này.
  * Thêm phím tắt `Ctrl/Cmd + Enter` để xác nhận nhanh trong textarea.

---

### 📅 Ngày 19/11/2026: Tái cấu trúc & Nâng cấp Phân hệ Cài đặt Doanh nghiệp (`Settings.tsx`)

* **Phân chia cấu trúc giao diện theo 4 Tab nghiệp vụ rõ ràng (`SettingsTab`):**
  1. **Tab Cấu hình chung (`GENERAL`):**
     * Quản lý mã định danh doanh nghiệp (`Company Code`) với lớp xác thực mật khẩu người quản trị cấp cao trước khi lưu.
     * Bảng điều khiển bật/tắt các dịch vụ nền tảng (Core Services: Giám sát GPS, Camera AI hành trình, Cảnh báo quá tốc độ).
  2. **Tab Quản trị Nhân sự (`ACCOUNTS`):**
     * Thêm mới nhân viên (`TENANT_STAFF`), kiểm tra ràng buộc chống trùng tên đăng nhập.
     * Tính năng Khóa / Mở khóa tài khoản tức thời (`ACTIVE` / `LOCKED`), tự động ngắt phiên và đồng bộ trực tiếp sang màn hình đăng nhập.
     * Thanh tìm kiếm nhân sự theo Tên, Email hoặc Tên đăng nhập.
  3. **Tab Quản lý Thiết bị Truy cập (`DEVICES`):**
     * Liệt kê danh mục thiết bị đã đăng nhập vào hệ thống kèm thông tin hệ điều hành (Windows, macOS, iOS, Android), trình duyệt, IP.
     * **Thuật toán phát hiện xung đột IP thời gian thực (IP Anomaly Detection):** Tự động phát hiện và cảnh báo khi 1 địa chỉ IP được sử dụng đồng thời bởi nhiều tài khoản khác nhau trong cùng thời điểm.
     * Cho phép Phê duyệt (`APPROVED`), Từ chối (`REJECTED`) hoặc Khóa thiết bị lạ truy cập.
  4. **Tab Nhật ký Thao tác (`LOGS`):**
     * Bảng kiểm toán hoạt động của toàn bộ nhân viên trong công ty.
     * Bộ lọc và tìm kiếm nhật ký đa tiêu chí, định dạng thời gian chuẩn `vi-VN`.
* **Cơ chế lưu trữ an toàn & Thông báo không chặn (Toast Notification):**
  * Xây dựng hàm trợ giúp `safeParse` xử lý an toàn ngoại lệ `JSON.parse` từ `localStorage`.
  * Hiển thị Toast thông báo trạng thái thành công/thất bại và tự động ẩn sau 3.2 giây.

---

### 📅 Ngày 20/11/2026: Tối ưu Quản lý Hợp đồng, Soạn thảo E-Contract & Duyệt Đơn giá

#### 1. Quản lý Hợp đồng & Bản nháp (`src/render/ContractManagement.tsx`):
* **Tối ưu hóa hiệu năng render (Zero-Lag):**
  * Chuyển các hàm đọc dữ liệu `loadData` và tính toán hạn hợp đồng `calculateContractExpiry` sang `useCallback`.
  * Sử dụng `useMemo` tính toán số lượng khách hàng (`totalClients`) và danh sách lọc tìm kiếm (`filteredData`), tránh re-render khi chuyển tab hoặc nhập từ khóa.
* **Nâng cấp thuật toán kiểm tra thời hạn:**
  * Tính số ngày còn lại dựa trên hiệu số thời gian thực (`Date.now()`), xử lý linh hoạt cả định dạng ngày `DD/MM/YYYY` lẫn ISO `YYYY-MM-DD`.
  * Phân loại trạng thái hạn hợp đồng: Còn hạn, Sắp hết hạn (dưới 3 ngày), Đã quá hạn, và Đã thu hồi xe.

#### 2. Soạn thảo & Phát hành Hợp đồng Điện tử (`src/render/CreateContract.tsx`):
* **Bộ ràng buộc dữ liệu đầu vào nghiêm ngặt (Data Validation Engine):**
  * Ràng buộc số điện thoại bằng Regex: `^0\d{9}$` (đúng 10 số, bắt đầu bằng số 0).
  * Ràng buộc Căn cước công dân gắn chip: `^\d{12}$` (đúng 12 chữ số).
  * Ràng buộc Mã số thuế doanh nghiệp: `^\d{10}(\d{3})?$` (10 hoặc 13 chữ số).
  * Tự động chuẩn hóa chuỗi họ tên khách hàng, loại bỏ ký tự số hoặc dấu cách thừa (`sanitizePersonName`).
  * Tự động format định dạng tiền tệ VND (`formatVND`) khi người dùng nhập đơn giá hoặc tiền cọc.
* **Cải tiến khung ký số và bản in A4:**
  * Tách component tờ hợp đồng in ấn `ContractPaperTemplate` bọc trong `React.memo` giúp trình duyệt không bị giật lag khi người dùng thao tác vẽ chữ ký số trên Canvas.
  * Lưu trữ trạng thái bản nháp tự động bằng `useRef(formData)` triệt tiêu hoàn toàn lỗi Stale Closure.
  * Tích hợp quy trình đề xuất thay đổi đơn giá thuê cho nhân viên kinh doanh ngay trên form.

#### 3. Bàn Duyệt & Đàm phán Đơn giá Hợp đồng (`src/render/PriceApprovals.tsx`):
* **Nâng cấp thuật toán xử lý dữ liệu:**
  * Chuyển đổi danh sách hợp đồng sang bảng ánh xạ `Map` (`contractMap`), giúp tra cứu thông tin hợp đồng theo `contractId` với độ phức tạp **$O(1)$** thay vì lặp $O(N)$.
  * Triển khai cơ chế **Cập nhật Giao diện Lạc quan (Optimistic UI Update)**: Khi người quản lý bấm Duyệt hoặc Từ chối, giao diện lập tức cập nhật trạng thái phản hồi mà không cần chờ tải lại toàn bộ danh sách.
  * Bổ sung khối xem trước độ chênh lệch giá (`Delta Price Preview`): Thể hiện trực quan giá niêm yết cũ, giá đề xuất mới và mức độ tăng/giảm (kèm biểu tượng mũi tên và mã màu xanh/đỏ).
  * Tự động đồng bộ đơn giá đã duyệt vào bản ghi hợp đồng chính thức trong `sys_e_contracts`.

#### 4. Quản lý Nhánh Git & Giải quyết Xung đột (Merge Conflicts):
* Đồng bộ nhánh `NhatMinh` với các commit mới nhất từ `origin/main` (PR #2 từ Long, PR #3 từ NgocBang).
* Giải quyết triệt để 4 điểm xung đột mã nguồn ở các file:
  * `ContractManagement.tsx`
  * `CreateContract.tsx`
  * `PriceApprovals.tsx`
  * `Settings.tsx`
* Giữ nguyên toàn bộ khối chú thích kỹ thuật (JSDoc Module Documentation) kết hợp với các logic tối ưu mới.
* Chạy kiểm thử hệ thống: `tsc -b && vite build` ➔ **Thành công 100% không có cảnh báo/lỗi**.
* Đẩy commit merge lên remote và cập nhật PR #4 trên GitHub (`NhatMinh` ➔ `main`).

---

### 📅 Ngày 21/11/2026: Mở rộng Quản trị Đối tác Thuê bao & Bàn Thu phí SaaS

#### 1. Quản lý Thuê bao & Vòng đời Đối tác (`src/render/admin/AdminTenantList.tsx`):
* **Thiết lập 4 gói dịch vụ SaaS chuẩn hóa (`PLAN_CONFIGS`):**
  * `TRIAL_14D`: Dùng thử 14 ngày (miễn phí, tối đa 5 xe).
  * `STARTER`: Gói cơ bản (990.000 đ/tháng, tối đa 15 xe).
  * `PRO`: Gói chuyên nghiệp (2.490.000 đ/tháng, tối đa 50 xe).
  * `ENTERPRISE`: Gói không giới hạn (4.990.000 đ/tháng, tối đa 200 xe).
* **Quản lý trạng thái và cảnh báo hạn dùng:**
  * Theo dõi hạn dùng theo ngày thực tế (`getRemainingDays`), gắn badge trạng thái rõ ràng (`Đang hoạt động`, `Dùng thử`, `Tạm ngưng/Khóa`).
  * Modal gia hạn và nâng cấp gói cước (`handleConfirmRenew`) linh hoạt theo các kỳ hạn 1 tháng, 6 tháng, 12 tháng với bảng tính tổng tiền tự động.
  * Thao tác Khóa / Mở khóa doanh nghiệp tức thời khi vi phạm hoặc quá hạn.

#### 2. Bàn Quản lý Thu phí & Hóa đơn Doanh nghiệp (`src/render/admin/AdminBillingManagement.tsx`):
* **Cơ chế tính cước linh hoạt kép:**
  * Tính theo gói trọn gói định kỳ (`PACKAGE`).
  * Tính cước linh hoạt theo số lượng phương tiện thực tế lăn bánh (`PER_VEHICLE`, đơn giá chuẩn 150.000 đ/xe/tháng).
* **Quản trị dòng tiền & Phiếu thu/Giao dịch:**
  * Lập hóa đơn thu phí định kỳ (`BillingInvoice`), theo dõi trạng thái công nợ: `PAID` (Đã thanh toán), `UNPAID` (Chưa thanh toán), `OVERDUE` (Quá hạn).
  * Hỗ trợ xác nhận giao dịch qua Chuyển khoản ngân hàng (`BANK_TRANSFER`) hoặc Tiền mặt (`CASH`), kèm mã tham chiếu và hình ảnh ủy nhiệm chi / biên lai.
  * Tích hợp tính năng Khóa / Mở khóa dịch vụ đối tác trực tiếp từ bàn hóa đơn.

---

## 2. NÂNG CẤP QUẢN LÝ DOANH NGHIỆP, CÔNG NỢ & ĐỒNG BỘ LỊCH SỬ — 📅22/11/2026

Các thay đổi dưới đây được tổng hợp từ mã nguồn hiện có trên máy và chưa được commit tại thời điểm ghi nhận.

- **`frontend/src/render/admin/AdminTenantList.tsx`:**
  - Giữ nguyên thanh tiêu đề `DriveLinker Admin`, thông tin phiên quản trị (`sys_core_admin_name`), luồng nhập vai `handleImpersonate`, luồng đăng xuất `handleLogout` và cấu trúc khóa lưu trữ gốc (`sys_tenants`, `sys_core_audit_logs`).
  - Bổ sung thanh chuyển đổi tab nội bộ giữa **1. Quản lý Doanh nghiệp (Tenant)** và **2. Công nợ & Thanh toán (Billing)**, kèm nút chuyển chế độ hiển thị giữa **Dạng bảng chi tiết** (`table`) và **Dạng thẻ truy cập nhanh** (`cards`).
  - Mở rộng mô hình dữ liệu `TenantRecord` với các trường trạng thái vận hành (`ACTIVE`, `TRIAL`, `SUSPENDED`), gói dịch vụ (`TRIAL_14D`, `STARTER`, `PRO`, `ENTERPRISE`), phí gói hàng tháng, hạn mức phương tiện tối đa, ngày kích hoạt và ngày hết hạn (`expiresAt`).
  - Bổ sung 4 thẻ thống kê KPI (Tổng doanh nghiệp, Doanh thu gói/tháng, Quy mô xe đăng ký, Cảnh báo thời hạn dưới 15 ngày), bộ lọc theo trạng thái / gói dịch vụ và ô tìm kiếm theo tên, ID, mã doanh nghiệp, người đại diện hoặc số điện thoại.
  - Bổ sung biểu mẫu thêm/sửa doanh nghiệp có kiểm tra ràng buộc dữ liệu (`CODE_REGEX`, `PHONE_REGEX`, kiểm tra trùng mã doanh nghiệp, kiểm tra ngày hết hạn) và cửa sổ **Gia hạn & Nâng cấp gói dịch vụ** (`openRenewModal`, `handleConfirmRenew`).

- **`frontend/src/render/admin/AdminBillingManagement.tsx` (Tệp mới):**
  - Xây dựng giao diện quản lý công nợ và thanh toán dịch vụ nền tảng lưu trữ qua khóa `sys_platform_billing` trong `localStorage`.
  - Hỗ trợ lập kỳ cước / hóa đơn theo 2 phương thức tính phí: cố định theo gói dịch vụ (`PACKAGE`) hoặc tính theo số lượng phương tiện đăng ký (`PER_VEHICLE`).
  - Tự động tính trạng thái công nợ (`PAID`, `UNPAID`, `OVERDUE`) và hiển thị 4 thẻ KPI tài chính (Tổng phải thanh toán, Đã xác nhận thu, Công nợ còn lại, Công nợ quá hạn).
  - Bổ sung chức năng ghi nhận giao dịch thanh toán (`BANK_TRANSFER`, `CASH`) kèm mã giao dịch, số chứng từ, tải ảnh chứng từ/ủy nhiệm chi, duyệt xác nhận giao dịch chờ (`PENDING` ➔ `CONFIRMED`) và **Khóa / Mở khóa dịch vụ doanh nghiệp** (`SUSPENDED` / `ACTIVE`, tự động mở khóa khi doanh nghiệp tất toán đủ 100% công nợ).

### Bổ sung: đồng bộ nhật ký thao tác hệ thống (`sys_core_audit_logs`)

- Kết nối các thao tác phát sinh bên phân hệ Công nợ & Thanh toán (`LẬP KỲ CƯỚC`, `THANH TOÁN`, `XÁC NHẬN TT`, `KHÓA DỊCH VỤ`, `MỞ DỊCH VỤ`) và phân hệ Quản lý Doanh nghiệp (`THÊM MỚI`, `CẬP NHẬT`, `TRẠNG THÁI`, `GIA HẠN`, `XÓA`, `TRUY CẬP`, `ĐĂNG XUẤT`) vào chung khóa `sys_core_audit_logs`.
- Phát sự kiện `storage` mỗi khi cập nhật dữ liệu để đồng bộ tức thì số lượng bản ghi trên nút **Lịch sử** và trạng thái hoạt động của doanh nghiệp giữa 2 tab.

**Ghi chú:** Các thay đổi trên chưa được commit tại thời điểm tổng hợp. Mục này ghi nhận kết quả đối chiếu mã nguồn trên nhánh `NhatMinh`, không khẳng định đã kiểm thử toàn bộ kịch bản trên môi trường Backend thực tế.

---

## 3. BẢNG TỔNG HỢP KIỂM THỬ XÁC MINH NGHIỆP VỤ (LOCAL)

| Kịch bản kiểm thử | Thao tác thực hiện | Kết quả hiển thị Frontend | Dữ liệu lưu trữ (`localStorage`) |
| :--- | :--- | :--- | :--- |
| **Quản lý gói & trạng thái DN** | Tạo mới hoặc chỉnh sửa doanh nghiệp, chọn gói `PRO` / `STARTER` / `TRIAL_14D`, chuyển đổi `ACTIVE` / `SUSPENDED`. | Cập nhật lại 4 thẻ KPI, thanh tiến độ số xe đăng ký và cảnh báo thời hạn còn dưới 15 ngày. | Cập nhật mảng đối tượng trong khóa `sys_tenants`. |
| **Gia hạn gói dịch vụ** | Bấm nút **Gia hạn** trên dòng doanh nghiệp, chọn gói và thời hạn 1 / 6 / 12 tháng. | Cộng nối tiếp ngày hết hạn (`expiresAt`), chuyển trạng thái sang `ACTIVE` và tính tổng phí gia hạn. | Cập nhật `sys_tenants` và ghi bản ghi `GIA HẠN` vào `sys_core_audit_logs`. |
| **Lập kỳ cước & Thu tiền** | Chuyển sang tab **2. Công nợ & Thanh toán**, lập hóa đơn mới và ghi nhận giao dịch chuyển khoản/tiền mặt. | Cập nhật số tiền đã trả, công nợ còn lại và chuyển trạng thái hóa đơn sang `PAID` khi thanh toán đủ. | Lưu hóa đơn vào `sys_platform_billing` và ghi log `LẬP KỲ CƯỚC`, `XÁC NHẬN TT` vào `sys_core_audit_logs`. |
| **Khóa / Mở dịch vụ theo công nợ** | Bấm **Khóa dịch vụ DN** hoặc xác nhận thanh toán tất toán toàn bộ hóa đơn của doanh nghiệp đang bị khóa. | Trạng thái doanh nghiệp chuyển sang `SUSPENDED` khi khóa và tự động mở lại `ACTIVE` khi tất toán đủ. | Đồng bộ trạng thái giữa `sys_platform_billing`, `sys_tenants` và `sys_core_audit_logs`. |
| **Đối chiếu Nhật ký Lịch sử** | Bấm nút **Lịch sử** trên thanh tiêu đề `DriveLinker Admin`. | Mở bảng nhật ký 4 cột hiển thị đầy đủ thao tác từ cả 2 phân hệ theo thứ tự mới nhất lên đầu. | Đọc và hợp nhất dữ liệu từ khóa `sys_core_audit_logs`. |