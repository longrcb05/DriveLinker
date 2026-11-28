"""
Bộ kiểm thử hồi quy (Regression & Business Logic Tests) cho TEST_YOLO
Bao gồm:
- Tái hiện và xử lý lỗi P0 (UT-01 .. UT-08)
- Xử lý nháy 1 mắt (không báo ngủ gật khi 1 mắt mở)
- Gục đầu mắt mở -> chỉ hiện reason, KHÔNG CẢNH BÁO
- Gục đầu mắt nhắm -> CẢNH BÁO NGUY HIỂM 100 điểm
- Nhắm mắt có đếm giây thời gian thực: NHAM MAT (x.xs)
- Cơ chế ngáp mới: chỉ còn ngáp sâu, MAR >= ngưỡng Config trên 3s tính 60đ (dưới 3s hiển thị DANG NGAP)
- Mỗi lần tỉnh táo (mở mắt, ngậm miệng, ngẩng đầu) lập tức trở về 0đ
- Cảnh báo vàng KHÔNG phát âm thanh (should_alert = False)
- Chỉ cảnh báo đỏ mới phát âm thanh (should_alert = True)
- Chớp mắt chậm tính là 60 điểm (tương đương cảnh báo vàng)
- Sau khi đạt 5 mức cảnh báo vàng thì kích hoạt Cảnh Báo Đỏ và reset biến đếm đó về 0
"""

# pyrefly: ignore[missing-import]
import pytest
from config import Config
from fatigue_manager import FatigueManager
from canhbao import WarningLogger


@pytest.fixture
def temp_warning_logger(tmp_path):
    """Tạo WarningLogger với file tạm để không làm bẩn dữ liệu thật."""
    log_json = str(tmp_path / "test_canh_bao_log.json")
    log_txt = str(tmp_path / "test_canh_bao_log.txt")
    return WarningLogger(log_file=log_json, text_log_file=log_txt)


def test_yawn_filtered_when_under_1_5s(temp_warning_logger):
    """YÊU CẦU: Há miệng MAR >= 0.70 dưới 1.5s chưa bị tính điểm, hiển thị DANG NGAP."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    mar_val = getattr(Config, 'MAR_LIGHT_YAWN', 0.70) + 0.05
    fm.update_mouth(mar_val, current_time=t0)
    assert fm.score == 0
    assert fm.is_yawning is False

    # 1.0s: hiển thị DANG NGAP, chưa tính điểm (dưới 1.5s)
    fm.update_mouth(mar_val, current_time=t0 + 1.0)
    assert fm.score == 0
    assert fm.is_yawning is False
    assert "DANG NGAP" in fm.violation_reason

    # Ngậm miệng lại trước 1.5s -> tỉnh táo về 0đ
    fm.update_mouth(0.30, current_time=t0 + 1.2)
    assert fm.score == 0
    assert fm.is_yawning is False


def test_light_yawn_confirmed_at_1_5s_with_mar_0_70(temp_warning_logger):
    """YÊU CẦU: Ngáp nhẹ với MAR >= 0.70 và thời gian >= 1.5s thì tính 60đ (Cảnh báo vàng)."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    mar_val = 0.75  # MAR >= 0.70 nhưng < 0.85
    fm.update_mouth(mar_val, current_time=t0)
    fm.update_mouth(mar_val, current_time=t0 + 1.0)
    assert fm.is_yawning is False
    assert "DANG NGAP" in fm.violation_reason

    # Đúng 1.5s: Xác nhận NGÁP NHẸ, tính 60 điểm (Cảnh báo vàng)
    fm.update_mouth(mar_val, current_time=t0 + 1.5)
    assert fm.is_yawning is True
    assert fm.score == 60
    assert "NGAP NHE" in fm.violation_reason

    # Kéo dài đến 3.2s nhưng MAR = 0.75 (< 0.85) -> vẫn là NGÁP NHẸ, không thành ngáp sâu
    fm.update_mouth(mar_val, current_time=t0 + 3.2)
    assert fm.score == 60
    assert "NGAP NHE" in fm.violation_reason

    # Đã ghi vào file cảnh báo 1 sự kiện YELLOW
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t0 + 3.2) == 1


