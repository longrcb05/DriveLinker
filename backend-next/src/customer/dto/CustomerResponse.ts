import { Customer } from '@prisma/client';

/**
 * DTO trả về thông tin Khách hàng sau khi xử lý.
 * Tương ứng 1:1 với com.drivelinker.customer.dto.CustomerResponse trong Java.
 */
export class CustomerResponse {
  id: number;
  fullName: string;
  phone: string;
  idCardNumber: string;
  drivingLicense: string | null;
  address: string | null;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.fullName = customer.fullName;
    this.phone = customer.phone;
    this.idCardNumber = customer.idCardNumber;
    this.drivingLicense = customer.drivingLicense;
    this.address = customer.address;
  }
}

export default CustomerResponse;

