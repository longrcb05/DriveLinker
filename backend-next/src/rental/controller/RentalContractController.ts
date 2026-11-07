import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import RentalContractService from '@/rental/service/RentalContractService';

/**
 * Controller xử lý các API quản lý Hợp đồng thuê xe và bàn giao xe.
 * Toàn bộ các API đều yêu cầu xác thực JWT.
 * Tương ứng 1:1 với com.drivelinker.rental.controller.RentalContractController trong Java.
 */
export class RentalContractController {
  /**
   * POST /api/contracts
   */
  static async createContract(request: NextRequest) {
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
      const response = await RentalContractService.createContract(body, userPayload.userId);
      return ApiResponse.success(response);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lập hợp đồng thuê xe.', 400);
    }
  }

  /**
   * GET /api/contracts
   */
  static async getAllContracts(request: NextRequest) {
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

      const list = await RentalContractService.getAllContracts(userPayload.organizationId, status);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy danh sách hợp đồng.', 400);
    }
  }

  /**
   * GET /api/contracts/[id]
   */
  static async getContractById(request: NextRequest, id: number) {
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

      const contract = await RentalContractService.getContractById(id, userPayload.organizationId);
      return ApiResponse.success(contract);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy chi tiết hợp đồng.', 400);
    }
  }

  /**
   * POST /api/contracts/[id]/confirm
   */
  static async confirmContract(request: NextRequest, id: number) {
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

      await RentalContractService.confirmContract(id);
      return ApiResponse.success(null, 'Xác nhận hợp đồng thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xác nhận hợp đồng.', 400);
    }
  }

  /**
   * POST /api/contracts/[id]/handover
   */
  static async handoverVehicle(request: NextRequest, id: number) {
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

      await RentalContractService.handoverVehicle(id);
      return ApiResponse.success(null, 'Bàn giao xe thành công. Đã kích hoạt phiên giám sát.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi bàn giao xe.', 400);
    }
  }

  /**
   * POST /api/contracts/[id]/return
   */
  static async returnVehicle(request: NextRequest, id: number) {
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

      await RentalContractService.returnVehicle(id);
      return ApiResponse.success(null, 'Nhận lại xe thành công. Đã đóng phiên giám sát.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi trả xe.', 400);
    }
  }
}

export default RentalContractController;
