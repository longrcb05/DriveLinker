# Hướng dẫn làm việc với DriveLinker

## Phạm vi và bảo toàn chức năng

- DriveLinker là ứng dụng quản lý, theo dõi đội xe; giao diện chính nằm trong `frontend` (React, TypeScript, Vite, Tailwind CSS, React Router và Leaflet).
- Khi được yêu cầu cải thiện giao diện, chỉ thay đổi phần trình bày và khả năng sử dụng trong phạm vi yêu cầu. Giữ nguyên các route, API, dữ liệu, logic nghiệp vụ, quyền truy cập, xác thực, trạng thái, sự kiện, biểu mẫu, bản đồ, bản dịch và hành vi in hiện có. Không xóa hoặc vô hiệu hóa tính năng để làm đẹp giao diện.
- Đọc component, trạng thái, các vai trò và luồng liên quan trước khi chỉnh sửa. Không thay đổi backend, cơ sở dữ liệu, dependency hoặc hợp đồng API nếu không được yêu cầu. Giữ các thay đổi có sẵn của người dùng.
- Khi không thể bảo đảm một thay đổi chỉ tác động giao diện, dừng phần thay đổi đó và báo rõ giới hạn; không giả lập dữ liệu hoặc tuyên bố chức năng hoạt động khi chưa kiểm tra.

## Định hướng thiết kế

- Thiết kế cho người điều hành đội xe: ưu tiên đọc nhanh, mật độ dữ liệu hợp lý, trạng thái rõ ràng và thao tác thường dùng dễ tìm. Tôn trọng nhận diện DriveLinker và ngôn ngữ giao diện sẵn có; cải tiến nhất quán theo từng màn hình thay vì áp một mẫu chung vô cớ.
- Tạo cá tính bằng thứ bậc thông tin, typography, khoảng cách và chi tiết phù hợp nghiệp vụ. Tránh vẻ mặc định thường gặp: gradient trang trí tràn lan, thẻ lồng thẻ, bóng đổ nặng, biểu tượng đặt trong ô bo tròn lặp lại, hiệu ứng chuyển động hoặc số liệu giả chỉ để trang trí.
- Dùng màu có mục đích, nhất quán với ý nghĩa trạng thái; không truyền đạt trạng thái chỉ bằng màu. Ưu tiên thành phần và biểu tượng Lucide đã có, giữ ngôn ngữ và nội dung thực tế. Không thêm thư viện hoặc tài nguyên mạng khi chưa cần thiết.
- Bảo đảm tương phản, nhãn điều khiển, focus nhìn thấy được, thao tác bàn phím, vùng chạm phù hợp và hỗ trợ giảm chuyển động. Form cần nhãn và lỗi rõ ràng; dialog cần quản lý focus. Không đánh đổi khả năng truy cập lấy hiệu ứng.
- Kiểm tra bố cục ở desktop và màn hình hẹp, nội dung dài, trạng thái tải/rỗng/lỗi và dữ liệu thực tế khi có thể. Tránh cắt nội dung, tràn ngang ngoài vùng dữ liệu cần cuộn hoặc che khuất nút thao tác; giữ bản đồ và bảng sử dụng được.

## Skills và quy trình kiểm tra

- Với công việc giao diện, tham khảo `.agents/skills/impeccable/SKILL.md` và `.agents/skills/ui-ux-pro-max/SKILL.md`; dùng hướng dẫn và công cụ phù hợp với phạm vi công việc, không áp dụng máy móc mọi gợi ý.
- Trước khi sửa, ghi nhận trạng thái Git và các lỗi kiểm tra có sẵn. Sau khi sửa, chạy `npm run build` và `npm run lint` trong `frontend` (trên PowerShell có thể dùng `npm.cmd`). Phân biệt lỗi có sẵn với lỗi do thay đổi gây ra; sửa các lỗi do thay đổi trong phạm vi được phép.
- Kiểm tra trực quan trên trình duyệt khi có thể và thử các luồng liên quan: điều hướng, phân quyền, nút, form, bản đồ và in nếu bị ảnh hưởng. Nêu rõ những gì đã kiểm tra và phần chưa thể kiểm tra; build thành công không chứng minh toàn bộ chức năng hoạt động.
