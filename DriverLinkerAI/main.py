#  main.py
#    - Chức năng: Điểm neo điều phối toàn bộ vòng lặp của hệ thống.
#    - Ý nghĩa: Khởi tạo Camera, nạp mô hình AI (YOLOv8, MediaPipe), hệ thống âm 
#      thanh (Pygame). Nó liên tục đọc khung hình, luân chuyển dữ liệu qua lại giữa 
#      các file trên và vẽ kết quả (Render UI) lên màn hình giám sát.

# pyrefly: ignore[missing-import]
import cv2
import time
import os
# pyrefly: ignore[missing-import]
from ultralytics import YOLO
# pyrefly: ignore[missing-import]
import mediapipe as mp
# pyrefly: ignore[missing-import]
from mediapipe.tasks import python
# pyrefly: ignore[missing-import]
from mediapipe.tasks.python import vision
# pyrefly: ignore[missing-import]
import numpy as np
try:
    from PIL import Image, ImageDraw, ImageFont
    FONT_ARIAL_PATH = "C:/Windows/Fonts/arial.ttf"
    if os.path.exists(FONT_ARIAL_PATH):
        VIETNAMESE_FONT = ImageFont.truetype(FONT_ARIAL_PATH, 14)
    else:
        VIETNAMESE_FONT = ImageFont.load_default()
    HAS_PIL = True
except Exception:
    HAS_PIL = False
    VIETNAMESE_FONT = None

# Import các thành phần từ các file đã chia nhỏ
from config import Config
from fatigue_manager import FatigueManager
from utils import calculate_ear, calculate_mar, calculate_head_pitch

# ============================================================
# Thiết lập 3 thư mục phân loại bằng chứng theo mức cảnh báo
# ============================================================
EVIDENCE_DIR = "bang_chung"
EVIDENCE_DIR_VANG = getattr(Config, 'EVIDENCE_DIR_VANG', "bang_chung/CanhBaoVang")
EVIDENCE_DIR_CAM  = getattr(Config, 'EVIDENCE_DIR_CAM',  "bang_chung/CanhBaoCam")
EVIDENCE_DIR_DO   = getattr(Config, 'EVIDENCE_DIR_DO',   "bang_chung/CanhBaoDo")

for _d in [EVIDENCE_DIR, EVIDENCE_DIR_VANG, EVIDENCE_DIR_CAM, EVIDENCE_DIR_DO]:
    if not os.path.exists(_d):
        os.makedirs(_d)
        print(f"Đã tạo thư mục: {_d}")


class SmoothBox:
    """Bộ lọc Exponential Moving Average (EMA) giúp tọa độ bounding box mượt mà, chống rung giật."""
    def __init__(self, alpha=0.35):
        self.alpha = alpha
        self.current_box = None

    def update(self, new_box):
        if new_box is None:
            self.current_box = None
            return None
        if self.current_box is None:
            self.current_box = [float(c) for c in new_box]
        else:
            for i in range(4):
                self.current_box[i] = self.alpha * new_box[i] + (1.0 - self.alpha) * self.current_box[i]
        return [int(round(c)) for c in self.current_box]

    def reset(self):
        self.current_box = None


def format_vietnamese_label(text_or_reason, status=None, conf=None):
    """
    Chuyển đổi nhãn vi phạm/trạng thái sang tiếng Việt có dấu chuẩn xác,
    loại bỏ hoàn toàn tiền tố trước dấu hai chấm (như DANGER:, ORANGE:, VANG:, DO:, Driver:).
    """
    raw = str(text_or_reason or "").strip()
    if ":" in raw:
        raw = raw.split(":", 1)[1].strip()
    r = raw.upper()

    label_vn = ""
    if "NGU GAT" in r or "NGU" in r or "MICROSLEEP" in r:
        label_vn = "Ngủ gật"
    elif "NGAP SAU" in r:
        label_vn = "Ngáp sâu"
    elif "NGAP NHE" in r or "NGAP" in r or "YAWN" in r:
        label_vn = "Ngáp"
    elif "CHOP MAT" in r or "CHOP" in r:
        label_vn = "Chớp mắt chậm"
    elif "GUC DAU" in r:
        label_vn = "Gục đầu"
    elif "CUI DAU" in r:
        label_vn = "Cúi đầu"
    elif "NHAM MAT" in r:
        label_vn = "Nhắm mắt"
    elif "ALERT" in r or "TINH TAO" in r or r == "NORMAL":
        label_vn = "Tỉnh táo"
    elif status == "Danger":
        label_vn = "Ngủ gật"
    elif status == "Orange":
        label_vn = "Buồn ngủ"
    elif status == "Warning":
        label_vn = "Mệt mỏi"
    elif status == "Normal":
        label_vn = "Tỉnh táo"
    else:
        label_vn = raw if raw else "Tỉnh táo"

    if conf is not None:
        label_vn = f"{label_vn} {int(conf * 100)}%"

    return label_vn


