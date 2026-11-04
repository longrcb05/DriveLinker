import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import PriceChangeService from '@/price/service/PriceChangeService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý các API quy trình phê duyệt giá hợp đồng.
 */
export class PriceChangeController {
  private static async extractAuth(request: NextRequest) {
    return extractAuth(request);
  }

  /**
   * POST /api/contracts/[id]/price-requests hoặc POST /api/price-requests
   */
  static async createRequest(request: NextRequest, contractId?: number) {
    try {
      const user = await this.extractAuth(request);
      const body = await request.json();
      const targetContractId = contractId || body.contractId;

      if (!targetContractId) {
        return ApiResponse.error('Mã hợp đồng không được để trống.', 400);
      }

      const response = await PriceChangeService.createRequest(Number(targetContractId), user.userId, body);
      return ApiResponse.success(response, 'Đã gửi yêu cầu thay đổi giá thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi gửi yêu cầu đổi giá.', 400);
    }
  }

  /**
   * GET /api/price-requests
   */
  static async getRequests(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || undefined;

      const list = await PriceChangeService.getRequests(user.organizationId, status);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy danh sách yêu cầu đổi giá.', 400);
    }
  }

  /**
   * POST /api/price-requests/[id]/approve
   */
  static async approveRequest(request: NextRequest, requestId: number) {
    try {
      const user = await this.extractAuth(request);
      let managerNote: string | undefined;
      let newPrice: number | undefined;

      try {
        const body = await request.json();
        managerNote = body?.managerNote;
        if (body?.newPrice !== undefined && body?.newPrice !== null && body?.newPrice !== '') {
          newPrice = Number(body.newPrice);
        }
      } catch (e) {
        // Body có thể để trống
      }

      const response = await PriceChangeService.approveRequest(
        requestId,
        user.userId,
        managerNote,
        newPrice
      );
      return ApiResponse.success(response, 'Đã phê duyệt thay đổi giá thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi phê duyệt yêu cầu đổi giá.', 400);
    }
  }

  /**
   * POST /api/price-requests/[id]/reject
   */
  static async rejectRequest(request: NextRequest, requestId: number) {
    try {
      const user = await this.extractAuth(request);
      let managerNote: string | undefined;
      try {
        const body = await request.json();
        managerNote = body?.managerNote;
      } catch (e) {
        // Body có thể để trống
      }

      const response = await PriceChangeService.rejectRequest(
        requestId,
        user.userId,
        managerNote
      );
      return ApiResponse.success(response, 'Đã từ chối yêu cầu thay đổi giá.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi từ chối yêu cầu đổi giá.', 400);
    }
  }
}

export default PriceChangeController;
