/**
 * DTO sự kiện Realtime Cảnh báo gửi cho Giám sát viên qua WebSocket / PubSub.
 * Tương ứng 1:1 với com.drivelinker.alert.dto.RealtimeAlertEvent trong Java.
 */
export class RealtimeAlertEvent {
  eventType: string = 'ALERT_CREATED';
  alertId: number | string;
  alertTypeName: string;
  severityLevel: string;
  vehicleId: number;
  latitude: number | null;
  longitude: number | null;
  occurredAt: Date;

  constructor(
    alertId: number | string,
    alertTypeName: string,
    severityLevel: string,
    vehicleId: number,
    latitude: number | null,
    longitude: number | null,
    occurredAt: Date
  ) {
    this.alertId = alertId;
    this.alertTypeName = alertTypeName;
    this.severityLevel = severityLevel;
    this.vehicleId = vehicleId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.occurredAt = occurredAt;
  }
}

export default RealtimeAlertEvent;

