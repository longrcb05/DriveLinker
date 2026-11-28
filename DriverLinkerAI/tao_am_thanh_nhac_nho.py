import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def tao_am_thanh():
    try:
        from gtts import gTTS
        # Lời thoại nhắc nhở nhẹ nhàng, thân thiện theo yêu cầu người dùng
        text = "Bạn có dấu hiệu mệt mỏi rồi, tỉnh táo lên nhé!"
        output_file = "nhac_nho_tap_trung.mp3"
        print(f"Đang tổng hợp giọng nói nhắc nhở: '{text}'...")
        tts = gTTS(text, lang='vi')
        tts.save(output_file)
        print(f"✅ Thành công! Đã lưu file âm thanh: {output_file}")
    except Exception as e:
        print(f"❌ Lỗi tạo âm thanh: {e}")

if __name__ == "__main__":
    tao_am_thanh()
