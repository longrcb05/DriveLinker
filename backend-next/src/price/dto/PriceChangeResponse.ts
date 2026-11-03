import { PriceChangeRequest, RentalContract, User } from '@prisma/client';

export type PriceChangeRequestWithRelations = PriceChangeRequest & {
  contract?: RentalContract;
  requestedByStaff?: User;
  reviewedByManager?: User | null;
};

/**
 * DTO trả về thông tin yêu cầu thay đổi giá hợp đồng.
 */
export class PriceChangeResponse {
  id: number;
  contractId: number;
  requestedByStaffId: number;
  currentPrice: number;
  proposedPrice: number | null;
  reason: string;
  managerNote: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedByManagerId: number | null;

  // Dữ liệu quan hệ
  staffName?: string;
  managerName?: string;

  constructor(req: PriceChangeRequestWithRelations) {
    this.id = req.id;
    this.contractId = req.contractId;
    this.requestedByStaffId = req.requestedByStaffId;
    this.currentPrice = req.currentPrice;
    this.proposedPrice = req.proposedPrice;
    this.reason = req.reason;
    this.managerNote = req.managerNote;
    this.status = req.status;
    this.createdAt = req.createdAt;
    this.reviewedAt = req.reviewedAt;
    this.reviewedByManagerId = req.reviewedByManagerId;

    if (req.requestedByStaff) {
      this.staffName = req.requestedByStaff.fullName;
    }
    if (req.reviewedByManager) {
      this.managerName = req.reviewedByManager.fullName;
    }
  }
}

export default PriceChangeResponse;

