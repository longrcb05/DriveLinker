# NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI & TỐI ƯU HÓA HỆ THỐNG
## Tác giả: Nguyễn Nhật Minh (NhatMinh2004)
> **Dự án:** DriveLinker - Nền tảng Quản trị & Điều hành Cho thuê Xe Ô tô  
> **Nhánh làm việc:** `NhatMinh`  
> **Nguyên tắc xuyên suốt:** Bảo toàn 100% logic nghiệp vụ và dữ liệu thực tế; nâng cao trải nghiệm người dùng (UX/UI); tăng cường tính toàn vẹn dữ liệu (Data Validation); tối ưu hiệu năng hiển thị (Zero-lag Rendering); chuẩn hóa tài liệu kỹ thuật và mã nguồn.

---

## 1. TỔNG QUAN PHẠM VI CÔNG VIỆC

| Phân hệ / Màn hình | File tác động | Nội dung chính thực hiện |
| :--- | :--- | :--- |
| **Cổng Quản trị Tối cao** | `src/render/admin/AdminLogin.tsx` | Nâng cấp UI Dark/Luxury, hiệu ứng ảnh nền xe tự động, cảnh báo Caps Lock, liên kết dữ liệu `adminAccounts.ts`. |
| **Bàn Điều hành Bản vá** | `src/render/admin/AdminDashboard.tsx` | Module Quản trị Bản vá (Staged Patches), quy trình Deploy 3 pha, Nhật ký kiểm toán Core. |
| **Quản trị Gói cước & Đối tác** | `src/render/admin/AdminTenantList.tsx` | Quản lý vòng đời Tenant (Trial, Active, Suspended), gia hạn & nâng cấp 4 gói thuê bao, liên kết Tài khoản Admin. |
| **Bàn Thu phí & Hóa đơn SaaS** | `src/render/admin/AdminBillingManagement.tsx` | Quản lý hóa đơn định kỳ, cước bậc thang (110k-150k/xe), tính xe vượt hạn mức, quy trình gia hạn 2 bước. |
| **Quản trị Tài khoản Admin** | `src/render/admin/AdminAccountList.tsx`<br>`adminAccounts.ts`<br>`adminAudit.ts` | Phân hệ Tài khoản Admin: CRUD tài khoản, phân quyền 3 vai trò, khóa/mở khóa an toàn, đổi mật khẩu & ghi audit log. |
| **Quản lý Hợp đồng** | `src/render/ContractManagement.tsx` | Tối ưu hiệu năng bằng `useCallback`/`useMemo`, thuật toán tính hạn hợp đồng chính xác, giữ chuẩn A4 Viewer. |
| **Soạn thảo Hợp đồng** | `src/render/CreateContract.tsx` | Validation chặt chẽ (SĐT 10 số, CCCD 12 số, MST), tách `ContractPaperTemplate` chống giật lag, đàm phán giá. |
| **Bàn Phê duyệt Đơn giá** | `src/render/PriceApprovals.tsx` | Tra cứu $O(1)$ bằng `Map`, Optimistic UI Update, Preview chênh lệch giá (Delta), chống duyệt trùng. |
| **Cài đặt Doanh nghiệp** | `src/render/Settings.tsx` | Tái cấu trúc 4 tab (General, Accounts, Devices, Logs), phát hiện xung đột IP bất thường, khóa tài khoản tức thời. |
| **Tìm kiếm & Định tuyến** | `src/App.tsx`<br>`src/services/vehicleService.ts`<br>`FleetManagement.tsx`<br>`LiveTracking.tsx` | Tích hợp thuật toán tìm biển số `matchesPlate` linh hoạt, mở route bảo vệ `/overview/admin/accounts`. |
| **Đồng bộ & CI/CD** | Toàn bộ dự án | Đồng bộ code với nhánh `main` và nhánh `NgocBang`, giải quyết merge conflicts, kiểm tra build TypeScript & Vite. |

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

### 📅 Ngày 22/11/2026: Nâng cấp Quản lý Doanh nghiệp, Công nợ Bậc thang & Kiểm thử Vercel

* **Mở rộng giao diện & nghiệp vụ `AdminTenantList.tsx`:**
  * Bổ sung thanh chuyển đổi tab nội bộ giữa **1. Quản lý Doanh nghiệp (Tenant)** và **2. Công nợ & Thanh toán (Billing)**, kèm nút chuyển chế độ hiển thị giữa **Dạng bảng chi tiết** (`table`) và **Dạng thẻ truy cập nhanh** (`cards`).
  * Mở rộng mô hình dữ liệu `TenantRecord` với các trường trạng thái vận hành (`ACTIVE`, `TRIAL`, `SUSPENDED`), gói dịch vụ, phí gói hàng tháng, hạn mức phương tiện tối đa, ngày kích hoạt và ngày hết hạn (`expiresAt`).
  * Bổ sung 4 thẻ thống kê KPI (Tổng doanh nghiệp, Doanh thu gói/tháng, Quy mô xe đăng ký, Cảnh báo thời hạn dưới 15 ngày), bộ lọc trạng thái / gói và ô tìm kiếm đa tiêu chí.
