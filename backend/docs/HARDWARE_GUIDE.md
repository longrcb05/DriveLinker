# Hướng dẫn Tích hợp Phần cứng thực tế (Camera AI & GPS)

Khi anh bắt đầu đưa các thiết bị phần cứng thật (như mạch Raspberry Pi, module GPS NEO-6M, Camera, module 4G) vào triển khai dự án, đây là những việc anh cần làm để phần cứng giao tiếp được với Backend Spring Boot mà chúng ta đã xây dựng:

## 1. Về mặt Thiết bị phần cứng (Edge Device)
Anh sẽ cần viết một chương trình nhỏ (thường viết bằng Python) chạy ngầm trên Raspberry Pi. Chương trình này có 2 luồng công việc chính:

### Luồng 1: GPS Tracker (Định vị)
- Liên tục đọc dữ liệu tọa độ từ module GPS qua cổng Serial.
- Đóng gói dữ liệu thành chuỗi JSON (như file `test_phase5.http`).
- Định kỳ (ví dụ mỗi 5-10 giây) gửi HTTP POST Request lên `http://<IP-SERVER>:8080/api/iot/telemetry`.
- **Lưu ý:** Bắt buộc phải gắn thêm 2 Header bảo mật vào Request:
  - `X-Device-Code`: Mã của thiết bị (ví dụ: PI-001)
  - `X-Device-Token`: Mật khẩu của thiết bị (bản rõ, ví dụ: admin)

### Luồng 2: AI Drowsiness Detection (Phân tích buồn ngủ)
- Dùng thư viện OpenCV đọc luồng video trực tiếp từ Camera.
- Tích hợp một model AI nhẹ (như MediaPipe của Google) để nhận diện khuôn mặt, vẽ các điểm mốc (landmarks) trên mắt và miệng.
- Tính toán tỷ lệ nhắm mắt (EAR - Eye Aspect Ratio).
- Tính điểm buồn ngủ (`DrowsinessScore`).
- Nếu mắt chớp bình thường: Mỗi 1-2 phút bắn 1 cục JSON `AiResult` lên server để lưu lịch sử.
- **Nếu phát hiện nhắm mắt quá 3 giây (EAR thấp):**
  - Kích hoạt còi hú (Buzzer) gắn trên mạch bằng GPIO để đánh thức tài xế ngay lập tức (Xử lý Level 1).
  - Đồng thời, bắn ngay lập tức một gói JSON `Alert` (Cảnh báo) với mức độ `DANGER` lên Server qua API `POST /api/iot/alerts` để quản lý biết (Xử lý Level 2).

## 2. Về mặt Hạ tầng Mạng
- Khi mạch Pi gắn trên xe ô tô, nó sẽ dùng mạng 4G/LTE, vì vậy **Server của anh không thể chạy `localhost` nữa**.
- Anh cần phải Public cái Backend Spring Boot này ra Internet. Có 2 cách:
  - **Cách 1 (Nhanh, dùng lúc code dở dang):** Chạy `Ngrok` trên máy tính để tạo một đường link Public trỏ về cổng 8080. Đem đường link ngrok đó gắn vào code Python trên con Pi.
  - **Cách 2 (Thực tế):** Thuê một con VPS (như DigitalOcean, AWS), deploy cục file `.jar` và database PostgreSQL lên đó, lấy địa chỉ IP tĩnh đưa cho mạch Pi.

## 3. Xử lý khi xe mất mạng (Offline Sync)
- Khi đi vào vùng sâu vùng xa rớt mạng 4G, mạch Pi gửi HTTP POST sẽ bị lỗi.
- Code Python trên Pi cần bắt lỗi này (Try-Catch), và tạm thời lưu các file JSON vào thẻ nhớ hoặc database cục bộ (SQLite) trên Pi.
- Khi nào có mạng lại, nó sẽ gửi bù lại toàn bộ (có thể gom lại thành 1 mảng lớn rồi gửi qua API Batch mà sau này Backend sẽ làm). Nhờ hệ thống Backend của mình đã có trường `eventId` (UUID) và `occurredAt`, nên gửi bù trễ cũng không lo bị lưu sai thời gian hay trùng lặp dữ liệu.
