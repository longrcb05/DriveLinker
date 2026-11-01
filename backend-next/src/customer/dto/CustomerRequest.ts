/**
 * DTO nhận dữ liệu tạo/sửa thông tin Khách hàng.
 * Tương ứng 1:1 với com.drivelinker.customer.dto.CustomerRequest trong Java.
 */
export interface CustomerRequest {
  fullName: string;
  phone: string;
  idCardNumber: string;
  drivingLicense?: string;
  address?: string;
}

