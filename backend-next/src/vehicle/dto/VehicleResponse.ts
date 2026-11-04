import { Vehicle } from '@prisma/client';

/**
 * DTO trả về thông tin Phương tiện.
 * Tương ứng 1:1 với com.drivelinker.vehicle.dto.VehicleResponse trong Java.
 */
export class VehicleResponse {
  id: number;
  licensePlate: string;
  vehicleType: string | null;
  brand: string | null;
  model: string | null;
  status: string;
  movementStatus?: string;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastSpeed?: number | null;
  lastSeenAt?: Date | null;
  createdAt?: Date;

  constructor(vehicle: Vehicle) {
    this.id = vehicle.id;
    this.licensePlate = vehicle.licensePlate;
    this.vehicleType = vehicle.vehicleType;
    this.brand = vehicle.brand;
    this.model = vehicle.model;
    this.status = vehicle.status;
    this.movementStatus = vehicle.movementStatus;
    this.lastLatitude = vehicle.lastLatitude;
    this.lastLongitude = vehicle.lastLongitude;
    this.lastSpeed = vehicle.lastSpeed;
    this.lastSeenAt = vehicle.lastSeenAt;
    this.createdAt = vehicle.createdAt;
  }
}

export default VehicleResponse;
