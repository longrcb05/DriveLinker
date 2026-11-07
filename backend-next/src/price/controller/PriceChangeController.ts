import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import PriceChangeService from '@/price/service/PriceChangeService';

/**
 * Controller xử lý các API quy trình phê duyệt giá hợp đồng.
 */
export class PriceChangeController {
  /**
   * POST /api/contracts/[id]/price-requests
   */
  static async createRequest(request: NextRequest, contractId: number) {
    try {
      const authHeader = request.headers.get('authorization');
      const token = JwtService.getTokenFromHeader(authHeader);
      if (!token) {
        return ApiResponse.unauthorized('Chưa xác thực người dùng.');
      }

      const userPayload = await JwtService.extractUser(token);
      if (!userPayload) {
        return ApiResponse.unauthorized('Token không hợp lệ hoặc đã hết hạn.');
      }

      const body = await request.json();
      const response = await PriceChangeService.createRequest(contractId, userPayload.userId, body);
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
      const authHeader = request.headers.get('authorization');
      const token = JwtService.getTokenFromHeader(authHeader);
      if (!token) {
        return ApiResponse.unauthorized('Chưa xác thực người dùng.');
      }

      const userPayload = await JwtService.extractUser(token);
      if (!userPayload) {
        return ApiResponse.unauthorized('Token không hợp lệ hoặc đã hết hạn.');
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || undefined;

      const list = await PriceChangeService.getRequests(userPayload.organizationId, status);
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
      const authHeader = request.headers.get('authorization');
      const token = JwtService.getTokenFromHeader(authHeader);
      if (!token) {
        return ApiResponse.unauthorized('Chưa xác thực người dùng.');
      }

      const userPayload = await JwtService.extractUser(token);
      if (!userPayload) {
        return ApiResponse.unauthorized('Token không hợp lệ hoặc đã hết hạn.');
      }

      let managerNote: string | undefined;
      try {
        const body = await request.json();
        managerNote = body?.managerNote;
      } catch (e) {
        // Body có thể để trống
      }

      const response = await PriceChangeService.approveRequest(
        requestId,
        userPayload.userId,
        managerNote
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
      const authHeader = request.headers.get('authorization');
      const token = JwtService.getTokenFromHeader(authHeader);
      if (!token) {
        return ApiResponse.unauthorized('Chưa xác thực người dùng.');
      }

      const userPayload = await JwtService.extractUser(token);
      if (!userPayload) {
        return ApiResponse.unauthorized('Token không hợp lệ hoặc đã hết hạn.');
      }

      let managerNote: string | undefined;
      try {
        const body = await request.json();
        managerNote = body?.managerNote;
      } catch (e) {
        // Body có thể để trống
      }

      const response = await PriceChangeService.rejectRequest(
        requestId,
        userPayload.userId,
        managerNote
      );
      return ApiResponse.success(response, 'Đã từ chối yêu cầu thay đổi giá.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi từ chối yêu cầu đổi giá.', 400);
    }
  }
}

export default PriceChangeController;

