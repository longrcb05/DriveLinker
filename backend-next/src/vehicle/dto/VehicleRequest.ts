/**
 * DTO nhận dữ liệu tạo/sửa thông tin Phương tiện.
 * Tương ứng 1:1 với com.drivelinker.vehicle.dto.VehicleRequest trong Java.
 */
export interface VehicleRequest {
  licensePlate: string;
  vehicleType: string;
  brand: string;
  model: string;
  status?: string;
}
