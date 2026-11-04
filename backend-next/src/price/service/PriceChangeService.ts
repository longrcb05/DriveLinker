import prisma from '@/lib/prisma';
import { PriceChangeRequestDto } from '@/price/dto/PriceChangeRequestDto';
import { PriceChangeResponse } from '@/price/dto/PriceChangeResponse';

/**
 * Service xử lý quy trình phê duyệt thay đổi giá hợp đồng (Price Approvals).
 * Lập trình thủ công 100%, bảo đảm tính toàn vẹn dữ liệu thông qua Database Transaction.
 */
export class PriceChangeService {
  /**
   * Nhân viên tạo yêu cầu thay đổi giá hợp đồng
   */
  public static async createRequest(
    contractId: number,
    staffId: number,
    dto: PriceChangeRequestDto
  ): Promise<PriceChangeResponse> {
    if (!dto.reason || dto.reason.trim() === '') {
      throw new Error('Vui lòng nêu rõ lý do yêu cầu thay đổi giá.');
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new Error('Không tìm thấy thông tin nhân viên.');
    }

    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new Error('Không tìm thấy hợp đồng.');
    }

    if (contract.organizationId !== staff.organizationId) {
      throw new Error('Hợp đồng không thuộc quyền quản lý của doanh nghiệp bạn.');
    }

    if (contract.status === 'COMPLETED' || contract.status === 'CANCELLED') {
      throw new Error('Hợp đồng đã kết thúc hoặc bị hủy, không thể yêu cầu đổi giá.');
    }

    if (contract.hasPendingPriceRequest) {
      throw new Error('Hợp đồng này đang có một yêu cầu đổi giá chờ duyệt.');
    }

    const proposedPrice =
      dto.proposedPrice !== undefined && dto.proposedPrice !== null && dto.proposedPrice >= 0
        ? dto.proposedPrice
        : contract.price ?? 0;

    // Thực hiện trong Transaction để đảm bảo tính toàn vẹn
    const savedRequest = await prisma.$transaction(async (tx) => {
      // 1. Đánh dấu cờ trên hợp đồng
      await tx.rentalContract.update({
        where: { id: contractId },
        data: { hasPendingPriceRequest: true },
      });

      // 2. Tạo bản ghi yêu cầu đổi giá
      const req = await tx.priceChangeRequest.create({
        data: {
          contractId: contract.id,
          requestedByStaffId: staff.id,
          currentPrice: contract.price ?? 0,
          proposedPrice: proposedPrice,
          reason: dto.reason.trim(),
          status: 'PENDING',
        },
        include: {
          contract: true,
          requestedByStaff: true,
        },
      });

      return req;
    });

    return new PriceChangeResponse(savedRequest);
  }

  /**
   * Lấy danh sách các yêu cầu thay đổi giá theo Organization (Mặc định tất cả hoặc theo filter)
   */
  public static async getRequests(
    organizationId: number,
    statusFilter?: string
  ): Promise<PriceChangeResponse[]> {
    const where: any = {
      contract: {
        organizationId: organizationId,
      },
    };

    if (statusFilter && statusFilter !== 'ALL' && statusFilter.trim() !== '') {
      where.status = statusFilter.trim();
    }

    const list = await prisma.priceChangeRequest.findMany({
      where,
      include: {
        contract: true,
        requestedByStaff: true,
        reviewedByManager: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => new PriceChangeResponse(item));
  }

  /**
   * Quản lý phê duyệt yêu cầu thay đổi giá (Cập nhật giá mới vào Hợp đồng)
   */
  public static async approveRequest(
    requestId: number,
    managerId: number,
    managerNote?: string,
    newPrice?: number
  ): Promise<PriceChangeResponse> {
    const existingReq = await prisma.priceChangeRequest.findUnique({
      where: { id: requestId },
      include: { contract: true },
    });

    if (!existingReq) {
      throw new Error('Không tìm thấy yêu cầu thay đổi giá.');
    }

    if (existingReq.status !== 'PENDING') {
      throw new Error('Yêu cầu này đã được xử lý trước đó.');
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái yêu cầu
      const req = await tx.priceChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedByManagerId: managerId,
          reviewedAt: now,
          managerNote: managerNote || null,
        },
        include: {
          contract: true,
          requestedByStaff: true,
          reviewedByManager: true,
        },
      });

      // 2. Cập nhật giá mới vào Hợp đồng và tắt cờ pending
      const finalPrice =
        newPrice !== undefined && newPrice !== null && newPrice > 0
          ? newPrice
          : existingReq.proposedPrice ?? existingReq.currentPrice;

      await tx.rentalContract.update({
        where: { id: existingReq.contractId },
        data: {
          price: finalPrice,
          hasPendingPriceRequest: false,
        },
      });

      return req;
    });

    return new PriceChangeResponse(updated);
  }

  /**
   * Quản lý từ chối yêu cầu thay đổi giá (Giữ nguyên giá cũ của Hợp đồng)
   */
  public static async rejectRequest(
    requestId: number,
    managerId: number,
    managerNote?: string
  ): Promise<PriceChangeResponse> {
    const existingReq = await prisma.priceChangeRequest.findUnique({
      where: { id: requestId },
      include: { contract: true },
    });

    if (!existingReq) {
      throw new Error('Không tìm thấy yêu cầu thay đổi giá.');
    }

    if (existingReq.status !== 'PENDING') {
      throw new Error('Yêu cầu này đã được xử lý trước đó.');
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái yêu cầu từ chối
      const req = await tx.priceChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedByManagerId: managerId,
          reviewedAt: now,
          managerNote: managerNote || null,
        },
        include: {
          contract: true,
          requestedByStaff: true,
          reviewedByManager: true,
        },
      });

      // 2. Tắt cờ pending trên hợp đồng, giữ nguyên giá hợp đồng
      await tx.rentalContract.update({
        where: { id: existingReq.contractId },
        data: {
          hasPendingPriceRequest: false,
        },
      });

      return req;
    });

    return new PriceChangeResponse(updated);
  }

  /**
   * Xem chi tiết 1 yêu cầu thay đổi giá
   */
  public static async getRequestById(requestId: number): Promise<PriceChangeResponse> {
    const req = await prisma.priceChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        contract: true,
        requestedByStaff: true,
        reviewedByManager: true,
      },
    });

    if (!req) {
      throw new Error('Không tìm thấy yêu cầu thay đổi giá.');
    }

    return new PriceChangeResponse(req);
  }
}

export default PriceChangeService;
