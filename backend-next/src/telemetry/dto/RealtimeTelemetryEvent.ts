/**
 * DTO sự kiện Realtime Telemetry gửi cho Frontend qua WebSocket / PubSub.
 * Tương ứng 1:1 với com.drivelinker.telemetry.dto.RealtimeTelemetryEvent trong Java.
 */
export class RealtimeTelemetryEvent {
  eventType: string = 'VEHICLE_LOCATION_UPDATED';
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: Date;

  constructor(
    vehicleId: number,
    latitude: number,
    longitude: number,
    speed: number | null,
    recordedAt: Date
  ) {
    this.vehicleId = vehicleId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.speed = speed;
    this.recordedAt = recordedAt;
  }
}

export default RealtimeTelemetryEvent;

