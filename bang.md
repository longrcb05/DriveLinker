# Nhật ký thay đổi — 19/11/2026

Tổng hợp theo lịch sử Git và trạng thái làm việc trên nhánh `NgocBang` tại thời điểm lập tài liệu.

## Đã commit và push

### `40b1052` — Cập nhật frontend và ảnh đăng nhập

- Cập nhật giao diện đăng nhập trong `frontend/src/render/Login.tsx`; thêm ảnh `login-fleet.png` và `login-marble.png`.
- Cập nhật `Overview.tsx` và `FleetManagement.tsx`, gồm các điều chỉnh về dữ liệu hiển thị, bản đồ và xử lý danh sách xe.
- Cập nhật lịch sử frontend trong `frontend/src/render/docs/lichsuFE.md` và khóa phụ thuộc trong `frontend/package-lock.json`.

### `70fecca` — Thêm hướng dẫn và công cụ cho dự án

- Thêm `AGENTS.md` chứa hướng dẫn làm việc với dự án.
- Thêm thư mục `.agents/skills/` với các bộ hướng dẫn `impeccable` và `ui-ux-pro-max` cùng tài liệu, dữ liệu và script liên quan.

## Thay đổi đang có, chưa commit

Các thay đổi sau được ghi nhận từ working tree; Git không cho biết chính xác thời điểm chúng được thực hiện:

- **Analytics:** Thêm bộ lọc biển số, loại cảnh báo và trạng thái; điều chỉnh khung giờ, thang biểu đồ và cách xuất CSV.
- **Quản lý đội xe:** Tìm biển số linh hoạt hơn; chuẩn hóa và kiểm tra số điện thoại tài xế.
- **Theo dõi trực tiếp:** Dùng cách tìm biển số mới trong danh sách xe.
- **Dịch vụ xe:** Thêm hàm `matchesPlate` để tìm biển số không phụ thuộc dấu phân cách.
- Thư mục cache Python `.agents/skills/ui-ux-pro-max/scripts/__pycache__/` chưa được Git theo dõi.

## Chi tiết bổ sung — 20/11/2026

### Giao diện đăng nhập

- Thiết kế lại bố cục sáng, màu sắc, kiểu chữ, khoảng cách và biểu mẫu; bổ sung định dạng trong `Login.css`.
- Hiển thị logo DriveLinker, khẩu hiệu “Drive Safe - Arrive Alive” và ảnh `login-fleet.png`; bổ sung tài nguyên `login-marble.png`.
- Điều chỉnh bố cục trên màn hình nhỏ, trạng thái focus và hỗ trợ giảm chuyển động.
- Biểu mẫu có mã doanh nghiệp, tài khoản, mật khẩu và nút hiện/ẩn mật khẩu; hiển thị lỗi và trạng thái xác thực.
- Hiển thị gợi ý tài khoản mẫu, liên kết quản trị và nút chuyển Tiếng Việt/English. Phần xử lý đăng nhập phía trên `return` được giữ nguyên so với phiên bản Git đã đối chiếu.
- `frontend/package-lock.json` có thay đổi thông tin liên quan đến `axios`, `leaflet`, `react-leaflet` và `@types/leaflet`.

### Các thay đổi chưa commit hiện tại

- **`Analytics.tsx`:** Lọc sự kiện theo ngày, biển số, loại cảnh báo và trạng thái; dùng kết quả lọc cho bảng, thống kê, biểu đồ và CSV. Biểu đồ cột chia ngày thành các khoảng ba giờ, điều chỉnh thang theo dữ liệu và hiển thị khoảng có nhiều sự kiện nhất. Định dạng ngày hiển thị và mã hóa, đóng ngoặc dữ liệu CSV được điều chỉnh.
- **`FleetManagement.tsx`:** Tìm biển số không phụ thuộc dấu phân cách. Trường số điện thoại tài xế chỉ nhận tối đa 10 chữ số; nếu nhập, số phải bắt đầu bằng 0 và đủ 10 chữ số.
- **`LiveTracking.tsx` và `vehicleService.ts`:** Dùng hàm `matchesPlate` để tìm biển số không phân biệt chữ hoa/thường và bỏ qua ký tự ngoài chữ, số.
- **`lichsuFE.md`:** Sắp xếp lại phần tổng quan giao diện đăng nhập theo nhóm thiết kế, biểu mẫu và tài nguyên.
Danh sách được đối chiếu với Git và nội dung tài liệu hiện có; lần cập nhật này không kiểm thử chức năng.