* **Nâng cấp tính toán cước sâu trong `AdminBillingManagement.tsx`:**
  * Bổ sung biểu phí bậc thang theo quy mô đội xe thực tế (`getPerVehicleTierRate`): Bậc 1 (1–10 xe: 150.000 đ/xe), Bậc 2 (11–30 xe: 130.000 đ/xe), Bậc 3 (trên 30 xe: 110.000 đ/xe).
  * Tích hợp cơ chế tính phí vượt hạn mức (`OVERAGE_RATE_PER_VEHICLE` = 120.000 đ/xe vượt hạn mức/tháng).
  * Bổ sung chính sách chiết khấu theo kỳ hạn thanh toán: 3 tháng (giảm 5%), 6 tháng (giảm 10%), 12 tháng (giảm 15%).
  * Quy trình gia hạn 2 bước trực quan: Bước 1 chọn gói & kỳ hạn; Bước 2 chuyển tiếp sang cổng thanh toán đối soát.
* **Đồng bộ nhật ký thao tác hệ thống (`sys_core_audit_logs`):**
  * Kết nối toàn bộ các thao tác phát sinh từ cả 2 phân hệ vào chung khóa lưu trữ `sys_core_audit_logs`.
  * Phát sự kiện `storage` mỗi khi cập nhật dữ liệu để đồng bộ tức thì số lượng bản ghi trên nút **Lịch sử**.
* **Xác minh CI/CD & Deploy Vercel:**
  * Phân tích và làm rõ cảnh báo từ Vercel Bot: Xác định rõ ràng dấu X đỏ là do cơ chế bảo mật preview của Vercel (`Git author NhatMinh2004 must have access to the project on Vercel`), hoàn toàn không phải do lỗi code.

---

### 📅 Ngày 23/11/2026: Tích hợp Toàn diện Tài khoản Admin, Xử lý Pull Request & Đồng bộ Nhánh Ngọc Bằng

#### 1. Tích hợp Phân hệ Quản trị Tài khoản Admin (`AdminAccountList.tsx`):
* **Tiếp nhận và chuẩn hóa mã nguồn từ commit `8e9a270` của Ngọc Bằng:**
  * Trích xuất và phục hồi toàn bộ các file tính năng thực tế sau khi phát hiện commit revert trên remote:
    * `AdminAccountList.tsx`: Màn hình danh sách tài khoản quản trị hệ thống (/overview/admin/accounts).
    * `adminAccounts.ts`: Mock dữ liệu 4 tài khoản quản trị (`adminlong`, `adminan`, `support.bang`, `billing.minh`) lưu trữ trong `localStorage`.
    * `adminAudit.ts`: Hệ thống tiện ích ghi vết hành động quản trị (`recordAdminAction`) và format thời gian.
    * `bang.md`: Nhật ký kỹ thuật của bạn Ngọc Bằng ở thư mục gốc.
* **Liên kết hệ thống & Bảo mật:**
  * Mở Route `/overview/admin/accounts` có bảo vệ bằng middleware `RequireAdminAuth` trong `App.tsx`.
  * Bổ sung nút liên kết nhanh `Tài khoản Admin` trên thanh công cụ của `AdminTenantList.tsx`.
  * Tích hợp ghi vết hành động khi đăng xuất, cấu hình hoặc đồng bộ trong `DashboardLayout.tsx`.
  * Đồng bộ cơ chế đăng nhập của `AdminLogin.tsx` với danh sách tài khoản `adminAccounts.ts`.

#### 2. Tối ưu hóa Tìm kiếm Biển số xe Linh hoạt (`matchesPlate`):
* Tích hợp hàm `matchesPlate` trong `vehicleService.ts`: Tự động loại bỏ dấu chấm, dấu gạch ngang, ký tự đặc biệt và khoảng trắng, cho phép tìm kiếm biển số xe không phân biệt chữ hoa/thường (ví dụ: gõ `43A11222` vẫn tìm thấy `43A-112.22`).
* Áp dụng thuật toán tìm kiếm mới vào `FleetManagement.tsx` và `LiveTracking.tsx`.
* Thắt chặt validation số điện thoại tài xế trong modal thêm/sửa xe (`^0\d{9}$`).

