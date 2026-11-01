import { RentalContract, Customer, Vehicle, User } from '@prisma/client';

export type RentalContractWithRelations = RentalContract & {
  customer?: Customer;
  vehicle?: Vehicle;
  createdByStaff?: User;
};

/**
 * DTO trả về thông tin Hợp đồng thuê xe.
 * Tương ứng 1:1 với com.drivelinker.rental.dto.RentalContractResponse trong Java.
 */
export class RentalContractResponse {
  id: number;
  customerId: number;
  vehicleId: number;
  createdByStaffId: number;
  startTime: Date;
  endTime: Date;
  actualReturnTime: Date | null;
  status: string;
  price: number;
  depositAmount: number;
  hasPendingPriceRequest: boolean;
  notes: string | null;
  createdAt: Date;

  // Dữ liệu mở rộng cho giao diện Frontend
  customerName?: string;
  customerPhone?: string;
  licensePlate?: string;
  vehicleModel?: string;
  staffName?: string;

  constructor(contract: RentalContractWithRelations) {
    this.id = contract.id;
    this.customerId = contract.customerId;
    this.vehicleId = contract.vehicleId;
    this.createdByStaffId = contract.createdByStaffId;
    this.startTime = contract.startTime;
    this.endTime = contract.endTime;
    this.actualReturnTime = contract.actualReturnTime;
    this.status = contract.status;
    this.price = contract.price ?? 0;
    this.depositAmount = contract.depositAmount ?? 0;
    this.hasPendingPriceRequest = contract.hasPendingPriceRequest ?? false;
    this.notes = contract.notes;
    this.createdAt = contract.createdAt;

    if (contract.customer) {
      this.customerName = contract.customer.fullName;
      this.customerPhone = contract.customer.phone;
    }
    if (contract.vehicle) {
      this.licensePlate = contract.vehicle.licensePlate;
      this.vehicleModel = `${contract.vehicle.brand || ''} ${contract.vehicle.model || ''}`.trim();
    }
    if (contract.createdByStaff) {
      this.staffName = contract.createdByStaff.fullName;
    }
  }
}

export default RentalContractResponse;