### Công việc thực hiện hôm nay — 20/11/2026

- **Quản lý đội xe:** Giới hạn ô tìm kiếm theo biển số, vẫn hỗ trợ bỏ qua dấu phân cách; cập nhật gợi ý tìm kiếm bằng tiếng Việt và tiếng Anh. Bộ lọc trạng thái và các thao tác khác được giữ nguyên. Thay đổi này hiện chưa commit.
- **Phân tích:** Hiển thị ngày trong ô chọn theo dạng `dd-Mmm-yy`, ví dụ `20-Nov-26`, khi ô không được focus. Khi chỉnh sửa, trình duyệt có thể hiển thị định dạng ngày mặc định. Thay đổi này hiện chưa commit.
- **GitHub:** Gỡ thư mục `.agents/skills/` khỏi nhánh `NgocBang` bằng commit `e253328` và đã push; các file vẫn được giữ lại trên máy và hiện không được Git theo dõi.
- **Kiểm tra:** Build sau thay đổi định dạng ngày thành công; lint ghi nhận 104 lỗi và 4 cảnh báo trên toàn dự án. Sau thay đổi tìm kiếm biển số, build và lint không hoàn tất do thiếu bộ nhớ; chưa kiểm tra trực quan các thay đổi trên trình duyệt.

## Cập nhật hiện trạng — 21/11/2026

Các mục dưới đây được đối chiếu với mã nguồn và Git tại thời điểm ghi nhận. Những thay đổi frontend này hiện **chưa commit**; ngày ghi nhận không nhất thiết là ngày thực hiện.

- **Quản lý tài khoản Admin:** Thêm trang danh sách tài khoản tại `frontend/src/render/admin/AdminAccountList.tsx`, cho phép tìm theo tên, username, email hoặc số điện thoại; lọc theo vai trò và trạng thái. Trang có biểu mẫu thêm tài khoản, đổi mật khẩu, khóa và mở khóa, kèm kiểm tra dữ liệu và thông báo kết quả. Không cho khóa tài khoản đang đăng nhập hoặc Super Admin đang hoạt động cuối cùng.
- **Dữ liệu tài khoản mẫu:** Thêm `adminAccounts.ts` để quản lý các tài khoản mẫu, vai trò, trạng thái và lần đăng nhập cuối; dữ liệu và mật khẩu được lưu trong `localStorage` của trình duyệt. Đây là cơ chế dữ liệu mẫu phía frontend.
- **Đăng nhập Admin:** Đối chiếu thông tin với danh sách tài khoản mẫu, từ chối tài khoản bị khóa, cập nhật lần đăng nhập cuối và lưu tên đăng nhập, tên hiển thị cùng vai trò vào `sessionStorage`.
- **Điều hướng Admin:** Thêm đường dẫn `/overview/admin/accounts` được bảo vệ; chấp nhận các vai trò `SUPER_ADMIN`, `SUPPORT_ADMIN` và `BILLING_ADMIN` qua lớp bảo vệ route. Thêm nút mở trang tài khoản từ danh sách doanh nghiệp và xóa username khỏi phiên khi đăng xuất.
- **Các thay đổi frontend khác:** Phần phân tích, tìm biển số, kiểm tra số điện thoại tài xế và nội dung tiếng Việt/Anh vẫn đang có thay đổi chưa commit như đã mô tả ở trên. `lichsuFE.md` cũng đang có thay đổi chưa commit.
- **Trạng thái Git:** Nhánh `NgocBang` đang ở commit `e253328`; `bang.md`, hai tệp tài khoản Admin mới và thư mục `.agents/` chưa được Git theo dõi.
- **Kiểm tra:** Lần cập nhật tài liệu này chỉ đối chiếu mã nguồn và trạng thái Git; chưa chạy lại build, lint hoặc kiểm thử chức năng.
