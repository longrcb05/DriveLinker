import { Alert, Vehicle, User } from '@prisma/client';

export type AlertWithRelations = Alert & {
  vehicle?: Vehicle;
  resolver?: User | null;
};

/**
 * DTO trả về thông tin chi tiết Cảnh báo cho Web Frontend.
 */
export class AlertDetailResponse {
  id: string; // Chuyển đổi BigInt sang string để an toàn cho JSON
  eventId: string;
  organizationId: number;
  vehicleId: number;
  monitoringSessionId: string;
  alertType: string;
  severityLevel: string;
  drowsinessScore: number | null;
  latitude: number | null;
  longitude: number | null;
  resolutionStatus: string;
  resolvedBy: number | null;
  resolutionNote: string | null;
  occurredAt: Date;
  receivedAt: Date;
  resolvedAt: Date | null;

  // Dữ liệu mở rộng
  licensePlate?: string;
  vehicleModel?: string;
  resolverName?: string;

  constructor(alert: AlertWithRelations) {
    this.id = alert.id.toString();
    this.eventId = alert.eventId;
    this.organizationId = alert.organizationId;
    this.vehicleId = alert.vehicleId;
    this.monitoringSessionId = alert.monitoringSessionId.toString();
    this.alertType = alert.alertType;
    this.severityLevel = alert.severityLevel;
    this.drowsinessScore = alert.drowsinessScore;
    this.latitude = alert.latitude;
    this.longitude = alert.longitude;
    this.resolutionStatus = alert.resolutionStatus;
    this.resolvedBy = alert.resolvedBy;
    this.resolutionNote = alert.resolutionNote;
    this.occurredAt = alert.occurredAt;
    this.receivedAt = alert.receivedAt;
    this.resolvedAt = alert.resolvedAt;

    if (alert.vehicle) {
      this.licensePlate = alert.vehicle.licensePlate;
      this.vehicleModel = `${alert.vehicle.brand || ''} ${alert.vehicle.model || ''}`.trim();
    }
    if (alert.resolver) {
      this.resolverName = alert.resolver.fullName;
    }
  }
}

export default AlertDetailResponse;

