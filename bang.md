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

## Ghi nhận trước khi commit — 21/11/2026

Các mục dưới đây được đối chiếu với mã nguồn và Git tại thời điểm ghi nhận. Những thay đổi frontend này hiện **chưa commit**; ngày ghi nhận không nhất thiết là ngày thực hiện.

- **Quản lý tài khoản Admin:** Thêm trang danh sách tài khoản tại `frontend/src/render/admin/AdminAccountList.tsx`, cho phép tìm theo tên, username, email hoặc số điện thoại; lọc theo vai trò và trạng thái. Trang có biểu mẫu thêm tài khoản, đổi mật khẩu, khóa và mở khóa, kèm kiểm tra dữ liệu và thông báo kết quả. Không cho khóa tài khoản đang đăng nhập hoặc Super Admin đang hoạt động cuối cùng.
- **Dữ liệu tài khoản mẫu:** Thêm `adminAccounts.ts` để quản lý các tài khoản mẫu, vai trò, trạng thái và lần đăng nhập cuối; dữ liệu và mật khẩu được lưu trong `localStorage` của trình duyệt. Đây là cơ chế dữ liệu mẫu phía frontend.
- **Đăng nhập Admin:** Đối chiếu thông tin với danh sách tài khoản mẫu, từ chối tài khoản bị khóa, cập nhật lần đăng nhập cuối và lưu tên đăng nhập, tên hiển thị cùng vai trò vào `sessionStorage`.
- **Điều hướng Admin:** Thêm đường dẫn `/overview/admin/accounts` được bảo vệ; chấp nhận các vai trò `SUPER_ADMIN`, `SUPPORT_ADMIN` và `BILLING_ADMIN` qua lớp bảo vệ route. Thêm nút mở trang tài khoản từ danh sách doanh nghiệp và xóa username khỏi phiên khi đăng xuất.
- **Ghi nhận từ nhánh main ngày 21/11:** Các thay đổi phân tích, tìm biển số, kiểm tra số điện thoại, nội dung tiếng Việt/Anh và `lichsuFE.md` lúc đó chưa commit; nhánh `NgocBang` lúc đó ở `e253328`, còn `bang.md`, hai file tài khoản Admin và `.agents/` chưa được Git theo dõi.
- **Kiểm tra:** Lần cập nhật tài liệu này chỉ đối chiếu mã nguồn và trạng thái Git; chưa chạy lại build, lint hoặc kiểm thử chức năng.
- **Nhật ký hoạt động Admin:** Thêm `adminAudit.ts` để đọc, ghi và định dạng nhật ký trong `localStorage`. Ghi nhận đăng nhập, đăng xuất và các thao tác quản trị; khi nhập vai doanh nghiệp, ghi thêm thao tác cấu hình, đồng bộ và thoát chế độ truy cập. Việc đồng bộ được ghi là mô phỏng.
- **Xem lịch sử:** Cập nhật cửa sổ lịch sử trong `AdminTenantList.tsx`: đọc lại nhật ký khi mở, hiển thị thời gian và username nếu có, cho phép mở rộng để xem các hoạt động của cùng tài khoản. Bỏ cơ chế tự đặt lại nhật ký cũ bằng dữ liệu mẫu.
- **Cài đặt doanh nghiệp:** Dùng hàm ghi nhật ký Admin chung cho các thay đổi được thực hiện khi quản trị viên nhập vai.


## Cập nhật khu vực Admin — 22/11/2026

- **Bố cục và điều hướng:** Tạo giao diện admin dùng chung với thanh menu cố định bên trái, tông đỏ–trắng, logo xe và khẩu hiệu “Drive Safe - Arrive Alive”. Menu gồm Tổng Quan, Quản lý tài khoản và Camera & Định vị; có thông tin admin và nút đăng xuất.
- **Tổng Quan:** Thiết kế lại trang với hai thẻ thống kê đã được thu gọn, danh sách doanh nghiệp, xem chi tiết, thêm doanh nghiệp, truy cập hệ thống và xem lịch sử thao tác. Các chức năng doanh nghiệp và truy cập hiện vẫn dùng dữ liệu mô phỏng phía trình duyệt.
- **Lịch sử thao tác:** Nhãn đăng xuất có màu xám, đăng nhập màu xanh lá và các hành động khác màu đỏ.
- **Quản lý tài khoản:** Đưa trang vào bố cục admin; giữ chức năng tìm kiếm, lọc, thêm, khóa/mở khóa và đổi mật khẩu. Đã bỏ chức năng sửa và xóa tài khoản. Khi đổi mật khẩu phải nhập đúng mật khẩu hiện tại; việc đối chiếu vẫn thực hiện với dữ liệu mẫu trên trình duyệt.
- **Camera & Định vị:** Tạo trang quản lý AI Camera và GPS Tracker với ba thiết bị mẫu, thống kê theo trạng thái, tìm kiếm, lọc, thêm thiết bị, cập nhật trạng thái, xem chi tiết và lịch sử thay đổi. Có thể liên kết hoặc tháo liên kết doanh nghiệp và phương tiện; hỗ trợ các trạng thái Trong kho, Đang lắp đặt, Đang sử dụng, Lỗi và Bảo hành. Kiểm tra IMEI 15 chữ số và trùng IMEI hoặc Serial Number.
- **Giới hạn dữ liệu:** Tài khoản, doanh nghiệp, lịch sử và thiết bị admin hiện dùng dữ liệu mẫu hoặc dữ liệu lưu trong trình duyệt, chưa kết nối đầy đủ với backend. Biển số tại trang thiết bị được nhập thủ công, chưa đối chiếu với danh sách xe của doanh nghiệp.
- **Kiểm tra:** Build frontend đã thành công sau các thay đổi chính, gồm giao diện admin, yêu cầu mật khẩu hiện tại và trang thiết bị. Những chỉnh sửa nhỏ tiếp theo về thông báo, kích thước thẻ và màu lịch sử chưa được build lại riêng; chưa kiểm thử đầy đủ trên trình duyệt.

## Cập nhật Camera & Định vị — 23/11/2026

- Đổi tên loại thiết bị từ **AI Camera** thành **Camera** và từ **GPS Tracker** thành **DL GPS** trong danh sách, bộ lọc và biểu mẫu.
- Gộp hai trạng thái **Lỗi** và **Bảo hành** thành **Lỗi/Bảo hành**; đổi **Trong kho** thành **Tồn kho** trên thẻ thống kê, bộ lọc và biểu mẫu.
- Cập nhật biểu tượng các thẻ thống kê cho phù hợp với tổng thiết bị, tồn kho, đang lắp đặt, đang sử dụng và lỗi/bảo hành.
- Khi đọc thiết bị đã lưu trong trình duyệt, chuyển các tên loại và trạng thái cũ sang cách hiển thị mới.
- **Kiểm tra:** Build frontend thành công sau khi đổi tên loại và gộp trạng thái; ESLint cho trang thiết bị thành công sau khi cập nhật biểu tượng. Chưa chạy lại kiểm tra sau thay đổi nhãn **Tồn kho** và chưa kiểm thử trực quan trên trình duyệt.
