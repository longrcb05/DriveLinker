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

## Khôi phục chức năng lên main — 24/11/2026

- Khôi phục bộ lọc và biểu đồ trang Phân tích, tìm biển số và kiểm tra số điện thoại tại Quản lý đội xe.
- Kết nối giao diện quản trị và trang Camera & Định vị; kết hợp với trang doanh nghiệp và thanh toán hiện có.
- Nối đăng nhập và nhật ký admin với dữ liệu tài khoản và lịch sử dùng chung trong trình duyệt.
- Build frontend thành công; chưa kiểm thử đầy đủ từng thao tác trên trình duyệt.
- Khôi phục nút mở rộng lịch sử theo tài khoản, thẻ tổng quan doanh nghiệp và hoạt động gần đây, cùng thông báo tài khoản admin bị khóa. Đăng xuất doanh nghiệp chỉ xóa thông tin phiên, giữ dữ liệu đã lưu trong trình duyệt.

## Cập nhật ngày 24/11/2026

- **Camera & Định vị:** Tách trạng thái **Lỗi** và **Bảo hành** trong bộ lọc và khi cập nhật thiết bị; giữ một thẻ thống kê chung **Lỗi/Bảo hành**. Thiết bị cũ chỉ có trạng thái gộp được giữ là **Lỗi/Bảo hành (chưa phân loại)** để tránh gán nhầm.
- **Nhật ký kiểm toán:** Thêm bộ lọc theo admin, ngày và loại hoạt động; hỗ trợ lọc các bản ghi có định dạng ngày cũ, đồng thời giữ chức năng mở rộng lịch sử theo tài khoản.
- **Đăng xuất:** Chỉ xóa thông tin phiên doanh nghiệp thay vì xóa toàn bộ `localStorage`, giúp giữ nhật ký và dữ liệu đã lưu trên trình duyệt.

## Cập nhật ngày 25/11/2026

- **Camera & Định vị:** Xếp hai nút **Chi tiết** và **Liên kết** theo chiều dọc trong cột thao tác.
- **Giao diện Admin:** Điều chỉnh thanh menu sang màu xám rất nhạt `#F3F4F6` và nền nội dung sang màu xám gần trắng `#F9FAFB`; giữ chữ tối và nền đỏ nhạt cho mục menu đang chọn.
- **Lịch sử thao tác hệ thống:** Bảng chính chỉ hiển thị đăng nhập và đăng xuất. Nút biểu tượng mở rộng chỉ xuất hiện ở dòng đăng xuất và cho phép xem các thao tác đã ghi của tài khoản.
- **Quản lý tài khoản:** Không cho khóa Super Admin đang hoạt động và ẩn nút khóa ở các tài khoản này; vẫn cho phép mở khóa Super Admin đã bị khóa từ trước.
- **Phân tích:** Nhấn vào trạng thái **Chưa xử lý** để mở hộp xác nhận “Đã xử lý & nhắc nhở tài xế”; chọn **OK** để chuyển thành **Đã xử lý**, hoặc **Cancel** để giữ nguyên. Trạng thái dữ liệu mẫu được lưu theo doanh nghiệp trên trình duyệt; chưa gửi nhắc nhở thực tế.
- **Kiểm tra:** Build frontend thành công sau các cập nhật trên; chưa kiểm thử trực quan đầy đủ từng thao tác.

