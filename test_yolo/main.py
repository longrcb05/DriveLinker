import cv2
import time
import os
import math
import sys
from ultralytics import YOLO
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 1. cấu hình 
class Config:
    EAR_CLOSED = 0.25  # ngưỡng nhắm mắt
    
    # khu vực điều chỉnh thông số
    MAR_LIGHT_YAWN = 0.70  # ngưỡng miệng khi nói chuyện bình thường - ko cộng điểm 
    MAR_DEEP_YAWN = 0.85   # ngưỡng miệng khi ngáp sâu
    
    MICROSLEEP_TIME = 1.5      # giây
    DEEP_YAWN_TIME = 3.0       # giây
    YAWN_COOLDOWN = 120.0      # giây (2 phút)
    
    SCORE_RECOVERY = 3         # điểm trừ mỗi lần chớp mắt khi tỉnh táo
    SCORE_LIGHT_YAWN = 40      # điểm cộng mỗi lần ngáp ngắn

# 2. quản lý trạng thái 
class FatigueManager:
    def __init__(self):
        self.score = 0
        
        # mắt
        self.eye_closed_time = 0
        self.is_eye_closed = False
        self.slow_blink_count = 0
        
        # miệng
        self.yawn_start_time = 0
        self.is_yawning = False
        self.light_yawn_count = 0
        self.last_yawn_time = 0

    def update_eyes(self, ear):
        current_time = time.time()
        
        if ear < Config.EAR_CLOSED:
            if not self.is_eye_closed:
                self.is_eye_closed = True
                self.eye_closed_time = current_time
            else:
                # bắt sự kiện ngủ gật
                if (current_time - self.eye_closed_time) > Config.MICROSLEEP_TIME:
                    self.score = 100
        else:
            if self.is_eye_closed:
                # kết thúc 1 chu kỳ chớp mắt
                blink_duration = current_time - self.eye_closed_time
                self.is_eye_closed = False
                self._evaluate_blink_speed(blink_duration)

    def _evaluate_blink_speed(self, duration):
        # lọc nhiễu (<0.1s) và phân loại tốc độ chớp mắt
        if 0.1 <= duration <= 0.4:
            self.score = max(0, self.score - Config.SCORE_RECOVERY)
            self.slow_blink_count = 0
        elif 0.5 <= duration <= 1.0:
            self.score = max(self.score, 60)
            self.slow_blink_count += 1

    def update_mouth(self, mar):
        current_time = time.time()
        
        # reset chuỗi ngáp ngắn nếu đã qua thời gian cooldown
        if self.last_yawn_time and (current_time - self.last_yawn_time > Config.YAWN_COOLDOWN):
            self.light_yawn_count = 0
            self.last_yawn_time = 0

        if mar > Config.MAR_DEEP_YAWN:
            if not self.is_yawning:
                self.is_yawning = True
                self.yawn_start_time = current_time
            elif (current_time - self.yawn_start_time) > Config.DEEP_YAWN_TIME:
                self.score = 100
                
        elif mar > Config.MAR_LIGHT_YAWN:
            if not self.is_yawning:
                self.is_yawning = True
                self.yawn_start_time = current_time
                self.score = min(100, self.score + Config.SCORE_LIGHT_YAWN)
                self.light_yawn_count += 1
                self.last_yawn_time = current_time
                
                if self.light_yawn_count >= 3:
                    self.score = 100
                    self.light_yawn_count = 0
        else:
            self.is_yawning = False

    def get_status(self):
        # chốt điểm số và tính trạng thái 
        self.score = max(0, min(100, self.score))
        
        if self.score <= 30:
            return "Normal", (0, 255, 0), False
        elif self.score <= 60:
            return "Tired", (0, 255, 255), False
        elif self.score <= 80:
            return "Warning", (0, 165, 255), False
        else:
            return "Danger", (0, 0, 255), True

    def reset(self):
        # reset toàn bộ điểm số và trạng thái về 0 sau khi kêu còi 10s
        self.score = 0
        
        self.eye_closed_time = 0
        self.is_eye_closed = False
        self.slow_blink_count = 0
        
        self.yawn_start_time = 0
        self.is_yawning = False
        self.light_yawn_count = 0
        self.last_yawn_time = 0

