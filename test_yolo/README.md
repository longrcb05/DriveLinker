# DriveLinker Mini - Hệ Thống AI Cảnh Báo Ngủ Gật (YOLOv8)

Dự án này là một nguyên mẫu thử nghiệm (Mini Project) mô phỏng module Edge-AI của hệ thống **DriveLinker: Intelligent Rental Vehicle Management and Driver Monitoring System**. 

Hệ thống sử dụng camera kết hợp với mô hình học sâu **YOLOv8** để theo dõi khuôn mặt, phân tích các dấu hiệu mệt mỏi của tài xế và đưa ra cảnh báo âm thanh trực tiếp tại xe (Level 1 Alert)[cite: 1].

## 🌟 Cơ chế hoạt động & Logic thuật toán

- **Thuật toán "2 Chấm" (Xác định độ mở của mắt):** Ý tưởng cốt lõi của hệ thống dựa trên việc theo dõi khoảng cách mí mắt. AI sẽ xác định 1 chấm ở mí mắt trên và 1 chấm ở bọng mắt (mí dưới). Khi tài xế tỉnh táo, 2 chấm này giữ một khoảng cách nhất định. Khi 2 chấm này tiến lại gần sát nhau (khoảng cách tiến về 0) và giữ nguyên trạng thái trên 3 giây, hệ thống kết luận tài xế đang ngủ gật.
- **Hệ thống Điểm buồn ngủ (Drowsiness Score):** Thuật toán tính điểm động từ 0 đến 100 thay vì chỉ đánh giá Đúng/Sai[cite: 1]. Điểm số bị trừ đi hoặc cộng dồn dựa trên trạng thái nhắm mắt hoặc ngáp.
- **Phân loại 4 trạng thái:** Cập nhật tình trạng tài xế qua các mức: Bình thường (0-30), Mệt mỏi (31-60), Cảnh báo (61-80), và Nguy hiểm (81-100)[cite: 1].
- **Cảnh báo tức thời:** Tự động phát âm thanh báo động (Level 1 Audio Alert) khi điểm số chạm mức Nguy hiểm[cite: 1].

## 📂 Cấu trúc thư mục

```text
drivelinker_mini/
│
├── main.py                   # File code chính (chứa logic đo thời gian và tính điểm)
├── best.pt                   # File trọng số (weights) của YOLOv8 đã được huấn luyện
├── face_landmarker.task      # File mô hình MediaPipe dùng để lấy mốc khuôn mặt 3D
├── am_thanh_canh_bao.wav     # File âm thanh (.wav) dùng để phát báo động
└── README.md                 # Tài liệu hướng dẫn này

🚀 Hướng dẫn Cài đặt & Chạy dự án
Yêu cầu hệ thống (Prerequisites)
Python: Phiên bản từ 3.8 đến 3.11 (MediaPipe hoạt động ổn định nhất trên các phiên bản này).

Phần cứng: Máy tính có kết nối Webcam.

Bước 1: Chuẩn bị mã nguồn
Tải dự án về máy và mở terminal (Command Prompt / PowerShell / VS Code Terminal) tại thư mục drivelinker_mini.

Bước 2: Tạo môi trường ảo (Khuyến nghị)
Việc tạo môi trường ảo giúp các thư viện của dự án không bị xung đột với các dự án khác trên máy của bạn.

Trên Windows:
python -m venv venv
venv\Scripts\activate

Trên macOS/Linux:
python3 -m venv venv
source venv/bin/activate
Bước 3: Cài đặt các thư viện cần thiết (Dependencies)
Chạy lệnh sau để cài đặt toàn bộ các gói thư viện Python yêu cầu cho dự án:

pip install opencv-python ultralytics mediapipe pygame

Giải thích thư viện:

- opencv-python: Để xử lý hình ảnh và mở camera.
- ultralytics: Thư viện chính thức chạy mô hình YOLOv8.
- mediapipe: Thư viện của Google để vẽ lưới khuôn mặt 3D và tính các tỷ lệ EAR/MAR.
- pygame: Dùng để phát âm thanh cảnh báo không bị giật lag luồng camera.

Bước 4: Kiểm tra tài nguyên (Assets)
Trước khi chạy, hãy đảm bảo bạn đã có đủ 3 file tài nguyên này đặt cùng thư mục với file main.py:

- best.pt: File trọng số của YOLOv8 (bạn tự train hoặc copy vào nếu để trong thư mục runs/detect/train/weights/best.pt thì nhớ sửa lại đường dẫn trong file code).

- face_landmarker.task: File mô hình của MediaPipe. (Có thể tải xuống từ trang chủ Google MediaPipe Face Landmarker).

- am_thanh_canh_bao.wav: Còi báo động định dạng .wav.

Bước 5: Chạy chương trình
Gõ lệnh sau vào Terminal để khởi động hệ thống
- python main.py
🛑 Phím tắt khi sử dụng
Khi camera đang bật, để thoát chương trình an toàn, hãy bấm phím q hoặc ESC trên bàn phím, hệ thống sẽ tự động dọn dẹp bộ nhớ và ngắt camera.