Các chức năng Frontend cần kết nối Backend
1. Quản lý đội xe
- Hiển thị danh sách xe.
- Tìm xe theo biển số, không phân biệt chữ hoa/thường và không phụ thuộc dấu phân cách. Ví dụ: 43A11222 tìm được 43A-112.22.
- Lọc xe theo trạng thái.
- Khi thêm hoặc sửa xe, số điện thoại tài xế là không bắt buộc; nếu nhập thì phải gồm 10 chữ số và bắt đầu bằng 0.
- Dữ liệu xe cần được phân biệt theo từng doanh nghiệp.
Backend cần: API danh sách và bộ lọc xe; kiểm tra số điện thoại ở server; hỗ trợ các thao tác thêm, sửa, xóa và đổi trạng thái xe theo quyền.
2. Theo dõi & AI
- Tìm xe theo biển số, không phụ thuộc dấu phân cách.
- Hiển thị danh sách và thông tin phương tiện trong trang theo dõi.
Backend cần: cung cấp danh sách xe và dữ liệu theo dõi thuộc đúng doanh nghiệp; hỗ trợ tìm kiếm biển số nếu việc lọc được thực hiện ở server.
3. Phân tích và cảnh báo
- Lọc sự kiện theo ngày, biển số, loại cảnh báo và trạng thái xử lý.
- Bảng, thống kê và biểu đồ sử dụng dữ liệu sau khi lọc.
- Biểu đồ cột chia theo các khoảng 3 giờ; thang và khoảng có nhiều sự kiện nhất thay đổi theo dữ liệu.
- Xuất dữ liệu đã lọc thành CSV.
- Nhấn vào Chưa xử lý sẽ hiện xác nhận:
  - OK: chuyển thành Đã xử lý.
  - Cancel: giữ nguyên Chưa xử lý.
Backend cần: trả danh sách sự kiện, dữ liệu thống kê/biểu đồ theo bộ lọc và lưu trạng thái xử lý, người xử lý, thời gian xử lý. Cần kiểm tra cảnh báo thuộc đúng doanh nghiệp.
4. Quản lý tài khoản admin
- Đăng nhập admin; từ chối tài khoản đã khóa.
- Xem danh sách tài khoản; tìm theo tên, username, email hoặc số điện thoại.
- Lọc theo vai trò và trạng thái.
- Thêm tài khoản admin.
- Đổi mật khẩu của tài khoản đang đăng nhập, có kiểm tra mật khẩu hiện tại.
- Khóa/mở khóa tài khoản theo quyền.
- Super Admin đang hoạt động không thể bị khóa; không hiển thị nút khóa cho các tài khoản này.
Backend cần: API đăng nhập, danh sách/tìm kiếm/lọc, thêm tài khoản, đổi mật khẩu và khóa/mở khóa. Các quy tắc phân quyền cần được kiểm tra ở backend; mật khẩu cần được lưu dưới dạng hash.
5. Nhật ký thao tác hệ thống
- Ghi nhận tài khoản thực hiện, thời gian, hành động và nội dung.
- Lọc theo admin, ngày và loại hoạt động.
- Bảng chính chỉ hiển thị các lần đăng nhập và đăng xuất.
- Tại dòng đăng xuất, mở rộng để xem các thao tác đã được ghi của tài khoản đó.
Backend cần: ghi nhật ký tại server và cung cấp API đọc/lọc nhật ký cùng dữ liệu chi tiết theo tài khoản. Cần phân biệt nhật ký admin hệ thống với nhật ký thuộc từng doanh nghiệp.
6. Camera & Định vị
- Quản lý hai loại thiết bị: Camera và DL GPS.
- Xem danh sách và thống kê thiết bị.
- Tìm theo IMEI, Serial Number hoặc biển số.
- Lọc theo loại thiết bị, trạng thái và doanh nghiệp.
- Thêm thiết bị; IMEI phải gồm đúng 15 chữ số, không trùng IMEI hoặc Serial Number.
- Cập nhật trạng thái: Tồn kho, Đang lắp đặt, Đang sử dụng, Lỗi, Bảo hành.
- Thẻ thống kê vẫn gộp Lỗi/Bảo hành; dữ liệu cũ chưa phân loại được giữ riêng.
- Xem chi tiết, liên kết/tháo liên kết với doanh nghiệp và phương tiện; xem lịch sử thay đổi thiết bị.
Backend cần: API quản lý kho thiết bị, kiểm tra dữ liệu và trùng lặp, liên kết với doanh nghiệp/xe, lưu và trả lịch sử thay đổi. Cần thống nhất cách lưu thiết bị chưa liên kết doanh nghiệp.
7. Tổng quan và quản lý doanh nghiệp
- Hiển thị danh sách và số lượng doanh nghiệp.
- Thêm doanh nghiệp, xem chi tiết và truy cập vào hệ thống doanh nghiệp.
- Ghi nhận thao tác admin khi truy cập và thoát chế độ truy cập.
Backend cần: API danh sách, tạo và xem chi tiết doanh nghiệp; cơ chế truy cập theo quyền admin và ghi nhật ký các thao tác liên quan.