def test_deep_yawn_confirmed_at_3s_with_mar_0_85(temp_warning_logger):
    """YÊU CẦU MỚI: Ngáp sâu với MAR >= 0.85 và thời gian >= 3.0s thì tính CẢNH BÁO CAM (80 điểm)."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    mar_val = 0.90  # MAR >= 0.85
    fm.update_mouth(mar_val, current_time=t0)
    
    # Tại 1.5s: vượt ngưỡng ngáp nhẹ (MAR >= 0.70 và >= 1.5s) -> Cảnh báo Vàng 60đ
    fm.update_mouth(mar_val, current_time=t0 + 1.5)
    assert fm.is_yawning is True
    assert fm.score == 60
    assert "NGAP NHE" in fm.violation_reason
    st, col, alert, _ = fm.get_status(current_time=t0 + 1.5)
    assert st == "Warning"
    assert alert is False

    # Đúng 3.0s: MAR >= 0.85 và >= 3.0s -> Xác nhận NGÁP SÂU, TÍNH VÀO CẢNH BÁO CAM (80đ)!
    fm.update_mouth(mar_val, current_time=t0 + 3.1)
    assert fm.is_yawning is True
    assert fm.is_deep_yawn is True
    assert fm.score == 80  # Điểm 80/100 (Cảnh báo Cam)
    assert "NGAP SAU" in fm.violation_reason

    # Kiểm tra trạng thái chuyển thành Orange và kích hoạt âm thanh giọng nói nhắc nhở
    status, color, should_alert, reason = fm.get_status(current_time=t0 + 3.1)
    assert status == "Orange"
    assert color == (0, 165, 255)
    assert should_alert is True
    assert fm.is_orange_alert is True

    # Kiểm tra log ghi nhận cảnh báo ORANGE
    recent_orange = temp_warning_logger.get_recent_warnings(window_seconds=600.0, warning_type="ORANGE", current_time=t0 + 3.1)
    assert len(recent_orange) == 1
    assert "NGAP SAU" in recent_orange[0]["reason"]


def test_yellow_warning_does_not_play_sound(temp_warning_logger):
    """QUY TẮC MỚI: Cảnh báo vàng KHÔNG cần phát âm thanh (should_alert = False)."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    mar_val = getattr(Config, 'MAR_LIGHT_YAWN', 0.70) + 0.05
    fm.update_mouth(mar_val, current_time=t0)
    fm.update_mouth(mar_val, current_time=t0 + 3.1)

    assert fm.score == 60
    status, color, should_alert, reason = fm.get_status(current_time=t0 + 3.1)
    assert status == "Warning"  # Cảnh báo vàng
    assert color == (0, 255, 255)  # Màu vàng
    assert should_alert is False  # TUYỆT ĐỐI KHÔNG PHÁT ÂM THANH!


def test_slow_blink_calculates_60_points_and_is_yellow_warning(temp_warning_logger):
    """QUY TẮC MỚI: Khi chớp mắt chậm thì vẫn sẽ tính là 60 điểm, tương đương cảnh báo vàng."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0)
    assert fm.is_eye_closed is True

    # Chớp mắt chậm 0.40s (> 0.32s) -> tính 60 điểm
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 0.40)
    assert fm.score == 60
    assert "CHOP MAT CHAM" in fm.violation_reason

    # Cảnh báo vàng không phát âm thanh
    status, color, should_alert, reason = fm.get_status(current_time=t0 + 0.40)
    assert status == "Warning"
    assert should_alert is False

    # Đã được ghi nhận vào file cảnh báo là 1 cảnh báo vàng
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t0 + 0.40) == 1


def test_yawn_mouth_close_resets_immediately_to_zero(temp_warning_logger):
    """YÊU CẦU: Mỗi lần tỉnh táo (ngậm miệng lại sau khi ngáp) thì lập tức trở về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    mar_val = getattr(Config, 'MAR_LIGHT_YAWN', 0.70) + 0.05
    fm.update_mouth(mar_val, current_time=t0)
    fm.update_mouth(mar_val, current_time=t0 + 3.1)
    assert fm.score == 60
    assert fm.is_yawning is True

    # Ngậm miệng lại (MAR = 0.25) -> tỉnh táo: lập tức trở về 0đ!
    fm.update_mouth(0.25, current_time=t0 + 4.0)
    assert fm.is_yawning is False
    assert fm.score == 0
    assert fm.violation_reason == ""


