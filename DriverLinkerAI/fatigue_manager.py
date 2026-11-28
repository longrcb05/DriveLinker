# fatigue_manager.py (bộ não xử lý)
#    - Chức năng: Quản lý bộ nhớ trạng thái và tính toán điểm số buồn ngủ (0-100).
#    - Ý nghĩa: Đóng vai trò là "Bộ não". File này nhận số liệu từ `utils.py`, đối 
#      chiếu với luật lệ ở `config.py` để theo dõi hành vi theo thời gian (ví dụ: đếm
#      số lần ngáp, đo thời gian nhắm mắt liên tục). Từ đó chốt điểm số và xuất ra 
#      trạng thái cuối cùng (Normal, Tired, Warning, Danger).

import time
from config import Config
from canhbao import WarningLogger


# 2. quản lý trạng thái 
class FatigueManager:
    def __init__(self, warning_logger=None):
        self.score = 0
        self.violation_reason = "" # biến lưu trữ lý do vi phạm
        
        # mắt
        self.eye_closed_time = 0 # lưu lại thời gian tài xế nhắm mắt 
        self.is_eye_closed = False # đánh dấu trạng thái mắt: True là cả 2 mắt đang nhắm
        self.slow_blink_count = 0 # đếm số lần chớp mắt chậm liên tiếp 
        self.is_sleeping = False # cờ đánh dấu đang ngủ gật (nhắm mắt >= 1.5s)
        self.sleep_warning_logged = False # cờ ghi log cho sự kiện ngủ gật
        
        # miệng
        self.yawn_start_time = 0 # lưu lại thời gian khi tài xế há miệng to
        self.yawn_candidate_start = 0 # mốc thời gian bắt đầu vượt ngưỡng để lọc nhiễu
        self.is_yawning = False # đánh dấu đang trong một đợt ngáp hợp lệ (đã đủ 1.5s ngáp nhẹ hoặc 3s ngáp sâu)
        self.is_deep_yawn = False # cờ đánh dấu ngáp sâu (MAR >= 0.85 và thời gian >= 3.0s -> CẢNH BÁO CAM)
        self.yawn_max_mar = 0.0 # lưu MAR lớn nhất ghi nhận được trong đợt ngáp hiện tại
        self.yawn_alert_triggered = False # cờ chống lặp cảnh báo ngáp bất tận
        self.yawn_warning_logged = False # cờ đảm bảo chỉ ghi 1 lần cảnh báo vàng cho mỗi đợt ngáp nhẹ
        self.deep_yawn_warning_logged = False # cờ đảm bảo chỉ ghi 1 lần cảnh báo cam cho mỗi đợt ngáp sâu
        self.confirmed_yawns = [] # danh sách timestamps các lần ngáp đã xác nhận trong 120s
        self.last_yawn_time = 0 # lưu lại mốc thời gian ngáp cuối cùng 
        self.red_alert_face_lost = False # cờ đánh dấu mất khuôn mặt ngay sau/trong khi bị cảnh báo đỏ

        # Lý do vi phạm độc lập cho từng hành vi (tránh ghi đè lẫn nhau)
        self.eye_reason = ""
        self.mouth_reason = ""
        self.head_reason = ""
        self.orange_reason = ""

        # Bộ đếm tổng số lần các hành vi vi phạm tích lũy trong phiên lái xe
        self.microsleep_count = 0     # Số lần ngủ gật (>= 1.5s)
        self.light_yawn_count = 0     # Số lần ngáp nhẹ (>= 1.5s)
        self.deep_yawn_count = 0      # Số lần ngáp sâu (>= 3.0s)
        self.head_drop_count = 0      # Số lần gục đầu nhắm mắt (>= 0.7s)

        # đầu
        self.head_drop_start_time = 0
        self.head_open_start_time = None
        self.head_closed_start_time = None
        self.is_head_dropped = False
        self.is_head_open_eyes = False
        self.is_head_closed_eyes = False
        self.is_active_head_drop = False
        self.head_drop_warning_logged = False # cờ ghi log cho sự kiện gục đầu nhắm mắt

        # Quản lý file cảnh báo
        if warning_logger is not None:
            self.warning_logger = warning_logger
        else:
            self.warning_logger = WarningLogger(
                log_file=Config.WARNING_LOG_FILE,
                text_log_file=Config.WARNING_TEXT_LOG_FILE
            )

        self.is_orange_alert = False # cờ đánh dấu trạng thái Cảnh Báo Cam do tích lũy 5 cảnh báo vàng
        self.orange_alert_start_time = 0.0 # mốc thời gian kích hoạt Cảnh Báo Cam (5 vàng -> cam 80đ)
        self.slow_blink_until = 0.0 # mốc thời gian giữ hiển thị cảnh báo vàng chớp mắt chậm
        self.completed_violations = [] # Danh sách các vi phạm vừa kết thúc trong frame hiện tại

        # cơ chế giảm điểm (decay) thời gian thực
        now = time.time()
        self.last_safe_time = now
        self.last_decay_time = now

    def pop_completed_violations(self):
        """Lấy và xóa danh sách các vi phạm vừa kết thúc."""
        violations = list(self.completed_violations)
        self.completed_violations.clear()
        return violations

    @property
    def is_yellow_red_alert(self):
        """Thuộc tính tương thích ngược cho cờ cảnh báo tích lũy vàng."""
        return self.is_orange_alert

    @is_yellow_red_alert.setter
    def is_yellow_red_alert(self, value):
        self.is_orange_alert = value

    @property
    def yellow_red_alert_start_time(self):
        return self.orange_alert_start_time

    @yellow_red_alert_start_time.setter
    def yellow_red_alert_start_time(self, value):
        self.orange_alert_start_time = value

    @property
    def is_active_hazard(self):
        """Trả về True nếu ngay tại thời điểm này tài xế đang ngủ gật hoặc đang gục đầu nhắm mắt."""
        return self.is_sleeping or self.is_active_head_drop

    def _check_and_trigger_yellow_to_orange(self, current_time):
        """
        QUY TẮC:
        1. 5 cảnh báo vàng trong 10p tương đương CẢNH BÁO CAM (80/100 điểm) và phát giọng nói.
        2. Sau khi đạt 5 mức cảnh báo vàng thì sẽ reset biến đếm đó về 0.
        """
        threshold = getattr(Config, 'YELLOW_TO_ORANGE_COUNT', getattr(Config, 'YELLOW_TO_RED_COUNT', 5))
        count = self.warning_logger.count_yellow_warnings_in_window(
            window_seconds=Config.YELLOW_WARNING_WINDOW,
            current_time=current_time
        )
        if count >= threshold:
            self.is_orange_alert = True
            self.orange_alert_start_time = current_time
            self.score = getattr(Config, 'SCORE_ORANGE', 80)
            self.orange_reason = f"CANH BAO CAM (DAT {count} LAN VANG/10P)"
            self.violation_reason = self.orange_reason

            # Ghi nhận cảnh báo cam vào file cảnh báo
            self.warning_logger.log_warning(
                warning_type="ORANGE",
                score=self.score,
                reason=self.violation_reason,
                timestamp=current_time
            )
            print(f"🟠 [CẢNH BÁO CAM] Đã đạt {count} mức cảnh báo vàng! Điểm: {self.score}/100. Phát giọng nói nhắc nhở buồn ngủ.")

            self.completed_violations.append({
                'warning_level': 'Orange',
                'reason': self.orange_reason,
                'category': 'orange_threshold',
                'duration': 0.0,
                'timestamp': current_time
            })

            # Sau khi đạt 5 cảnh báo vàng: RESET BIẾN ĐẾM ĐÓ VỀ 0
            self.warning_logger.reset_yellow_counter(current_time)

    # Alias giữ tương thích ngược
    _check_and_trigger_yellow_to_red = _check_and_trigger_yellow_to_orange

    @property
    def is_driver_alert(self):
        """
        Trả về True nếu tài xế đang hoàn toàn tỉnh táo:
        - Mắt mở bình thường (không nhắm, không ngủ gật)
        - Miệng bình thường (không ngáp, không đang há miệng ngáp)
        - Đầu ở tư thế bình thường (không cúi, không gục đầu)
        - Không đang trong đợt cảnh báo cam do tích lũy 5 cảnh báo vàng
        """
        return (
            not self.is_eye_closed and
            not self.is_sleeping and
            not self.is_yawning and
            self.yawn_candidate_start == 0 and
            not self.is_head_dropped and
            not self.is_active_head_drop and
            not self.is_orange_alert
        )

    def _reset_score_if_alert(self, current_time=None):
        """QUY TẮC: Mỗi lần tỉnh táo thì sẽ lập tức trở về 0đ."""
        if self.is_driver_alert:
            self.score = 0
            if self.red_alert_face_lost:
                self.red_alert_face_lost = False
                self.violation_reason = ""
                self.eye_reason = ""
                self.mouth_reason = ""
                self.head_reason = ""
                self.reset_all_penalties(current_time)

    def _update_aggregated_reason_and_score(self, current_time=None):
        """Tổng hợp các lý do vi phạm độc lập từ Mắt, Miệng, Đầu và tính toán điểm phạt cao nhất."""
        if current_time is None:
            current_time = time.time()

        # 1. Nhóm lý do Nguy hiểm khẩn cấp (Cảnh báo Đỏ)
        danger_reasons = []
        if self.is_sleeping or (self.eye_reason and "NGU GAT" in self.eye_reason):
            danger_reasons.append(self.eye_reason)
        if self.is_active_head_drop or (self.head_reason and "GUC DAU" in self.head_reason):
            danger_reasons.append(self.head_reason)

        # 2. Nhóm Cảnh báo Cam (Ngáp sâu hoặc 5 cảnh báo vàng)
        orange_reasons = []
        if self.is_orange_alert and getattr(self, 'orange_reason', ''):
            orange_reasons.append(self.orange_reason)
        if self.is_deep_yawn or (self.mouth_reason and "NGAP SAU" in self.mouth_reason):
            orange_reasons.append(self.mouth_reason)

        # 3. Nhóm Cảnh báo Vàng (Ngáp nhẹ / Chớp mắt chậm)
        warning_reasons = []
        if self.mouth_reason and ("NGAP NHE" in self.mouth_reason or self.is_yawning) and self.mouth_reason not in orange_reasons:
            warning_reasons.append(self.mouth_reason)
        if self.eye_reason and "CHOP MAT CHAM" in self.eye_reason:
            warning_reasons.append(self.eye_reason)

        # 4. Nhóm tiến trình đang diễn ra (Đang nhắm mắt, Đang ngáp, Đang cúi đầu)
        tracking_reasons = []
        if self.eye_reason and self.eye_reason not in danger_reasons and self.eye_reason not in warning_reasons:
            tracking_reasons.append(self.eye_reason)
        if self.mouth_reason and self.mouth_reason not in orange_reasons and self.mouth_reason not in warning_reasons:
            tracking_reasons.append(self.mouth_reason)
        if self.head_reason and self.head_reason not in danger_reasons:
            tracking_reasons.append(self.head_reason)

        # Nối danh sách theo đúng thứ tự ưu tiên
        combined = danger_reasons + orange_reasons + warning_reasons + tracking_reasons
        seen = set()
        ordered_reasons = []
        for r in combined:
            if r and r not in seen:
                seen.add(r)
                ordered_reasons.append(r)

        if ordered_reasons:
            self.violation_reason = " | ".join(ordered_reasons)
        else:
            if not self.red_alert_face_lost:
                self.violation_reason = ""

        # Cập nhật điểm phạt cao nhất theo tình huống thực tế
        if self.is_active_hazard or bool(danger_reasons):
            self.score = 100
        elif self.is_orange_alert or bool(orange_reasons):
            self.score = max(self.score, 80)
        elif bool(warning_reasons):
            self.score = max(self.score, 60)
        elif self.is_driver_alert and current_time >= self.slow_blink_until:
            self.score = 0

    def get_all_behaviors(self, current_time=None):
        """Trả về toàn bộ thông tin chi tiết và số lần đếm của tất cả hành vi."""
        if current_time is None:
            current_time = time.time()
        
        yellow_cnt = 0
        if self.warning_logger:
            yellow_cnt = self.warning_logger.count_yellow_warnings_in_window(current_time=current_time)

        return {
            "eye_reason": self.eye_reason,
            "mouth_reason": self.mouth_reason,
            "head_reason": self.head_reason,
            "is_eye_closed": self.is_eye_closed,
            "is_sleeping": self.is_sleeping,
            "is_yawning": self.is_yawning,
            "is_deep_yawn": self.is_deep_yawn,
            "is_head_dropped": self.is_head_dropped,
            "is_active_head_drop": self.is_active_head_drop,
            "microsleep_count": self.microsleep_count,
            "slow_blink_count": self.slow_blink_count,
            "light_yawn_count": self.light_yawn_count,
            "deep_yawn_count": self.deep_yawn_count,
            "head_drop_count": self.head_drop_count,
            "yellow_count": yellow_cnt,
        }

    def update_eyes(self, ear_data, current_time=None):
        """
        Nhận ear_data: tuple (ear_left, ear_right, ear_avg) hoặc float đơn lẻ.
        Hiển thị thời gian nhắm mắt từng 0.1s (VD: NHAM MAT (0.5s), NHAM MAT (1.2s)...).
        Đúng 1.5s kích hoạt ngay NGU GAT (1.5s) và hú còi.
        Khi mở mắt tỉnh táo: lập tức trở về 0đ.
        """
        if current_time is None:
            current_time = time.time()
        
        if isinstance(ear_data, (tuple, list)):
            ear_left, ear_right, ear_avg = ear_data[0], ear_data[1], ear_data[2]
        else:
            ear_left = ear_right = ear_avg = ear_data

        # QUY TẮC: CẢ HAI MẮT ĐỀU PHẢI NHẮM (< EAR_CLOSED)
        both_eyes_closed = (ear_left < Config.EAR_CLOSED) and (ear_right < Config.EAR_CLOSED)
        
        # trường hợp 1: cả hai mắt đang nhắm
        if both_eyes_closed:
            if not self.is_eye_closed:
                self.is_eye_closed = True
                self.eye_closed_time = current_time
                self.eye_reason = "NHAM MAT (0.0s)"
            else:
                duration = current_time - self.eye_closed_time
                # Hiển thị số giây nhắm mắt chạy liên tục theo thời gian thực
                if duration < Config.MICROSLEEP_TIME:
                    self.eye_reason = f"NHAM MAT ({duration:.1f}s)"
                else:
                    # Đúng 1.5s là kích hoạt báo động ngủ gật ngay lập tức
                    self.is_sleeping = True
                    self.score = 100
                    self.eye_reason = f"NGU GAT ({duration:.1f}s)"

                    if not self.sleep_warning_logged:
                        self.sleep_warning_logged = True
                        self.microsleep_count += 1
                        self.warning_logger.log_warning(
                            warning_type="RED",
                            score=100,
                            reason=self.eye_reason,
                            timestamp=current_time
                        )
                        print(f"🚨 [CẢNH BÁO ĐỎ] Phát hiện NGỦ GẬT ({duration:.1f}s)! Điểm: 100 (Lần {self.microsleep_count})")
                    
        # trường hợp 2: có ít nhất một bên mắt mở (hoặc cả 2 mắt mở bình thường)
        else:
            if self.is_eye_closed:
                blink_duration = current_time - self.eye_closed_time
                was_sleeping = self.is_sleeping
                was_active_head_drop = self.is_active_head_drop
                self.is_eye_closed = False
                self.eye_closed_time = 0
                self.sleep_warning_logged = False
                
                # NẾU VỪA MỞ MẮT SAU KHI BỊ BÁO ĐỘNG NGỦ GẬT HOẶC GỤC ĐẦU NHẮM MẮT:
                if was_sleeping or was_active_head_drop:
                    self.is_sleeping = False
                    self.is_active_head_drop = False
                    self.is_yellow_red_alert = False
                    self.eye_reason = "DA MO MAT"
                    if was_sleeping:
                        self.completed_violations.append({
                            'warning_level': 'Danger',
                            'reason': f"NGU GAT ({blink_duration:.1f}s)",
                            'category': 'eye',
                            'duration': blink_duration,
                            'timestamp': current_time
                        })
                    if was_active_head_drop:
                        self.completed_violations.append({
                            'warning_level': 'Danger',
                            'reason': f"GUC DAU NHAM MAT ({blink_duration:.1f}s)",
                            'category': 'head',
                            'duration': blink_duration,
                            'timestamp': current_time
                        })
                    # Mở mắt tỉnh táo -> lập tức trở về 0đ
                    if not self.is_yawning:
                        self.score = 0
                    self._reset_score_if_alert(current_time)
                else:
                    self._evaluate_blink_speed(blink_duration, current_time)
            else:
                # Cả hai mắt đang mở bình thường
                if current_time >= self.slow_blink_until:
                    if self.eye_reason.startswith("CHOP MAT CHAM") or self.eye_reason == "DA MO MAT":
                        self.eye_reason = ""
                    self._reset_score_if_alert(current_time)

        self._update_aggregated_reason_and_score(current_time)

    def _evaluate_blink_speed(self, duration, current_time=None):
        if current_time is None:
            current_time = time.time()

        # Chớp mắt bình thường: tài xế tỉnh táo -> lập tức trở về 0đ!
        if Config.NORMAL_BLINK_MIN_TIME <= duration <= Config.NORMAL_BLINK_MAX_TIME:
            self.slow_blink_until = 0.0
            self.eye_reason = ""
            self._reset_score_if_alert(current_time)
        elif Config.SLOW_BLINK_TIME <= duration < Config.MICROSLEEP_TIME:
            # QUY TẮC: Chớp mắt chậm tính là 60 điểm, tương đương Cảnh Báo Vàng!
            blink_score = getattr(Config, 'SCORE_SLOW_BLINK', 60)
            self.score = max(self.score, blink_score)
            self.slow_blink_count += 1
            self.slow_blink_until = current_time + 2.0 # Giữ trạng thái cảnh báo vàng trong 2 giây nếu không có vi phạm mới
            self.eye_reason = f"CHOP MAT CHAM ({duration:.2f}s)"

            # Ghi nhận cảnh báo vàng vào file cảnh báo
            self.warning_logger.log_warning(
                warning_type="YELLOW",
                score=self.score,
                reason=self.eye_reason,
                timestamp=current_time
            )
            print(f"⚠️ [Cảnh Báo Vàng] Đã ghi nhận CHỚP MẮT CHẬM ({duration:.2f}s) vào file cảnh báo. Điểm: {self.score}")

            self.completed_violations.append({
                'warning_level': 'Warning',
                'reason': self.eye_reason,
                'category': 'eye',
                'duration': duration,
                'timestamp': current_time
            })

            # Kiểm tra: nếu đạt đủ 5 cảnh báo vàng -> kích hoạt Cảnh Báo Cam (80/100) và reset biến đếm
            self._check_and_trigger_yellow_to_orange(current_time)

    def update_mouth(self, mar, current_time=None):
        """
        Cơ chế ngáp 2 mức: NGÁP NHẸ và NGÁP SÂU.
        1. Ngáp nhẹ: MAR >= 0.70 kéo dài liên tục >= 1.5s -> Cảnh báo Vàng (60đ), ghi nhận 'NGAP NHE (x.xs)'.
        2. Ngáp sâu: MAR >= 0.85 kéo dài liên tục >= 3.0s -> Cảnh báo Vàng (60đ), ghi nhận 'NGAP SAU (x.xs)'.
        3. Dưới 1.5s: hiển thị DANG NGAP ({elapsed:.1f}s), chưa bị tính điểm phạt.
        4. Mỗi lần ngậm miệng tỉnh táo (MAR < 0.70): lập tức trở về 0đ.
        5. Ghi nhận sự kiện cảnh báo vàng vào file cảnh báo để theo dõi giới hạn 10 phút.
        """
        if current_time is None:
            current_time = time.time()
        
        self.confirmed_yawns = [t for t in self.confirmed_yawns if (current_time - t) <= Config.YAWN_COUNT_WINDOW]

        # Đồng bộ các ngưỡng từ Config
        mar_light = getattr(Config, 'MAR_LIGHT_YAWN', 0.70)
        mar_deep = getattr(Config, 'MAR_DEEP_YAWN', 0.85)
        time_light = getattr(Config, 'LIGHT_YAWN_MIN_TIME', getattr(Config, 'YAWN_CONFIRM_TIME', 1.50))
        time_deep = getattr(Config, 'DEEP_YAWN_TIME', 3.00)
        score_light = getattr(Config, 'SCORE_LIGHT_YAWN', getattr(Config, 'SCORE_YAWN', 60))
        score_deep = getattr(Config, 'SCORE_DEEP_YAWN', getattr(Config, 'SCORE_YAWN', 60))

        # Kiểm tra miệng mở từ mức ngáp nhẹ trở lên (MAR >= 0.70)
        if mar >= mar_light:
            if self.yawn_candidate_start == 0:
                self.yawn_candidate_start = current_time
                self.yawn_max_mar = mar
            else:
                self.yawn_max_mar = max(self.yawn_max_mar, mar)

            elapsed = current_time - self.yawn_candidate_start
            
            if elapsed < time_light:
                # Há miệng dưới 1.5 giây: hiển thị tiến trình, CHƯA BỊ TÍNH ĐIỂM
                self.mouth_reason = f"DANG NGAP ({elapsed:.1f}s)"
            else:
                # Đã đạt từ 1.5s trở lên: XÁC NHẬN NGÁP
                self.is_yawning = True

                # Kiểm tra điều kiện NGÁP SÂU (thời gian >= 3.0s VÀ (MAR >= 0.85 hoặc đã từng đạt >= 0.85 trong đợt ngáp))
                is_deep = (elapsed >= time_deep and (mar >= mar_deep or self.yawn_max_mar >= mar_deep)) or self.is_deep_yawn

                if is_deep:
                    self.is_deep_yawn = True
                    self.is_orange_alert = True
                    if self.orange_alert_start_time == 0.0:
                        self.orange_alert_start_time = current_time
                    self.score = max(self.score, score_deep)
                    self.mouth_reason = f"NGAP SAU ({elapsed:.1f}s)"

                    # Ghi nhận cảnh báo cam vào file cảnh báo (chỉ ghi 1 lần cho đợt ngáp sâu này)
                    if not self.deep_yawn_warning_logged:
                        self.deep_yawn_warning_logged = True
                        self.yawn_warning_logged = True  # Đã nâng lên cam thì khóa cờ vàng
                        self.deep_yawn_count += 1
                        self.confirmed_yawns.append(current_time)
                        self.warning_logger.log_warning(
                            warning_type="ORANGE",
                            score=self.score,
                            reason=self.mouth_reason,
                            timestamp=current_time
                        )
                        print(f"🟠 [CẢNH BÁO CAM] Phát hiện NGÁP SÂU >= {mar_deep} trên {time_deep}s! Điểm: {self.score}/100. (Lần {self.deep_yawn_count})")
                else:
                    self.score = max(self.score, score_light)
                    self.mouth_reason = f"NGAP NHE ({elapsed:.1f}s)"

                    # Ghi nhận cảnh báo vàng vào file cảnh báo (chỉ ghi 1 lần cho đợt ngáp nhẹ này)
                    if not self.yawn_warning_logged:
                        self.yawn_warning_logged = True
                        self.light_yawn_count += 1
                        self.confirmed_yawns.append(current_time)
                        self.warning_logger.log_warning(
                            warning_type="YELLOW",
                            score=self.score,
                            reason=self.mouth_reason,
                            timestamp=current_time
                        )
                        print(f"⚠️ [Cảnh Báo Vàng] Đã ghi nhận NGÁP NHẸ vào file cảnh báo. Điểm: {self.score} (Lần {self.light_yawn_count})")

                        # Kiểm tra: nếu đạt đủ 5 cảnh báo vàng -> kích hoạt Cảnh Báo Cam (80/100) và reset biến đếm
                        self._check_and_trigger_yellow_to_orange(current_time)

        # Tài xế đã ngậm miệng lại (MAR < 0.70)
        else:
            was_yawning_event = self.is_yawning or (self.yawn_candidate_start > 0)
            if self.yawn_candidate_start > 0:
                yawn_duration = current_time - self.yawn_candidate_start
                if self.is_deep_yawn or (self.yawn_max_mar >= mar_deep and yawn_duration >= time_deep):
                    self.completed_violations.append({
                        'warning_level': 'Orange',
                        'reason': f"NGAP SAU ({yawn_duration:.1f}s)",
                        'category': 'mouth',
                        'duration': yawn_duration,
                        'timestamp': current_time
                    })
                elif self.is_yawning or (yawn_duration >= time_light):
                    self.completed_violations.append({
                        'warning_level': 'Warning',
                        'reason': f"NGAP NHE ({yawn_duration:.1f}s)",
                        'category': 'mouth',
                        'duration': yawn_duration,
                        'timestamp': current_time
                    })

            self.is_yawning = False
            self.is_deep_yawn = False
            self.yawn_candidate_start = 0
            self.yawn_max_mar = 0.0
            self.yawn_warning_logged = False
            self.deep_yawn_warning_logged = False
            if not self.is_orange_alert:
                self.is_yellow_red_alert = False

            self.mouth_reason = ""
            if was_yawning_event:
                # Nếu không đang trong đợt Cảnh Báo Cam thì giải tỏa về 0đ (nếu đang Cam thì đợi đọc xong giọng nói)
                if not self.is_orange_alert:
                    self._reset_score_if_alert(current_time)

        self._update_aggregated_reason_and_score(current_time)

    def update_head(self, pitch_angle, current_time=None):
        if current_time is None:
            current_time = time.time()

        if pitch_angle > Config.HEAD_DROP_ANGLE:
            if not self.is_head_dropped:
                self.is_head_dropped = True
                self.head_drop_start_time = current_time

            if self.is_eye_closed:
                self.update_head_closed_eyes(current_time)
            else:
                self.update_head_open_eyes(current_time)
        else:
            was_head_dropped = (
                self.is_head_dropped or self.is_active_head_drop
            )
            head_start = self.head_drop_start_time
            had_logged_warning = self.head_drop_warning_logged

            self.head_drop_start_time = 0
            self.head_open_start_time = None
            self.head_closed_start_time = None

            self.is_head_dropped = False
            self.is_head_open_eyes = False
            self.is_head_closed_eyes = False
            self.is_active_head_drop = False
            self.head_reason = ""

            if was_head_dropped:
                if had_logged_warning and head_start > 0:
                    drop_duration = current_time - head_start
                    self.completed_violations.append({
                        'warning_level': 'Danger',
                        'reason': f"GUC DAU NHAM MAT ({drop_duration:.1f}s)",
                        'category': 'head',
                        'duration': drop_duration,
                        'timestamp': current_time
                    })
                # Ngẩng đầu tỉnh táo: lập tức trở về 0đ
                self.head_drop_warning_logged = False
                if not self.is_sleeping and not self.is_yawning and not self.is_yellow_red_alert and current_time >= self.slow_blink_until:
                    self.score = 0
                self._reset_score_if_alert(current_time)

        self._update_aggregated_reason_and_score(current_time)

    def update_head_open_eyes(self, current_time=None):
        if current_time is None:
            current_time = time.time()

        if self.head_open_start_time is None:
            self.head_open_start_time = current_time

        self.head_closed_start_time = None

        self.is_head_open_eyes = True
        self.is_head_closed_eyes = False
        self.is_active_head_drop = False
        self.head_drop_warning_logged = False

        elapsed = current_time - self.head_open_start_time
        self.head_reason = f"CUI DAU - MAT MO ({elapsed:.1f}s)"

        if not self.is_sleeping and not self.is_yawning and not self.is_yellow_red_alert and current_time >= self.slow_blink_until:
            self.score = min(self.score, 30)

    def update_head_closed_eyes(self, current_time=None):
        if current_time is None:
            current_time = time.time()

        if self.head_closed_start_time is None:
            self.head_closed_start_time = current_time

        self.head_open_start_time = None

        self.is_head_open_eyes = False
        self.is_head_closed_eyes = True

        elapsed = current_time - self.head_closed_start_time

        # QUY TẮC: Gục đầu nhắm mắt cùng lúc thì cảnh báo đỏ (score = 100, status = Danger, hú còi)
        if elapsed >= Config.HEAD_EYES_CLOSED_TIME:
            self.is_active_head_drop = True
            self.score = 100
            self.head_reason = f"GUC DAU (NHAM MAT) ({elapsed:.1f}s)"

            if not self.head_drop_warning_logged:
                self.head_drop_warning_logged = True
                self.head_drop_count += 1
                self.warning_logger.log_warning(
                    warning_type="RED",
                    score=100,          
                    reason=self.head_reason,
                    timestamp=current_time
                )
                print(f"🚨 [CẢNH BÁO ĐỎ] Phát hiện GỤC ĐẦU NHẮM MẮT CÙNG LÚC ({elapsed:.1f}s)! Điểm: 100 (Lần {self.head_drop_count})")
        else:
            self.is_active_head_drop = False
            self.head_reason = f"CUI DAU - NHAM MAT ({elapsed:.1f}s)"

    def on_face_lost(self, current_time=None):
        """Xử lý khi mất dấu khuôn mặt: ngắt ngay các bộ đếm nhắm mắt/ngáp/gục đầu."""
        if self.red_alert_face_lost or self.is_active_hazard or (self.score >= 100) or self.is_sleeping or self.is_active_head_drop:
            self.red_alert_face_lost = True

        self.eye_closed_time = 0
        self.is_eye_closed = False
        self.is_sleeping = False
        self.sleep_warning_logged = False
        self.head_drop_warning_logged = False
        self.yawn_candidate_start = 0
        self.yawn_max_mar = 0.0
        self.is_yawning = False
        self.is_deep_yawn = False
        self.yawn_warning_logged = False
        self.deep_yawn_warning_logged = False
        self.is_yellow_red_alert = False
        self.yellow_red_alert_start_time = 0.0
        self.slow_blink_until = 0.0

        self.head_drop_start_time = 0
        self.head_open_start_time = None
        self.head_closed_start_time = None

        self.is_head_dropped = False
        self.is_head_open_eyes = False
        self.is_head_closed_eyes = False
        self.is_active_head_drop = False

        self.eye_reason = ""
        self.mouth_reason = ""
        self.head_reason = ""
        if not self.red_alert_face_lost:
            self.violation_reason = ""

    def apply_decay(self, current_time=None):
        """Mỗi lần tỉnh táo thì sẽ lập tức trở về 0đ."""
        if current_time is None:
            current_time = time.time()

        if self.is_driver_alert and current_time >= self.slow_blink_until:
            self.score = 0
            if self.red_alert_face_lost:
                self.red_alert_face_lost = False
                self.violation_reason = ""
                self.eye_reason = ""
                self.mouth_reason = ""
                self.head_reason = ""
                self.reset_all_penalties(current_time)
            elif self.violation_reason.startswith("DA ") or self.violation_reason.startswith("CHOP MAT CHAM"):
                self.violation_reason = ""
                self.eye_reason = ""

        self._update_aggregated_reason_and_score(current_time)

    def get_status(self, current_time=None):
        """
        Xác định trạng thái và cấp độ cảnh báo (ĐÚNG 4 MỨC DUY NHẤT: ĐỎ, CAM, VÀNG, XANH):
        QUY TẮC CỐT LÕI:
        1. ĐỎ (Danger): Điểm 100, Màu Đỏ (0, 0, 255) - Ngủ gật (>= 1.5s), gục đầu nhắm mắt (>= 0.7s) -> HÚ CÒI KHẨN CẤP.
        2. CAM (Orange): Điểm 80, Màu Cam (0, 165, 255) - 5 Cảnh báo Vàng = 1 Cảnh báo Cam (80/100) -> PHÁT GIỌNG NÓI NHẮC NHỞ.
        3. VÀNG (Warning): Điểm 60-79, Màu Vàng (0, 255, 255) - Ngáp sâu >= 3s, chớp mắt chậm -> KHÔNG PHÁT ÂM THANH.
        4. XANH (Normal): Điểm < 60, Màu Xanh lá (0, 255, 0) - Tỉnh táo, an toàn -> KHÔNG PHÁT ÂM THANH.
        5. Mỗi lần tỉnh táo: điểm lập tức trở về 0đ.
        """
        if current_time is None:
            current_time = time.time()

        # Tối ưu hóa: Nếu mất mặt ngay sau cảnh báo đỏ, khi có lại mặt ở trạng thái bình thường -> lập tức về bình thường
        if self.red_alert_face_lost and self.is_driver_alert:
            self.score = 0
            self.violation_reason = ""
            self.eye_reason = ""
            self.mouth_reason = ""
            self.head_reason = ""
            self.red_alert_face_lost = False
            self.reset_all_penalties(current_time)

        # Tự động giải tỏa Cảnh Báo Cam sau khi kết thúc giọng nói: RESET TOÀN BỘ ĐIỂM PHẠT VỀ 0
        if self.is_orange_alert:
            voice_dur = getattr(Config, 'ORANGE_VOICE_DURATION', getattr(Config, 'DROWSY_VOICE_DURATION', 6.3))
            if (current_time - self.orange_alert_start_time) >= voice_dur:
                if not self.is_active_hazard:
                    self.reset_all_penalties(current_time)

        # Đảm bảo điểm số luôn trong khoảng 0-100
        self.score = max(Config.SCORE_MIN, min(Config.SCORE_MAX, self.score))

        # 1. CẢNH BÁO ĐỎ (Danger / Red): Điểm 100
        is_danger_alert = self.is_active_hazard or (self.score >= 100)
        if is_danger_alert:
            status = "Danger"
            color = (0, 0, 255) # Đỏ BGR
            should_alert = True # Hú còi khẩn cấp
            return status, color, should_alert, self.violation_reason

        # 2. CẢNH BÁO CAM (Orange): Điểm 80 (5 Cảnh báo Vàng = 1 Cảnh báo Cam 80/100)
        is_orange_alert = self.is_orange_alert or (80 <= self.score < 100)
        if is_orange_alert:
            status = "Orange"
            color = (0, 165, 255) # Cam BGR (B=0, G=165, R=255)
            should_alert = True # Kích hoạt phát giọng nói nhắc nhở
            return status, color, should_alert, self.violation_reason

        # 3. CẢNH BÁO VÀNG (Warning / Yellow): Điểm 60-79 (Ngáp sâu, chớp mắt chậm)
        if self.score >= 60:
            status = "Warning"
            color = (0, 255, 255) # Vàng BGR
            should_alert = False # Tuyệt đối không phát âm thanh
            return status, color, should_alert, self.violation_reason

        # 4. XANH (Normal / Green): Điểm < 60
        status = "Normal"
        color = (0, 255, 0) # Xanh lá BGR
        should_alert = False # Không phát âm thanh
        return status, color, should_alert, self.violation_reason

    def reset_all_penalties(self, current_time=None):
        """
        Reset toàn bộ điểm phạt và trạng thái về 0 sau khi kết thúc cảnh báo Cam hoặc Đỏ.
        QUY TẮC MỚI: Sau khi cảnh báo Cam và Đỏ xong thì cộng dồn của cảnh báo vàng cũng sẽ reset theo!
        """
        if current_time is None:
            current_time = time.time()
        self.score = 0
        self.violation_reason = ""
        self.eye_reason = ""
        self.mouth_reason = ""
        self.head_reason = ""
        self.orange_reason = ""
        self.is_orange_alert = False
        self.orange_alert_start_time = 0.0
        self.slow_blink_count = 0
        self.slow_blink_until = 0.0
        self.confirmed_yawns = []
        self.is_yawning = False
        self.is_deep_yawn = False
        self.yawn_candidate_start = 0
        self.yawn_max_mar = 0.0
        self.yawn_warning_logged = False
        self.deep_yawn_warning_logged = False
        self.red_alert_face_lost = False

        # Reset cộng dồn cảnh báo vàng trong warning_logger về 0
        if self.warning_logger is not None:
            self.warning_logger.reset_yellow_counter(current_time, reason="Hoàn tất Cảnh Báo Cam/Đỏ")

    def reset(self, current_time=None):
        """Reset trạng thái và điểm về 0 khi kết thúc hoàn toàn phiên vi phạm."""
        if current_time is None:
            current_time = time.time()
        self.score = 0
        self.violation_reason = ""
        self.eye_reason = ""
        self.mouth_reason = ""
        self.head_reason = ""
        self.orange_reason = ""
        self.is_orange_alert = False
        self.orange_alert_start_time = 0.0
        self.slow_blink_until = 0.0

        self.eye_closed_time = 0
        self.is_eye_closed = False
        self.slow_blink_count = 0
        self.is_sleeping = False
        self.microsleep_count = 0
        self.light_yawn_count = 0
        self.deep_yawn_count = 0
        self.head_drop_count = 0
        
        self.yawn_start_time = 0
        self.yawn_candidate_start = 0
        self.yawn_max_mar = 0.0
        self.is_yawning = False
        self.is_deep_yawn = False
        self.yawn_alert_triggered = False
        self.yawn_warning_logged = False
        self.deep_yawn_warning_logged = False
        self.red_alert_face_lost = False
        self.confirmed_yawns = []
        self.last_yawn_time = 0
        
        self.head_drop_start_time = 0
        self.head_closed_start_time = None
        self.is_head_dropped = False
        self.is_active_head_drop = False
        self.sleep_warning_logged = False
        self.head_drop_warning_logged = False

        # Reset cộng dồn cảnh báo vàng trong warning_logger về 0
        if self.warning_logger is not None:
            self.warning_logger.reset_yellow_counter(current_time, reason="Reset hệ thống")