#### 3. Chuẩn hóa & Tối ưu Pull Request #4 trên GitHub:
* Cập nhật tiêu đề PR chuẩn Conventional Commits:  
  `feat(core): Tối ưu hiệu năng Hợp đồng, Duyệt giá, Cài đặt & Bổ sung phân hệ Thu phí SaaS, Quản lý gói cước`
* Soạn thảo và cập nhật mô tả PR chuyên nghiệp với đầy đủ phân mục tính năng và kiểm tra chất lượng code.
* Khảo sát chi tiết PR #1 và #2 của Long để đảm bảo tính kế thừa kiến trúc nền tảng.
* Đồng bộ nhánh `NgocBang` vào nhánh `NhatMinh`, đưa trạng thái Git về:  
  ✅ **`MERGEABLE: True` (Mergeable state: Clean, không còn conflict)**.
* Chạy kiểm thử tự động toàn diện: `tsc -b && vite build` ➔ **Thành công 100% (0 lỗi TypeScript, 0 lỗi Vite Build)**.

---

## 3. BẢNG TỔNG HỢP KIỂM CHỨNG CHỨC NĂNG (VERIFICATION MATRIX)

| STT | Luồng kiểm thử | Thao tác thực hiện | Kết quả ghi nhận | Dữ liệu lưu trữ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Đăng nhập Super Admin** | Nhập tài khoản Root trên `AdminLogin.tsx` | Nhận diện đúng Caps Lock; chuyển hướng mượt vào Admin Dashboard; lưu session an toàn. | `sessionStorage` & `sys_demo_admin_accounts` |
| 2 | **Tạo bản vá Staged Patch** | Thêm mới bản vá module GPS trên `AdminDashboard.tsx` | Bản vá hiển thị trong Staging list; quy trình deploy 3 pha hoạt động tuần tự; ghi audit log. | `sys_core_audit_logs` |
| 3 | **Validation Form Hợp đồng** | Nhập SĐT 9 số hoặc CCCD 10 số trên `CreateContract.tsx` | Hiển thị cảnh báo màu đỏ tức thì; khóa nút Lưu cho đến khi nhập đúng định dạng chuẩn. | `sys_contract_drafts` |
| 4 | **Ký số & In Hợp đồng** | Vẽ chữ ký số trên Canvas và bấm Xem trước PDF | Chữ ký kết xuất chuẩn Base64 PNG; hiển thị sắc nét trên bản in A4 độc lập; không bị nhảy trang. | Canvas toDataURL |
| 5 | **Phê duyệt đơn giá Manager** | Quản lý bấm Duyệt yêu cầu đổi giá trên `PriceApprovals.tsx` | Giá mới hiển thị màu xanh; cập nhật $O(1)$ vào hợp đồng; chuyển yêu cầu sang tab Lịch sử. | `sys_price_requests` & `sys_e_contracts` |
| 6 | **Phát hiện IP bất thường** | 2 tài khoản đăng nhập từ cùng 1 IP lạ trên `Settings.tsx` | Cột trạng thái hiển thị cờ đỏ cảnh báo xung đột IP; hỗ trợ Khóa thiết bị tức thì. | `sys_access_devices` |
| 7 | **Thu phí & Hóa đơn SaaS** | Lập kỳ cước, tính bậc thang và thanh toán trên `AdminBillingManagement.tsx` | Tính đúng công nợ theo gói hoặc đầu xe; ghi nhận giao dịch kèm ảnh ủy nhiệm chi; khóa/mở cước. | `sys_platform_billing` |
| 8 | **Gia hạn gói dịch vụ DN** | Bấm **Gia hạn** trên `AdminTenantList.tsx`, chọn gói và thời hạn | Quy trình 2 bước: cộng dồn ngày hết hạn, chiết khấu kỳ hạn và chuyển tiếp sang thanh toán. | `sys_tenants` & `sys_core_audit_logs` |
| 9 | **Quản lý Tài khoản Admin** | Mở `/overview/admin/accounts`, thêm tài khoản, khóa/mở khóa | Kiểm tra quyền Super Admin; không tự khóa mình; đổi mật khẩu và cập nhật tức thời. | `sys_demo_admin_accounts` |
| 10 | **Tìm kiếm Biển số linh hoạt** | Nhập `43A11222` không dấu trên Fleet & Live Tracking | Nhận diện chính xác xe mang biển số `43A-112.22`. | `vehicleService.ts` (`matchesPlate`) |
| 11 | **Kiểm tra Build Toàn diện** | Chạy lệnh `npm run build` | Lệnh `tsc -b && vite build` hoàn thành với mã thoát 0 (Exit Code 0). | Thư mục `dist/` |

---
*Tài liệu được cập nhật hoàn chỉnh tại `frontend/src/render/docs/NhatMinh.md` phục vụ công tác bàn giao và lưu trữ kỹ thuật của dự án DriveLinker.*