def test_normal_blink_resets_to_zero_when_alert(temp_warning_logger):
    """YÊU CẦU: Chớp mắt sinh lý bình thường thể hiện tài xế tỉnh táo -> lập tức về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    fm.score = 40  # Điểm số giả định trước đó
    t0 = 100.0
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0)
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 0.2)
    assert fm.score == 0


def test_opening_eyes_dismisses_emergency_and_resets_to_zero(temp_warning_logger):
    """YÊU CẦU: Ngủ gật nhưng khi MỞ MẮT RA còi tắt và điểm lập tức trở về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0)
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0 + 1.6)

    assert fm.is_sleeping is True
    assert fm.is_active_hazard is True
    assert fm.score == 100

    # VỪA MỞ MẮT RA: Tài xế tỉnh táo -> lập tức trở về 0đ!
    fm.update_eyes((0.32, 0.32, 0.32), current_time=t0 + 1.8)

    assert fm.is_sleeping is False
    assert fm.is_active_hazard is False
    assert fm.score == 0
    assert "DA MO MAT" in fm.violation_reason


def test_head_up_resets_immediately_to_zero(temp_warning_logger):
    """YÊU CẦU: Ngẩng đầu lên tỉnh táo thì điểm lập tức về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    # Mắt nhắm và cúi đầu 2.1s -> gục đầu 100đ
    fm.update_eyes((0.12, 0.12, 0.12), current_time=t0)
    fm.update_head(28.0, current_time=t0)
    fm.update_head(28.0, current_time=t0 + 2.1)
    assert fm.score == 100

    # Ngẩng đầu lên và mở mắt ra -> tỉnh táo -> lập tức về 0đ
    fm.update_eyes((0.35, 0.35, 0.35), current_time=t0 + 2.5)
    fm.update_head(5.0, current_time=t0 + 2.5)
    assert fm.score == 0


def test_score_resets_to_zero_when_awake_decay(temp_warning_logger):
    """YÊU CẦU: Khi tỉnh táo, cơ chế cập nhật lập tức đưa điểm về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    fm.score = 40
    t0 = 100.0
    fm.apply_decay(current_time=t0 + 0.5)
    assert fm.score == 0


def test_winking_one_eye_does_not_trigger_microsleep(temp_warning_logger):
    """QUAN TRỌNG: Nháy 1 mắt (mắt trái nhắm, mắt phải mở to) không được báo ngủ gật!"""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.10, 0.35, 0.225), current_time=t0)
    fm.update_eyes((0.10, 0.35, 0.225), current_time=t0 + 2.0)

    assert fm.is_sleeping is False
    assert fm.is_active_hazard is False
    assert fm.score < 100
    assert "NGU GAT" not in fm.violation_reason


def test_head_down_with_eyes_open_only_reason_no_alert(temp_warning_logger):
    """YÊU CẦU: Cúi đầu mà mắt vẫn mở thì CHỈ HIỆN REASON, KHÔNG CẢNH BÁO."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.32, 0.32, 0.32), current_time=t0)
    fm.update_head(28.0, current_time=t0)
    fm.update_head(28.0, current_time=t0 + 2.1)

    assert "CUI DAU - MAT MO" in fm.violation_reason
    assert fm.is_active_head_drop is False
    status, color, should_alert, reason = fm.get_status()
    assert should_alert is False
    assert fm.score <= 30


def test_head_down_with_eyes_closed_triggers_danger_alert(temp_warning_logger):
    """YÊU CẦU: Gục đầu mà MẮT NHẮM thì MỚI CẢNH BÁO NGUY HIỂM 100 điểm (Cảnh báo đỏ)."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.12, 0.12, 0.12), current_time=t0)
    fm.update_head(28.0, current_time=t0)
    fm.update_head(28.0, current_time=t0 + 2.1)

    assert fm.is_active_head_drop is True
    assert fm.score == 100
    assert "GUC DAU (NHAM MAT)" in fm.violation_reason
    status, color, should_alert, reason = fm.get_status()
    assert status == "Danger"
    assert color == (0, 0, 255)
    assert should_alert is True  # Chỉ Cảnh Báo Đỏ mới phát âm thanh!

    # Kiểm tra đã ghi nhận sự kiện CẢNH BÁO ĐỎ vào file cảnh báo
    all_warnings = temp_warning_logger.get_all_warnings()
    assert any(w.get("type") == "RED" and "GUC DAU" in w.get("reason", "") for w in all_warnings)


