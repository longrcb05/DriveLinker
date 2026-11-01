/**
 * DTO trả về từng tọa độ hành trình của xe.
 * Tương ứng 1:1 với com.drivelinker.dashboard.dto.JourneyPointDto trong Java.
 */
export class JourneyPointDto {
  latitude: number | null = null;
  longitude: number | null = null;
  speed: number | null = null;
  recordedAt: Date | null = null;
}

export default JourneyPointDto;

