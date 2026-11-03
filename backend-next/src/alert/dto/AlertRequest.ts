/**
 * DTO nhận dữ liệu Cảnh báo từ Thiết bị IoT.
 * Tương ứng 1:1 với com.drivelinker.alert.dto.AlertRequest trong Java.
 */
export interface AlertRequest {
  eventId: string;
  alertType: string;
  severityLevel: string;
  drowsinessScore?: number;
  latitude?: number;
  longitude?: number;
  occurredAt: string | Date;
}