def test_face_lost_does_not_accumulate_into_sleep(temp_warning_logger):
    """UT-07: Mất mặt 10s không bị ghép nối thành nhắm mắt 10s."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0)
    fm.on_face_lost(current_time=t0 + 0.3)
    assert fm.is_eye_closed is False

    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 10.3)
    assert fm.score == 0
    assert fm.is_sleeping is False
    assert fm.is_active_hazard is False


def test_red_alert_followed_by_face_lost_and_reappearing_normal_resets_immediately(temp_warning_logger):
    """
    YÊU CẦU MỚI:
    Tối ưu trạng thái khi bị cảnh báo đỏ liền kề đó là mất khuôn mặt,
    khi có lại khuôn mặt ở trạng thái bình thường thì sẽ lập tức trở về trạng thái bình thường (0đ, Normal).
    """
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0

    # 1. Bị cảnh báo đỏ (ngủ gật >= 1.5s)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 1.6)
    status, color, should_alert, reason = fm.get_status(current_time=t0 + 1.6)
    assert status == "Danger"
    assert fm.score == 100
    assert fm.is_sleeping is True

    # 2. Liền kề đó bị mất khuôn mặt (quay mặt đi, cúi khuất camera)
    fm.on_face_lost(current_time=t0 + 2.0)
    assert fm.red_alert_face_lost is True
    assert fm.is_sleeping is False

    # 3. Có lại khuôn mặt ở trạng thái bình thường (mắt mở to, đầu thẳng, không ngáp)
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 3.0)
    fm.update_mouth(0.10, current_time=t0 + 3.0)
    fm.update_head(0.0, current_time=t0 + 3.0)
    fm.apply_decay(current_time=t0 + 3.0)

    status, color, should_alert, reason = fm.get_status(current_time=t0 + 3.0)
    assert status == "Normal"
    assert fm.score == 0
    assert reason == ""
    assert should_alert is False
    assert fm.red_alert_face_lost is False
    assert fm.is_sleeping is False

    # Kiểm tra biến đếm cảnh báo vàng cũng được reset
    assert temp_warning_logger.count_yellow_warnings_in_window(current_time=t0 + 3.0) == 0


def test_red_alert_followed_by_face_lost_does_not_reset_if_eyes_still_closed(temp_warning_logger):
    """Nếu có lại khuôn mặt nhưng mắt vẫn nhắm (không bình thường) thì không được trở về bình thường."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0

    # 1. Bị cảnh báo đỏ
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 1.6)
    assert fm.score == 100

    # 2. Mất mặt
    fm.on_face_lost(current_time=t0 + 2.0)
    assert fm.red_alert_face_lost is True

    # 3. Thấy lại mặt nhưng mắt đang nhắm tịt (0.10)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 3.0)
    fm.apply_decay(current_time=t0 + 3.0)
    assert fm.is_driver_alert is False
    assert fm.score > 0


