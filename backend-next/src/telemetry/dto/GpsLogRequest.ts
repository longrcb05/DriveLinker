/**
 * DTO nhận dữ liệu vị trí GPS từ Thiết bị IoT.
 * Tương ứng 1:1 với com.drivelinker.telemetry.dto.GpsLogRequest trong Java.
 */
export interface GpsLogRequest {
  eventId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recordedAt: string | Date;
}