# các hàm tiện ích 
def distance(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y)

def calculate_ear(landmarks):
    left_h = distance(landmarks[33], landmarks[133])
    left_v = (distance(landmarks[159], landmarks[145]) + distance(landmarks[158], landmarks[153])) / 2.0
    right_h = distance(landmarks[362], landmarks[263])
    right_v = (distance(landmarks[386], landmarks[374]) + distance(landmarks[385], landmarks[380])) / 2.0
    
    ear_left = left_v / left_h if left_h > 0 else 0
    ear_right = right_v / right_h if right_h > 0 else 0
    return (ear_left + ear_right) / 2.0

def calculate_mar(landmarks):
    mouth_h = distance(landmarks[78], landmarks[308])
    mouth_v = distance(landmarks[13], landmarks[14])
    return mouth_v / mouth_h if mouth_h > 0 else 0

# 3. main
if __name__ == "__main__":
    # khởi tạo âm thanh
    try:
        import pygame
        pygame.mixer.init()
        alert_sound = pygame.mixer.Sound('am_thanh_canh_bao.wav')
        HAS_PYGAME = True
    except (ImportError, FileNotFoundError):
        print("Cảnh báo: Không tìm thấy pygame hoặc file âm thanh.")
        HAS_PYGAME = False
        alert_sound = None

    # khởi tạo mô hình AI
    model = YOLO('runs/detect/train/weights/best.pt')
    
    base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    face_landmarker = vision.FaceLandmarker.create_from_options(options)
    
    # khởi tạo bộ quản lý logic
    fatigue_manager = FatigueManager()
    is_alerting = False
    alert_start_time = 0

    cap = cv2.VideoCapture(0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        # 1. pipeline yolo
        results = model(frame, verbose=False)
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                label = model.names[int(box.cls[0])]
                # vẽ khung nhận diện lên màn hình
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

        # 2. pipeline mediaPipe và xử lý logic
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        results_mp = face_landmarker.detect(mp_image)
        
        if results_mp.face_landmarks:
            landmarks = results_mp.face_landmarks[0]
            ear = calculate_ear(landmarks)
            mar = calculate_mar(landmarks)
            
            # cập nhật state machine nếu không trong lúc kêu còi
            if not is_alerting:
                fatigue_manager.update_eyes(ear)
                fatigue_manager.update_mouth(mar)

        # 3. lấy kết quả và render UI
        status, color, should_alert = fatigue_manager.get_status()
        current_loop_time = time.time()

        # logic báo động 10 giây và reset
        if should_alert:
            if not is_alerting:
                if HAS_PYGAME and alert_sound: alert_sound.play(-1)
                is_alerting = True
                alert_start_time = current_loop_time
            else:
                if current_loop_time - alert_start_time >= 10.0:
                    if HAS_PYGAME and alert_sound: alert_sound.stop()
                    
                    is_alerting = False
                    fatigue_manager.reset()
                    
                    status = "Normal"
                    color = (0, 255, 0)
        else:
            if is_alerting:
                if HAS_PYGAME and alert_sound: alert_sound.stop()
                is_alerting = False

        # vẽ thông số điểm và trạng thái
        cv2.putText(frame, f"Score: {fatigue_manager.score}/100", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        cv2.putText(frame, f"State: {status}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        # vẽ đồng hồ thời gian thực
        current_time_str = time.strftime("%d/%m/%Y %H:%M:%S", time.localtime())
        cv2.putText(frame, current_time_str, (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        cv2.imshow("DriveLinker Edge AI", frame)

        # tắt hệ thống dứt điểm 
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27 or cv2.getWindowProperty("DriveLinker Edge AI", cv2.WND_PROP_VISIBLE) < 1:
            cap.release()
            cv2.destroyAllWindows()
            os._exit(0)