def test_5_yellow_warnings_triggers_orange_alert_and_resets_counter(temp_warning_logger):
    """
    QUY TẮC MỚI:
    1. Trong 10p, 5 cảnh báo vàng sẽ bằng 1 CẢNH BÁO CAM (80/100 điểm) và phát giọng nói cảnh báo.
    2. Sau khi đạt 5 mức cảnh báo vàng thì sẽ RESET biến đếm đó về 0.
    """
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 1000.0
    mar_val = getattr(Config, 'MAR_LIGHT_YAWN', 0.70) + 0.05

    # 4 lần cảnh báo vàng (ví dụ 4 lần ngáp sâu trên 3s, mỗi lần cách nhau 60s)
    for i in range(4):
        t_yawn = t0 + i * 60.0
        fm.update_mouth(mar_val, current_time=t_yawn)
        fm.update_mouth(mar_val, current_time=t_yawn + 3.1)
        assert fm.score == 60
        # Cảnh báo vàng: không phát âm thanh
        status, color, should_alert, reason = fm.get_status(current_time=t_yawn + 3.1)
        assert status == "Warning"
        assert color == (0, 255, 255)
        assert should_alert is False

        # Ngậm miệng lại -> tỉnh táo về 0đ
        fm.update_mouth(0.25, current_time=t_yawn + 4.0)
        assert fm.score == 0

    # Kiểm tra biến đếm đang là 4 cảnh báo vàng
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t0 + 250.0) == 4

    # Lần cảnh báo vàng thứ 5 (ngáp sâu thứ 5 tại t = t0 + 300s):
    t_5 = t0 + 300.0
    fm.update_mouth(mar_val, current_time=t_5)
    fm.update_mouth(mar_val, current_time=t_5 + 3.1)

    # ĐÁNH GIÁ 1: Đạt 5 cảnh báo vàng -> NÂNG CẤP THÀNH CẢNH BÁO CAM (80/100đ) VÀ PHÁT ÂM THANH!
    status, color, should_alert, reason = fm.get_status(current_time=t_5 + 3.1)
    assert status == "Orange"  # Cảnh báo Cam!
    assert color == (0, 165, 255)  # Màu Cam trong OpenCV BGR!
    assert fm.score == 80  # Điểm chính xác là 80/100!
    assert should_alert is True  # Kích hoạt phát giọng nói nhắc nhở!
    assert "CANH BAO CAM" in reason

    # ĐÁNH GIÁ 2: SAU KHI ĐẠT 5 CẢNH BÁO VÀNG -> BIẾN ĐẾM ĐÃ ĐƯỢC RESET VỀ 0!
    current_yellow_count = temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t_5 + 3.1)
    assert current_yellow_count == 0  # Biến đếm đã reset về 0 hoàn hảo!

    # ĐÁNH GIÁ 3: Cờ is_orange_alert được kích hoạt để phát giọng nói cảnh báo buồn ngủ
    assert fm.is_orange_alert is True

    # ĐÁNH GIÁ 4: SAU KHI KẾT THÚC GIỌNG NÓI NHẮC NHỞ -> RESET LẠI TOÀN BỘ ĐIỂM PHẠT VỀ 0!
    voice_dur = getattr(Config, 'ORANGE_VOICE_DURATION', 6.3)
    status_after, color_after, should_alert_after, _ = fm.get_status(current_time=t_5 + 3.1 + voice_dur + 0.1)
    assert fm.score == 0  # Toàn bộ điểm phạt đã được reset về 0!
    assert status_after == "Normal"  # Trở lại trạng thái Xanh (Normal)
    assert color_after == (0, 255, 0)
    assert should_alert_after is False
    assert fm.is_orange_alert is False


def test_four_warning_levels_strictly_defined(temp_warning_logger):
    """KIỂM TRA HỆ THỐNG: Đúng 4 mức cảnh báo Xanh, Vàng, Cam, Đỏ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)

    # 1. Mức XANH (Normal): Điểm < 60
    fm.score = 25
    st, col, alert, _ = fm.get_status()
    assert st == "Normal"
    assert col == (0, 255, 0)
    assert alert is False

    # 2. Mức VÀNG (Warning): 60 <= Điểm < 80
    fm.score = 60
    st, col, alert, _ = fm.get_status()
    assert st == "Warning"
    assert col == (0, 255, 255)
    assert alert is False

    # 3. Mức CAM (Orange): 80 <= Điểm < 100
    fm.score = 80
    st, col, alert, _ = fm.get_status()
    assert st == "Orange"
    assert col == (0, 165, 255)
    assert alert is True

    # 4. Mức ĐỎ (Danger): Điểm = 100
    fm.score = 100
    st, col, alert, _ = fm.get_status()
    assert st == "Danger"
    assert col == (0, 0, 255)
    assert alert is True


def test_slow_blink_holds_warning_and_normal_blink_clears(temp_warning_logger):
    """KIỂM TRA: Chớp mắt chậm giữ 60đ cảnh báo vàng trong 2s, chớp mắt bình thường lập tức giải tỏa về 0đ."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0
    # Chớp mắt chậm 0.40s
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t0)
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 0.40)
    assert fm.score == 60
    assert "CHOP MAT CHAM" in fm.violation_reason

    # Khung hình kế tiếp (mắt mở bình thường sau 0.05s): Vẫn duy trì 60đ để hiển thị cho tài xế và camera
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t0 + 0.45)
    fm.apply_decay(current_time=t0 + 0.45)
    assert fm.score == 60
    status, color, should_alert, reason = fm.get_status(current_time=t0 + 0.45)
    assert status == "Warning"
    assert should_alert is False

    # Tài xế chớp mắt bình thường (0.15s) -> tỉnh táo -> giải tỏa ngay về 0đ!
    t_normal = t0 + 0.60
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t_normal)
    fm.update_eyes((0.30, 0.30, 0.30), current_time=t_normal + 0.15)
    assert fm.score == 0
    assert fm.violation_reason == ""