def draw_smart_face_box(img, box, label, color=(0, 255, 0), corner_len=18, thickness=2):
    """
    Vẽ khung nhận diện khuôn mặt phong cách HUD hiện đại:
    - Bo 4 góc vuông (corner brackets) tinh tế, không che khuất khuôn mặt
    - Huy hiệu nhãn (badge) nền sẫm hiển thị trạng thái bằng tiếng Việt có dấu, không có tiền tố ":"
    """
    if box is None:
        return
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    if w <= 10 or h <= 10:
        return

    # 1. Đường viền mỏng bao quanh
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 1, cv2.LINE_AA)

    # 2. 4 góc công nghệ cao (HUD corner brackets)
    cl = min(corner_len, max(6, w // 4), max(6, h // 4))
    # Góc trên - trái
    cv2.line(img, (x1, y1), (x1 + cl, y1), color, thickness + 1)
    cv2.line(img, (x1, y1), (x1, y1 + cl), color, thickness + 1)
    # Góc trên - phải
    cv2.line(img, (x2, y1), (x2 - cl, y1), color, thickness + 1)
    cv2.line(img, (x2, y1), (x2, y1 + cl), color, thickness + 1)
    # Góc dưới - trái
    cv2.line(img, (x1, y2), (x1 + cl, y2), color, thickness + 1)
    cv2.line(img, (x1, y2), (x1, y2 - cl), color, thickness + 1)
    # Góc dưới - phải
    cv2.line(img, (x2, y2), (x2 - cl, y2), color, thickness + 1)
    cv2.line(img, (x2, y2), (x2, y2 - cl), color, thickness + 1)

    # 3. Badge nhãn trạng thái trên đầu khung (tiếng Việt có dấu, loại bỏ tiền tố ":")
    if label:
        clean_label = format_vietnamese_label(label)
        if HAS_PIL and VIETNAMESE_FONT is not None:
            bbox = VIETNAMESE_FONT.getbbox(clean_label)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            badge_h = max(th + 8, 22)
            badge_y1 = max(0, y1 - badge_h)
            badge_y2 = y1
            badge_x2 = min(img.shape[1], x1 + tw + 16)

            cv2.rectangle(img, (x1, badge_y1), (badge_x2, badge_y2), (20, 20, 20), -1)
            cv2.rectangle(img, (x1, badge_y1), (badge_x2, badge_y2), color, 1)

            roi_w = badge_x2 - x1
            roi_h = badge_y2 - badge_y1
            if roi_w > 0 and roi_h > 0:
                badge_roi = img[badge_y1:badge_y2, x1:badge_x2]
                pil_img = Image.fromarray(cv2.cvtColor(badge_roi, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(pil_img)
                draw.text((8, (roi_h - th) // 2 - 1), clean_label, font=VIETNAMESE_FONT, fill=(255, 255, 255))
                img[badge_y1:badge_y2, x1:badge_x2] = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        else:
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            (tw, th), baseline = cv2.getTextSize(clean_label, font, font_scale, 1)
            badge_y1 = max(0, y1 - th - 8)
            badge_y2 = y1
            badge_x2 = min(img.shape[1], x1 + tw + 12)
            cv2.rectangle(img, (x1, badge_y1), (badge_x2, badge_y2), (20, 20, 20), -1)
            cv2.rectangle(img, (x1, badge_y1), (badge_x2, badge_y2), color, 1)
            cv2.putText(img, clean_label, (x1 + 6, badge_y2 - 5), font, font_scale, (255, 255, 255), 1, cv2.LINE_AA)


def _chup_anh_bang_chung(frame, reason_text, warning_level, timestamp_str, display_time, face_box=None, box_label=None):
    """
    Chụp và lưu ảnh bằng chứng vào đúng thư mục theo mức cảnh báo.
    Các dòng thông tin hiển thị trên nền trong suốt hoàn toàn, chữ in trực tiếp sắc nét không bị đè viền đen.
    Khi chụp, vẽ ô vuông đo khuôn mặt HUD ôm trọn khuôn mặt tài xế.

    warning_level: 'Warning' | 'Orange' | 'Danger'
    """
    # 1. Chọn thư mục đích theo mức cảnh báo
    if warning_level == "Warning":
        save_dir  = EVIDENCE_DIR_VANG
        level_lbl = "VANG"
        lbl_color = (0, 255, 255)   # Vàng (BGR)
    elif warning_level == "Orange":
        save_dir  = EVIDENCE_DIR_CAM
        level_lbl = "CAM"
        lbl_color = (0, 165, 255)   # Cam
    else:                            # Danger hoặc mặc định
        save_dir  = EVIDENCE_DIR_DO
        level_lbl = "DO"
        lbl_color = (0, 0, 255)     # Đỏ

    evidence_frame = frame.copy()

    # 2. Vẽ ô vuông đo khuôn mặt công nghệ cao lên ảnh bằng chứng
    if face_box is not None:
        draw_smart_face_box(evidence_frame, face_box, label=box_label or format_vietnamese_label(reason_text, warning_level), color=lbl_color)

    # 3. Lấy thông tin xe từ Config
    bien_so  = getattr(Config, 'BIEN_SO_XE', 'N/A')
    dinh_vi  = getattr(Config, 'DINH_VI',    'N/A')
    toc_do   = getattr(Config, 'TOC_DO',     'N/A')

    # 4. Danh sách các dòng chú thích sẽ in lên ảnh (nền hoàn toàn trong suốt)
    lines = [
        f"MUC CANH BAO : {level_lbl}",
        f"VI PHAM      : {reason_text}",
        f"THOI GIAN    : {display_time}",
        f"BIEN SO XE   : {bien_so}",
        f"TOC DO       : {toc_do}",
        f"DINH VI      : {dinh_vi}",
    ]

    # 5. In từng dòng thông tin lên ảnh với nền trong suốt (chữ đơn sắc nét, không bị đè chữ đen)
    font       = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.55
    thickness  = 1
    line_height = 24          # khoảng cách giữa các dòng (pixel)
    padding    = 8

    for i, line in enumerate(lines):
        y = padding + line_height * i + 16
        # Dòng đầu (mức cảnh báo) dùng màu riêng; các dòng còn lại dùng trắng
        color = lbl_color if i == 0 else (255, 255, 255)
        cv2.putText(evidence_frame, line, (8, y), font, font_scale, color, thickness, cv2.LINE_AA)

    # 6. Lưu file
    safe_name = reason_text.replace(" ", "_").replace("/", "_").replace("(", "").replace(")", "").replace("|", "_")
    img_path  = os.path.join(save_dir, f"{level_lbl}_{safe_name}_{timestamp_str}.jpg")
    cv2.imwrite(img_path, evidence_frame)
    return img_path


# 3. main
if __name__ == "__main__":
    # khởi tạo âm thanh
    try:
        # pyrefly: ignore[missing-import]
        import pygame
        pygame.mixer.init()
        alert_sound = pygame.mixer.Sound('am_thanh_canh_bao.wav')
        
        # Nạp âm thanh cảnh báo mất khuôn mặt (lời thoại tiếng Việt tốc độ 1.5x)
        try:
            face_missing_sound = pygame.mixer.Sound('canh_bao_mat_mat.mp3')
        except Exception:
            face_missing_sound = None

        # Nạp âm thanh giọng nói nhắc nhở nhẹ nhàng khi Cảnh Báo Cam (5 lần vàng)
        try:
            orange_voice_file = getattr(Config, 'ORANGE_VOICE_FILE', getattr(Config, 'DROWSY_VOICE_FILE', 'nhac_nho_tap_trung.mp3'))
            drowsy_voice_sound = pygame.mixer.Sound(orange_voice_file)
        except Exception:
            drowsy_voice_sound = None

        HAS_PYGAME = True
    except (ImportError, FileNotFoundError):
        print("Cảnh báo: Không tìm thấy pygame hoặc file âm thanh.")
        HAS_PYGAME = False
        alert_sound = None
        face_missing_sound = None
        drowsy_voice_sound = None

    # khởi tạo mô hình AI
    model = YOLO('runs/detect/train/weights/best.pt')
    
    base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        num_faces=1,
        min_face_detection_confidence=Config.MIN_FACE_CONFIDENCE,
        min_face_presence_confidence=Config.MIN_FACE_CONFIDENCE,
        min_tracking_confidence=Config.MIN_LANDMARK_CONFIDENCE
    )
    face_landmarker = vision.FaceLandmarker.create_from_options(options)
    
    # khởi tạo bộ quản lý logic
    fatigue_manager = FatigueManager()
    is_alerting = False
    alert_start_time = 0
    alert_reason_type = "" # 'EMERGENCY', 'YAWN', 'GENERAL'
    last_alert_stop_time = 0
    last_evidence_time = 0
    last_evidence_reason = ""
    prev_status = "Normal"          # Theo dõi trạng thái khung hình trước để phát hiện chuyển cấp
    last_face_seen_time = time.time()
    is_face_missing_alerting = False
    last_face_missing_sound_time = 0
    face_was_lost = False
    face_box_smoother = SmoothBox(alpha=getattr(Config, 'YOLO_SMOOTH_ALPHA', 0.35))

    # Bộ đệm lưu khung hình đỉnh điểm vi phạm (Peak Frame Buffer) để bắt trọn khoảnh khắc vi phạm
    best_eye_frame = None
    best_eye_box = None
    min_ear_val = 999.0

    best_mouth_frame = None
    best_mouth_box = None
    max_mar_val = -1.0

    best_head_frame = None
    best_head_box = None
    max_pitch_val = -999.0

    print("Đang khởi động camera...Vui lòng chờ")
    cap = cv2.VideoCapture(Config.CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, Config.FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.FRAME_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, Config.TARGET_FPS)

    if not cap.isOpened():
        print("Không tìm thấy camera")
        
    # tạo cửa sổ hiển thị trước để tránh lỗi getWindowProperty
    cv2.namedWindow("DriveLinker Edge AI", cv2.WINDOW_NORMAL)

    # warmup: bỏ qua các frame rỗng đầu tiên khi camera chưa kịp khởi động
    print("Đang làm nóng camera...")
    for _ in range(10):
        cap.read()

    last_valid_frame_monotonic = time.monotonic()

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            current_loop_time = time.time()
            now_mono = time.monotonic()

            if not ret:
                # Bug I-11: Đo timeout camera bằng thời gian thực tế time.monotonic()
                if now_mono - last_valid_frame_monotonic >= Config.CAMERA_TIMEOUT:
                    print(f"❌ Camera mất tín hiệu quá {Config.CAMERA_TIMEOUT}s, dừng chương trình.")
                    break
                continue
            last_valid_frame_monotonic = now_mono

            # Bug I-20: Tách riêng display_frame để vẽ UI, giữ frame gốc cho MediaPipe/YOLO
            display_frame = frame.copy()

            # 1. Pipeline YOLO: Nhận diện phân loại với ngưỡng tin cậy và giới hạn 1 đối tượng tốt nhất
            yolo_conf_thresh = getattr(Config, 'YOLO_CONF_THRESHOLD', 0.45)
            results = model(frame, conf=yolo_conf_thresh, max_det=1, verbose=False)
            best_yolo_box, best_yolo_label, best_yolo_conf = None, None, 0.0
            fh, fw = frame.shape[:2]
            max_w = fw * getattr(Config, 'MAX_BOX_WIDTH_RATIO', 0.70)
            max_h = fh * getattr(Config, 'MAX_BOX_HEIGHT_RATIO', 0.80)

            for r in results:
                if len(r.boxes) > 0:
                    b = r.boxes[0]
                    bx1, by1, bx2, by2 = map(int, b.xyxy[0])
                    bw, bh = bx2 - bx1, by2 - by1
                    # Lọc bỏ bounding box to bất thường (chiếm gần hết màn hình do nhận nhầm tường/nền)
                    if 30 < bw < max_w and 30 < bh < max_h:
                        best_yolo_box = [bx1, by1, bx2, by2]
                        best_yolo_label = model.names[int(b.cls[0])]
                        best_yolo_conf = float(b.conf[0])

            # 2. Pipeline MediaPipe và xử lý logic
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            results_mp = face_landmarker.detect(mp_image)
            raw_face_box = None
            
            if results_mp.face_landmarks:
                landmarks = results_mp.face_landmarks[0]
                last_face_seen_time = current_loop_time

                # Tính bounding box chuẩn xác ôm sát khuôn mặt từ 478 landmarks của MediaPipe
                xs = [lm.x for lm in landmarks]
                ys = [lm.y for lm in landmarks]
                min_x = int(min(xs) * fw)
                max_x = int(max(xs) * fw)
                min_y = int(min(ys) * fh)
                max_y = int(max(ys) * fh)
                face_w = max_x - min_x
                face_h = max_y - min_y
                # Thêm lề (padding) giải phẫu học tự nhiên: 12% hai bên, 20% trán/tóc, 8% cằm
                pad_x = int(face_w * 0.12)
                pad_y_top = int(face_h * 0.20)
                pad_y_bot = int(face_h * 0.08)

                fx1 = max(0, min_x - pad_x)
                fy1 = max(0, min_y - pad_y_top)
                fx2 = min(fw, max_x + pad_x)
                fy2 = min(fh, max_y + pad_y_bot)
                raw_face_box = [fx1, fy1, fx2, fy2]
                smoothed_face_box = face_box_smoother.update(raw_face_box)

                # Nếu trước đó đang cảnh báo mất mặt -> dừng ngay giọng nói khi thấy lại mặt
                if is_face_missing_alerting:
                    if HAS_PYGAME and face_missing_sound:
                        face_missing_sound.stop()
                    is_face_missing_alerting = False

                # QUAN TRỌNG: KHÔNG ĐÓNG BĂNG XỬ LÝ KHI ĐANG CẢNH BÁO
                # Luôn cập nhật trạng thái mắt, miệng, đầu để phản hồi ngay khi tài xế mở mắt / hết ngáp
                if Config.ENABLE_EYE_DETECTION:
                    ear = calculate_ear(landmarks)
                    ear_val_float = ear[2] if isinstance(ear, (tuple, list)) else ear
                    # Ghi nhận frame và ô vuông khuôn mặt lúc mắt nhắm sâu nhất (EAR nhỏ nhất)
                    if ear_val_float <= Config.EAR_CLOSED:
                        if best_eye_frame is None or ear_val_float < min_ear_val:
                            min_ear_val = ear_val_float
                            best_eye_frame = display_frame.copy()
                            best_eye_box = list(smoothed_face_box) if smoothed_face_box else None
                    fatigue_manager.update_eyes(ear, current_loop_time)

                if Config.ENABLE_YAWN_DETECTION:
                    mar = calculate_mar(landmarks)
                    # Ghi nhận frame và ô vuông khuôn mặt lúc há miệng to nhất (MAR lớn nhất)
                    if mar >= getattr(Config, 'MAR_LIGHT_YAWN', 0.70):
                        if best_mouth_frame is None or mar > max_mar_val:
                            max_mar_val = mar
                            best_mouth_frame = display_frame.copy()
                            best_mouth_box = list(smoothed_face_box) if smoothed_face_box else None
                    fatigue_manager.update_mouth(mar, current_loop_time)

                if Config.ENABLE_HEAD_DETECTION:
                    pitch_val = calculate_head_pitch(landmarks)
                    # Ghi nhận frame và ô vuông khuôn mặt lúc đầu gục thấp nhất
                    if pitch_val > Config.HEAD_DROP_ANGLE:
                        if best_head_frame is None or pitch_val > max_pitch_val:
                            max_pitch_val = pitch_val
                            best_head_frame = display_frame.copy()
                            best_head_box = list(smoothed_face_box) if smoothed_face_box else None
                    fatigue_manager.update_head(pitch_val, current_loop_time)

                # Giảm dần điểm khi lái xe an toàn tỉnh táo ổn định
                fatigue_manager.apply_decay(current_loop_time)

                # TỐI ƯU HÓA: Nếu trước đó mất mặt ngay sau cảnh báo đỏ (hoặc đang trong cảnh báo nguy hiểm),
                # khi thấy lại khuôn mặt ở trạng thái bình thường -> LẬP TỨC TRỞ VỀ TRẠNG THÁI BÌNH THƯỜNG
                if face_was_lost:
                    if fatigue_manager.is_driver_alert:
                        if getattr(fatigue_manager, 'red_alert_face_lost', False) or is_alerting:
                            if HAS_PYGAME:
                                if alert_sound:
                                    alert_sound.stop()
                                if drowsy_voice_sound:
                                    drowsy_voice_sound.stop()
                                if face_missing_sound:
                                    face_missing_sound.stop()
                            is_alerting = False
                            alert_reason_type = None
                            last_alert_stop_time = current_loop_time
                            fatigue_manager.red_alert_face_lost = False
                            fatigue_manager.score = 0
                            fatigue_manager.violation_reason = ""
                            fatigue_manager.reset_all_penalties(current_loop_time)
                            print("✅ [PHỤC HỒI NHANH] Đã nhận diện lại khuôn mặt ở trạng thái bình thường -> Lập tức trở về trạng thái bình thường (0đ)!")
                    face_was_lost = False

            else:
                face_was_lost = True
                face_box_smoother.reset()
                raw_face_box = best_yolo_box if best_yolo_box else None
                # Bug I-01: Mất dấu khuôn mặt -> ngắt ngay các bộ đếm nhắm mắt/ngáp
                fatigue_manager.on_face_lost(current_loop_time)
                missing_duration = current_loop_time - last_face_seen_time
                if Config.ALERT_ON_FACE_MISSING:
                    if missing_duration >= Config.FACE_MISSING_TIME:
                        cv2.putText(display_frame, f"KHONG THAY KHUON MAT! ({missing_duration:.1f}s)", (20, 160),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
                        
                        # Phát cảnh báo giọng nói (tốc độ 1.5x): "Camera không thấy khuôn mặt! Camera không thấy khuôn mặt!"
                        if HAS_PYGAME and face_missing_sound:
                            if not is_face_missing_alerting or (current_loop_time - last_face_missing_sound_time >= 4.5):
                                face_missing_sound.play()
                                is_face_missing_alerting = True
                                last_face_missing_sound_time = current_loop_time
                                print("📢 CẢNH BÁO GIỌNG NÓI (1.5x): Camera không thấy khuôn mặt!")

            # Làm mịn tọa độ bounding box bằng EMA filter chống rung giật
            smoothed_face_box = face_box_smoother.update(raw_face_box)

            # 3. Lấy kết quả và quản lý cảnh báo nhạy bén (Responsive Alerting)
            status, color, should_alert, violation_reason = fatigue_manager.get_status(current_loop_time)

            if is_alerting:
                alert_elapsed = current_loop_time - alert_start_time

                # QUY TẮC ƯU TIÊN TUYỆT ĐỐI: Bất kể đang có cảnh báo gì (ngáp, giọng nói nhắc nhở, v.v.),
                # nếu phát hiện nguy hiểm khẩn cấp (Ngủ gật >= 1.5s hoặc Gục đầu nhắm mắt >= 0.7s) -> LẬP TỨC hú còi khẩn cấp!
                if fatigue_manager.is_active_hazard and alert_reason_type != "EMERGENCY":
                    if HAS_PYGAME:
                        if drowsy_voice_sound:
                            drowsy_voice_sound.stop()
                        if alert_sound:
                            alert_sound.stop()
                            alert_sound.play(-1)
                    alert_reason_type = "EMERGENCY"
                    alert_start_time = current_loop_time
                    print("🚨 [NÂNG CẤP KHẨN CẤP] Phát hiện Ngủ gật / Gục đầu -> Ưu tiên còi hú báo động đỏ liên tục!")

                # --- ĐIỀU KIỆN 1: TỰ ĐỘNG TẮT CÒI / GIỌNG NÓI KHI GIẢI TỎA NGUY HIỂM ---
                dismiss_alert = False
                
                # Nếu là cảnh báo ngáp: tài xế đã ngậm miệng lại hoặc còi đã kêu đủ 1.5s
                if alert_reason_type == "YAWN":
                    if (not fatigue_manager.is_yawning) or (alert_elapsed >= Config.YAWN_ALERT_DURATION):
                        dismiss_alert = True
                
                # Nếu là Cảnh Báo Cam (giọng nói nhắc nhở): kết thúc khi đọc xong giọng nói -> RESET TOÀN BỘ ĐIỂM PHẠT VÀ BIẾN ĐẾM VÀNG
                elif alert_reason_type == "ORANGE_VOICE":
                    voice_dur = getattr(Config, 'ORANGE_VOICE_DURATION', getattr(Config, 'DROWSY_VOICE_DURATION', 6.3))
                    if alert_elapsed >= voice_dur or (not fatigue_manager.is_orange_alert and not fatigue_manager.is_active_hazard):
                        dismiss_alert = True
                        # Sau khi kết thúc giọng nói: reset lại toàn bộ điểm phạt và biến đếm vàng về 0
                        fatigue_manager.reset_all_penalties(current_loop_time)
                        print("✅ [CẢNH BÁO CAM] Đã kết thúc giọng nói nhắc nhở -> Reset toàn bộ điểm phạt và biến đếm vàng về 0!")

                # Nếu là giọng nói nhắc nhở sau cảnh báo đỏ (POST_RED_VOICE):
                elif alert_reason_type == "POST_RED_VOICE":
                    if fatigue_manager.is_active_hazard:
                        # Nếu tài xế buồn ngủ lại -> lập tức ngắt giọng nói, hú còi khẩn cấp
                        if HAS_PYGAME and drowsy_voice_sound:
                            drowsy_voice_sound.stop()
                        alert_reason_type = "EMERGENCY"
                        alert_start_time = current_loop_time
                        if HAS_PYGAME and alert_sound:
                            alert_sound.play(-1)
                    else:
                        voice_dur = getattr(Config, 'ORANGE_VOICE_DURATION', getattr(Config, 'DROWSY_VOICE_DURATION', 6.3))
                        if alert_elapsed >= voice_dur:
                            dismiss_alert = True
                            fatigue_manager.reset_all_penalties(current_loop_time)
                            print("✅ [HẬU CẢNH BÁO ĐỎ] Đã kết thúc giọng nói nhắc nhở -> Reset toàn bộ điểm phạt và biến đếm vàng về 0!")

                # Nếu là Cảnh Báo Đỏ khẩn cấp (ngủ gật / gục đầu):
                elif alert_reason_type == "EMERGENCY":
                    # Tài xế đã tỉnh táo (mở mắt, ngẩng đầu) HOẶC còi đã kêu đủ thời gian tối đa (3s)
                    siren_dismiss = (not fatigue_manager.is_active_hazard and not fatigue_manager.is_yawning and status != "Danger") or (alert_elapsed >= Config.ALERT_MAX_DURATION)
                    if siren_dismiss:
                        # 1. Cơ chế TẮT CÒI VẪN GIỮ NGUYÊN: tắt còi ngay lập tức khi mở mắt/ngẩng đầu
                        if HAS_PYGAME and alert_sound:
                            alert_sound.stop()
                        print("✅ Còi hú báo động đỏ đã dừng (Tài xế đã mở mắt / ngẩng đầu).")

                        # 2. Nếu phục hồi sau khi mất mặt, tuyệt đối không phát giọng nói nhắc nhở mà kết thúc ngay
                        if getattr(fatigue_manager, 'red_alert_face_lost', False) or face_was_lost:
                            dismiss_alert = True
                            fatigue_manager.red_alert_face_lost = False
                            fatigue_manager.reset_all_penalties(current_loop_time)
                            print("✅ [PHỤC HỒI NHANH] Trở về trạng thái bình thường ngay lập tức (không phát giọng nói nhắc nhở)!")
                        # Trường hợp bình thường (vừa tỉnh dậy không bị mất mặt): phát giọng nói nhẹ nhàng nhắc nhở
                        elif not fatigue_manager.is_active_hazard and HAS_PYGAME and drowsy_voice_sound:
                            alert_reason_type = "POST_RED_VOICE"
                            alert_start_time = current_loop_time
                            drowsy_voice_sound.play(0)
                            print("📢 [HẬU CẢNH BÁO ĐỎ] Bổ sung giọng nói nhắc nhở nhẹ nhàng: 'Bạn có dấu hiệu mệt mỏi rồi, tỉnh táo lên nhé!'")
                        else:
                            dismiss_alert = True
                            fatigue_manager.reset_all_penalties(current_loop_time)
                            print("✅ [HẬU CẢNH BÁO ĐỎ] Hoàn tất cảnh báo đỏ -> Reset toàn bộ điểm phạt và biến đếm vàng về 0!")
                
                # Trường hợp thông thường nếu không còn ở mức Danger / Orange
                elif not should_alert:
                    dismiss_alert = True

                if dismiss_alert:
                    if HAS_PYGAME:
                        if alert_sound:
                            alert_sound.stop()
                        if drowsy_voice_sound:
                            drowsy_voice_sound.stop()
                    is_alerting = False
                    last_alert_stop_time = current_loop_time
                    print("✅ Cảnh báo âm thanh đã dừng (Tài xế đã mở mắt / ngậm miệng / ngẩng đầu).")

            else:
                # --- ĐIỀU KIỆN 2: BẮT ĐẦU CẢNH BÁO MỚI ---
                # Nguy cấp (ngủ gật >= 1.5s, gục đầu >= 0.7s) hoặc Cam (do 5 cảnh báo vàng): BÁO ĐỘNG NGAY
                is_emergency_event = fatigue_manager.is_active_hazard or (status in ["Danger", "Orange"])
                can_alert = is_emergency_event or (current_loop_time - last_alert_stop_time >= Config.ALERT_COOLDOWN)
                if should_alert and can_alert:
                    is_alerting = True
                    alert_start_time = current_loop_time

                    # 1. CẢNH BÁO CAM (5 cảnh báo vàng) -> Đọc giọng nói nhắc nhở nhẹ nhàng
                    if status == "Orange" or fatigue_manager.is_orange_alert:
                        alert_reason_type = "ORANGE_VOICE"
                        if HAS_PYGAME and drowsy_voice_sound:
                            drowsy_voice_sound.play(0)
                            print("📢 [CẢNH BÁO CAM] Phát giọng nói nhắc nhở: 'Bạn có dấu hiệu mệt mỏi rồi, tỉnh táo lên nhé!'")
                        elif HAS_PYGAME and alert_sound:
                            alert_sound.play(-1) # Fallback nếu không có file mp3

                    # 2. CẢNH BÁO ĐỎ (ngủ gật / gục đầu trực tiếp) -> Còi hú báo động khẩn cấp
                    elif fatigue_manager.is_active_hazard or status == "Danger":
                        alert_reason_type = "EMERGENCY"
                        if HAS_PYGAME and alert_sound:
                            alert_sound.play(-1)

                    elif fatigue_manager.is_yawning:
                        alert_reason_type = "YAWN"
                        # Ngáp thông thường: chỉ phát tiếng ngắn nhắc nhở (1 lần, hoặc tối đa 1.5s)
                        if HAS_PYGAME and alert_sound:
                            alert_sound.play(0)
                    else:
                        alert_reason_type = "GENERAL"
                        if HAS_PYGAME and alert_sound:
                            alert_sound.play(0)

            # === Chụp ảnh bằng chứng KHI KẾT THÚC VI PHẠM (bắt trọn khoảnh khắc vi phạm đỉnh điểm) ===
            completed_violations = fatigue_manager.pop_completed_violations()
            for cv in completed_violations:
                v_level = cv['warning_level']
                v_reason = cv['reason']
                v_cat = cv.get('category', 'eye')

                # Chọn khung hình và ô vuông khuôn mặt đỉnh điểm vi phạm
                target_frame = None
                target_box = None
                if v_cat == 'eye' and best_eye_frame is not None:
                    target_frame = best_eye_frame
                    target_box = best_eye_box or smoothed_face_box
                elif v_cat == 'mouth' and best_mouth_frame is not None:
                    target_frame = best_mouth_frame
                    target_box = best_mouth_box or smoothed_face_box
                elif v_cat == 'head' and best_head_frame is not None:
                    target_frame = best_head_frame
                    target_box = best_head_box or smoothed_face_box
                elif v_cat == 'orange_threshold':
                    target_frame = best_eye_frame or best_mouth_frame or display_frame
                    target_box = best_eye_box or best_mouth_box or smoothed_face_box

                if target_frame is None:
                    target_frame = display_frame
                if target_box is None:
                    target_box = smoothed_face_box

                timestamp_str = time.strftime("%Y%m%d_%H%M%S")
                display_time  = time.strftime("%d/%m/%Y %H:%M:%S")
                box_vn = format_vietnamese_label(v_reason, v_level)
                img_path = _chup_anh_bang_chung(
                    frame         = target_frame,
                    reason_text   = v_reason,
                    warning_level = v_level,
                    timestamp_str = timestamp_str,
                    display_time  = display_time,
                    face_box      = target_box,
                    box_label     = box_vn
                )
                last_evidence_reason = v_reason
                last_evidence_time   = current_loop_time
                print(f"📸 [KẾT THÚC VI PHẠM] ĐÃ CHỤP ẢNH BẰNG CHỨNG [{v_level}] [{v_reason}]: {img_path}")

            # Dự phòng khẩn cấp: Nếu vừa chuyển cấp lên Danger (ngủ gật >= 1.5s chưa kịp mở mắt)
            # chụp ngay 1 ảnh bằng chứng tức thời tại mốc 1.5s
            status_just_escalated_danger = (
                status == "Danger" and
                status != prev_status and
                violation_reason and
                (current_loop_time - last_evidence_time > 2.0)
            )
            if status_just_escalated_danger:
                timestamp_str = time.strftime("%Y%m%d_%H%M%S")
                display_time  = time.strftime("%d/%m/%Y %H:%M:%S")
                target_frame = best_eye_frame if best_eye_frame is not None else display_frame
                target_box = best_eye_box if best_eye_box is not None else smoothed_face_box
                box_vn = format_vietnamese_label(violation_reason, status)
                img_path = _chup_anh_bang_chung(
                    frame         = target_frame,
                    reason_text   = violation_reason,
                    warning_level = status,
                    timestamp_str = timestamp_str,
                    display_time  = display_time,
                    face_box      = target_box,
                    box_label     = box_vn
                )
                last_evidence_reason = violation_reason
                last_evidence_time   = current_loop_time
                print(f"📸 [KHẨN CẤP 1.5S] ĐÃ CHỤP ẢNH BẰNG CHỨNG [{status}] [{violation_reason}]: {img_path}")

            # Đặt lại bộ đệm khung hình đỉnh điểm khi tài xế đã kết thúc hành vi
            if not fatigue_manager.is_eye_closed:
                best_eye_frame = None
                best_eye_box = None
                min_ear_val = 999.0
            if fatigue_manager.yawn_candidate_start == 0:
                best_mouth_frame = None
                best_mouth_box = None
                max_mar_val = -1.0
            if not fatigue_manager.is_head_dropped:
                best_head_frame = None
                best_head_box = None
                max_pitch_val = -999.0

            # Lưu lại trạng thái hiện tại để so sánh frame tiếp theo
            prev_status = status

            # 4. Vẽ khung nhận diện khuôn mặt và bảng thông tin trong suốt lên display_frame
            # Nhãn trạng thái hiển thị trên khung khuôn mặt tiếng Việt có dấu, không có tiền tố ":"
            if best_yolo_label and best_yolo_conf >= yolo_conf_thresh:
                box_label = format_vietnamese_label(best_yolo_label, conf=best_yolo_conf)
            else:
                box_label = format_vietnamese_label(violation_reason or status, status=status)

            # 4.1 Vẽ ô vuông khuôn mặt công nghệ cao trước
            draw_smart_face_box(display_frame, smoothed_face_box, box_label, color=color)

            # 4.2 In các dòng thông số lên màn hình (nền trong suốt hoàn toàn, tối ưu gọn gàng không che mặt tài xế)
            cv2.putText(display_frame, f"Score: {fatigue_manager.score}/100", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)
            cv2.putText(display_frame, f"State: {status}", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)
            
            y_offset = 95
            if violation_reason:
                cv2.putText(display_frame, f"Reason: {violation_reason}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2, cv2.LINE_AA)
                y_offset += 28

            behaviors = fatigue_manager.get_all_behaviors(current_loop_time)

            # Hiển thị bộ đếm tất cả hành vi vi phạm tích lũy
            cnt_str = f"Dem vi pham: Ngu gat: {behaviors['microsleep_count']} | Ngap: {behaviors['light_yawn_count'] + behaviors['deep_yawn_count']} | Chop mat cham: {behaviors['slow_blink_count']} | Guc dau: {behaviors['head_drop_count']} | Vang: {behaviors['yellow_count']}/5"
            cv2.putText(display_frame, cnt_str, (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            y_offset += 24

            # Hiển thị số liệu cảm biến thời gian thực (EAR, MAR, Pitch)
            ear_show = ear[2] if 'ear' in locals() and isinstance(ear, (tuple, list)) else (ear if 'ear' in locals() else 0.0)
            mar_show = mar if 'mar' in locals() else 0.0
            pitch_show = pitch_val if 'pitch_val' in locals() else 0.0
            cv2.putText(display_frame, f"EAR: {ear_show:.2f} | MAR: {mar_show:.2f} | Pitch: {pitch_show:.1f} deg", 
                        (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1, cv2.LINE_AA)
            y_offset += 20

            current_time_str = time.strftime("%d/%m/%Y %H:%M:%S", time.localtime())
            cv2.putText(display_frame, current_time_str, (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)
            
            cv2.imshow("DriveLinker Edge AI", display_frame)

            # tắt hệ thống dứt điểm qua Q/ESC hoặc bấm nút X trên cửa sổ
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == ord('Q') or key == 27 or cv2.getWindowProperty("DriveLinker Edge AI", cv2.WND_PROP_VISIBLE) == 0:
                break

    finally:
        # Bug I-12: Khối finally bảo đảm giải phóng mọi tài nguyên khi thoát
        print("Đang giải phóng tài nguyên...")
        if HAS_PYGAME:
            try:
                if alert_sound: alert_sound.stop()
                if face_missing_sound: face_missing_sound.stop()
                if drowsy_voice_sound: drowsy_voice_sound.stop()
                pygame.mixer.quit()
            except Exception:
                pass
        cap.release()
        cv2.destroyAllWindows()
        print("Đã đóng camera và dọn dẹp hệ thống an toàn.")