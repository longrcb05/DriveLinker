/**
 * DTO nhận dữ liệu đầu vào khi tạo/sửa Hợp đồng thuê xe.
 * Tương ứng 1:1 với com.drivelinker.rental.dto.RentalContractRequest trong Java.
 */
export interface RentalContractRequest {
  customerId: number;
  vehicleId: number;
  startTime: string | Date;
  endTime: string | Date;
  price?: number;
  depositAmount?: number;
  notes?: string;
}
