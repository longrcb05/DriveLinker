# 🚛 DriveLinker - Fleet Intelligence

Chào mừng bạn đến với dự án **DriveLinker** - Hệ thống Quản lý và Giám sát Đội xe thời gian thực. Dự án này được xây dựng bằng hệ sinh thái hiện đại bao gồm **React, TypeScript, Vite, và Tailwind CSS**.

Dưới đây là hướng dẫn chi tiết từng bước để bạn có thể tải mã nguồn về máy, cài đặt và chạy thử dự án thành công.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt sẵn các phần mềm sau:
1. **Node.js** (Phiên bản 18.0 trở lên): [Tải tại đây](https://nodejs.org/)
2. **Git**: [Tải tại đây](https://git-scm.com/)
3. **Trình soạn thảo mã (IDE):** Khuyên dùng **Visual Studio Code (VS Code)**.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Bước 1: Tải mã nguồn về máy (Clone Repository)
Mở Terminal (hoặc Git Bash, Command Prompt) tại thư mục bạn muốn lưu dự án và chạy lệnh sau:

```bash
git clone [https://github.com/longrcb05/DriveLinker.git](https://github.com/longrcb05/DriveLinker.git)
Bước 2: Di chuyển vào thư mục Frontend
Vì dự án có thể được chia thành Frontend và Backend, hãy đảm bảo bạn đang ở đúng thư mục chứa code React:

Bash
cd DriveLinker/frontend
Bước 3: Cài đặt thư viện (Install Dependencies)
Tiến hành tải và cài đặt tất cả các gói thư viện cần thiết (React, Tailwind, Leaflet, Axios, Lucide-React,...):

Bash
npm install
(Quá trình này có thể mất từ 1-3 phút tùy vào tốc độ mạng).

Bước 4: Khởi chạy dự án (Run Development Server)
Sau khi cài đặt xong, hãy khởi động môi trường phát triển cục bộ bằng lệnh:

Bash
npm run dev
Terminal sẽ hiển thị một đường link (thường là http://localhost:5173 hoặc http://localhost:5174). Hãy Ctrl + Click vào đường link đó để mở dự án trên trình duyệt.

📜 Các lệnh kịch bản (Available Scripts)
Trong thư mục dự án, bạn có thể chạy các lệnh sau:

npm run dev: Khởi chạy ứng dụng ở chế độ phát triển (Hot-reload, có lỗi sẽ báo ngay trên màn hình).

npm run build: Đóng gói ứng dụng để chuẩn bị đưa lên môi trường Production (như Vercel). Nó sẽ biên dịch TypeScript và tối ưu hóa code.

npm run preview: Xem trước bản build Production ở dưới máy local trước khi thực sự deploy.

🛠 Xử lý lỗi thường gặp (Troubleshooting)
Trong quá trình thành viên mới tải code về và chạy, có thể gặp một vài lỗi môi trường. Dưới đây là cách giải quyết:

1. Lỗi màn hình trắng (Trang Overview) / Báo lỗi Invalid hook call
Nguyên nhân: Xung đột cache của thư viện bản đồ react-leaflet và Vite khiến nó nhận nhầm 2 phiên bản React.
Cách xử lý:

Tắt server (Bấm Ctrl + C trong Terminal).

Xóa thư mục node_modules và file package-lock.json.

Chạy lệnh cài lại từ đầu: npm install

Chạy lại dự án bằng lệnh ép xóa cache: npm run dev --force

2. Lỗi TS6133: 'xyz' is declared but its value is never read khi chạy build
Nguyên nhân: Trình biên dịch TypeScript (TSC) trong dự án này được cấu hình rất khắt khe. Nếu bạn import một biến, component hoặc thư viện mà không sử dụng tới trong file đó, quá trình build sẽ thất bại.
Cách xử lý:

Mở file bị báo lỗi.

Bấm tổ hợp phím Shift + Alt + O (trên VS Code) để tự động dọn dẹp các import thừa.

Lưu file và chạy lại npm run build.