def test_red_alert_finish_resets_yellow_counter(temp_warning_logger):
    """QUY TẮC MỚI: Sau khi cảnh báo ĐỎ xong thì cộng dồn của cảnh báo vàng cũng sẽ reset theo."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 200.0

    # 1. Giả lập tích lũy 3 lần cảnh báo vàng (3 lần chớp mắt chậm)
    for i in range(3):
        t_blink = t0 + i * 30.0
        fm.update_eyes((0.15, 0.15, 0.15), current_time=t_blink)
        fm.update_eyes((0.30, 0.30, 0.30), current_time=t_blink + 0.40)
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t0 + 100.0) == 3

    # 2. Xảy ra sự kiện CẢNH BÁO ĐỎ (ngủ gật liên tục 1.5s)
    t_sleep = t0 + 120.0
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t_sleep)
    fm.update_eyes((0.15, 0.15, 0.15), current_time=t_sleep + 1.6)
    assert fm.score == 100
    st, _, alert, _ = fm.get_status(current_time=t_sleep + 1.6)
    assert st == "Danger"
    assert alert is True

    # 3. Khi cảnh báo đỏ hoàn tất (tài xế mở mắt, kết thúc câu nhắc nhở và reset_all_penalties được gọi):
    t_finish = t_sleep + 1.6 + 4.5
    fm.reset_all_penalties(current_time=t_finish)

    # ĐÁNH GIÁ: Toàn bộ điểm phạt về 0 VÀ biến đếm cộng dồn cảnh báo vàng cũng đã reset về 0!
    assert fm.score == 0
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t_finish) == 0


def test_orange_alert_finish_resets_yellow_counter(temp_warning_logger):
    """QUY TẮC MỚI: Sau khi cảnh báo CAM xong thì cộng dồn của cảnh báo vàng cũng sẽ reset theo."""
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 500.0

    # 1. Giả lập có 2 lần cảnh báo vàng tích lũy
    for i in range(2):
        t_blink = t0 + i * 30.0
        fm.update_eyes((0.15, 0.15, 0.15), current_time=t_blink)
        fm.update_eyes((0.30, 0.30, 0.30), current_time=t_blink + 0.40)
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t0 + 70.0) == 2

    # 2. Xảy ra CẢNH BÁO CAM do ngáp sâu (MAR >= 0.85 & 3.0s)
    t_yawn = t0 + 100.0
    fm.update_mouth(0.90, current_time=t_yawn)
    fm.update_mouth(0.90, current_time=t_yawn + 3.1)
    assert fm.score == 80
    st, _, alert, _ = fm.get_status(current_time=t_yawn + 3.1)
    assert st == "Orange"
    assert alert is True
    assert fm.is_orange_alert is True

    # 3. Hết thời gian phát giọng nói nhắc nhở của cảnh báo cam (ORANGE_VOICE_DURATION):
    voice_dur = getattr(Config, 'ORANGE_VOICE_DURATION', 4.5)
    t_finish = t_yawn + 3.1 + voice_dur + 0.1
    st_after, _, alert_after, _ = fm.get_status(current_time=t_finish)

    # ĐÁNH GIÁ: Hệ thống tự động giải tỏa về Normal (0đ) VÀ biến đếm vàng cũng đã được reset về 0!
    assert fm.score == 0
    assert st_after == "Normal"
    assert alert_after is False
    assert temp_warning_logger.count_yellow_warnings_in_window(window_seconds=600.0, current_time=t_finish) == 0


def test_concurrent_yawn_and_sleep_triggers_red_alert_and_tracks_both(temp_warning_logger):
    """
    KIỂM THỬ TÍNH NĂNG MỚI:
    Trường hợp tài xế vừa ngáp vừa nhắm mắt:
    - Ngáp được 0.5s rồi ngậm miệng lại trong khi mắt vẫn nhắm liên tục 1.5s
    -> Cảnh báo ĐỎ (100đ, Danger, NGU GAT) vẫn kích hoạt chính xác, không bị nuốt hoặc xóa mất!
    """
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 100.0

    # 1. Tại t0: Bắt đầu ngáp (MAR = 0.80) và bắt đầu nhắm mắt (EAR = 0.10)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0)
    fm.update_mouth(0.80, current_time=t0)
    fm.update_head(0.0, current_time=t0)
    fm.apply_decay(current_time=t0)

    # Cả hai hành vi đang diễn ra đồng thời
    assert "NHAM MAT" in fm.eye_reason
    assert "DANG NGAP" in fm.mouth_reason
    assert "NHAM MAT" in fm.violation_reason
    assert "DANG NGAP" in fm.violation_reason

    # 2. Tại t0 + 0.5s: Ngậm miệng lại (MAR = 0.20), nhưng mắt vẫn tiếp tục nhắm (EAR = 0.10)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 0.5)
    fm.update_mouth(0.20, current_time=t0 + 0.5)
    fm.update_head(0.0, current_time=t0 + 0.5)
    fm.apply_decay(current_time=t0 + 0.5)

    assert fm.mouth_reason == "" # Miệng đã ngậm lại
    assert "NHAM MAT (0.5s)" in fm.eye_reason
    assert "NHAM MAT (0.5s)" in fm.violation_reason # Lý do mắt vẫn được bảo toàn, KHÔNG bị xóa trắng!

    # 3. Tại t0 + 1.5s: Mắt đã nhắm đủ 1.5s liên tục
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 1.5)
    fm.update_mouth(0.20, current_time=t0 + 1.5)
    fm.update_head(0.0, current_time=t0 + 1.5)
    fm.apply_decay(current_time=t0 + 1.5)

    status, color, should_alert, reason = fm.get_status(current_time=t0 + 1.5)
    assert status == "Danger"
    assert fm.score == 100
    assert should_alert is True
    assert "NGU GAT (1.5s)" in reason
    assert fm.microsleep_count == 1 # Bộ đếm ngủ gật được tăng lên 1


def test_simultaneous_yawn_and_sleep_combines_reasons_and_counts_both(temp_warning_logger):
    """
    Trường hợp tài xế ngáp nhẹ kéo dài 1.5s VÀ nhắm mắt 1.5s cùng lúc:
    - Lý do vi phạm hiển thị đồng thời cả hai hành vi: NGU GAT (1.5s) | NGAP NHE (1.5s)
    - Cảnh báo ĐỎ (Danger, điểm 100) được ưu tiên hàng đầu
    - Cả hai bộ đếm vi phạm (microsleep_count và light_yawn_count) đều được ghi nhận
    """
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 200.0

    for step in range(16):
        t = t0 + step * 0.1
        fm.update_eyes((0.10, 0.10, 0.10), current_time=t)
        fm.update_mouth(0.75, current_time=t) # MAR >= 0.70
        fm.update_head(0.0, current_time=t)
        fm.apply_decay(current_time=t)

    status, color, should_alert, reason = fm.get_status(current_time=t0 + 1.5)
    assert status == "Danger"
    assert fm.score == 100
    assert should_alert is True
    assert "NGU GAT (1.5s)" in reason
    assert "NGAP NHE (1.5s)" in reason
    assert fm.microsleep_count == 1
    assert fm.light_yawn_count == 1


def test_smooth_box_filter_and_smart_face_box():
    """
    Kiểm thử bộ lọc làm mịn SmoothBox (EMA) và hàm vẽ khung khuôn mặt công nghệ cao:
    - SmoothBox khởi tạo và cập nhật mượt mà, không nhảy vọt đột ngột
    - Khi reset (mất mặt), trả về None
    - draw_smart_face_box vẽ đầy đủ không ném lỗi trên ảnh numpy
    """
    import numpy as np
    from main import SmoothBox, draw_smart_face_box

    smoother = SmoothBox(alpha=0.35)
    # Khung ban đầu
    b1 = [100, 100, 200, 200]
    out1 = smoother.update(b1)
    assert out1 == b1

    # Khung dịch chuyển đột ngột sang 150
    b2 = [150, 150, 250, 250]
    out2 = smoother.update(b2)
    # Với alpha=0.35, tọa độ mới = 0.35*150 + 0.65*100 = 117.5 -> 118 (làm mịn, không nhảy ngay tới 150)
    assert out2[0] < b2[0]
    assert out2[0] > b1[0]

    # Reset smoother
    smoother.reset()
    assert smoother.current_box is None
    assert smoother.update(None) is None

    # Kiểm tra vẽ khung trên ma trận ảnh thực tế
    test_img = np.zeros((480, 640, 3), dtype=np.uint8)
    draw_smart_face_box(test_img, [100, 100, 250, 280], label="Alert 95%", color=(0, 255, 0))
    # Đảm bảo có pixel đã được vẽ (không còn toàn màu đen 0)
    assert np.count_nonzero(test_img) > 0


def test_completed_violations_captured_at_end(temp_warning_logger):
    """
    Kiểm thử cơ chế bắt vi phạm KHI KẾT THÚC VI PHẠM:
    1. Chớp mắt chậm 0.56s: khi mắt vừa mở lại, phát sinh sự kiện kết thúc vi phạm với đúng 0.56s
    2. Ngáp nhẹ 1.8s: khi ngậm miệng lại, phát sinh sự kiện kết thúc vi phạm với đúng 1.8s
    3. Ngủ gật 2.2s: khi mở mắt lại sau ngủ gật, phát sinh sự kiện kết thúc vi phạm Danger với đúng 2.2s
    """
    fm = FatigueManager(warning_logger=temp_warning_logger)
    t0 = 300.0

    # 1. Chớp mắt chậm (0.56s)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t0 + 0.3)
    # Mắt mở lại tại t0 + 0.56s -> kết thúc chớp mắt chậm
    fm.update_eyes((0.35, 0.35, 0.35), current_time=t0 + 0.56)
    completed = fm.pop_completed_violations()
    assert len(completed) >= 1
    assert completed[0]['warning_level'] == 'Warning'
    assert completed[0]['category'] == 'eye'
    assert "CHOP MAT CHAM (0.56s)" in completed[0]['reason']

    # 2. Ngáp nhẹ (1.8s)
    t1 = 400.0
    fm.update_mouth(0.75, current_time=t1)
    fm.update_mouth(0.75, current_time=t1 + 1.0)
    # Ngậm miệng lại tại t1 + 1.8s -> kết thúc ngáp nhẹ
    fm.update_mouth(0.20, current_time=t1 + 1.8)
    completed = fm.pop_completed_violations()
    assert len(completed) == 1
    assert completed[0]['warning_level'] == 'Warning'
    assert completed[0]['category'] == 'mouth'
    assert "NGAP NHE (1.8s)" in completed[0]['reason']

    # 3. Ngủ gật (2.2s)
    t2 = 500.0
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t2)
    fm.update_eyes((0.10, 0.10, 0.10), current_time=t2 + 1.6) # Đã vượt 1.5s (ngủ gật)
    # Mở mắt tỉnh dậy tại t2 + 2.2s -> kết thúc ngủ gật
    fm.update_eyes((0.35, 0.35, 0.35), current_time=t2 + 2.2)
    completed = fm.pop_completed_violations()
    assert len(completed) >= 1
    assert completed[0]['warning_level'] == 'Danger'
    assert completed[0]['category'] == 'eye'
    assert "NGU GAT (2.2s)" in completed[0]['reason']




