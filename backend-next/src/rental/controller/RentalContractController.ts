import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import RentalContractService from '@/rental/service/RentalContractService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý các API quản lý Hợp đồng thuê xe và bàn giao xe.
 * Tương ứng 1:1 với com.drivelinker.rental.controller.RentalContractController trong Java.
 */
export class RentalContractController {
  private static async extractAuth(request: NextRequest) {
    return extractAuth(request);
  }

  /**
   * POST /api/contracts
   */
  static async createContract(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const body = await request.json();
      const response = await RentalContractService.createContract(body, user.userId);
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
      const user = await this.extractAuth(request);
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || undefined;

      const list = await RentalContractService.getAllContracts(user.organizationId, status);
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
      const user = await this.extractAuth(request);
      const contract = await RentalContractService.getContractById(id, user.organizationId);
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
      await this.extractAuth(request);
      const contract = await RentalContractService.confirmContract(id);
      return ApiResponse.success(contract, 'Xác nhận hợp đồng thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xác nhận hợp đồng.', 400);
    }
  }

  /**
   * POST /api/contracts/[id]/handover
   */
  static async handoverVehicle(request: NextRequest, id: number) {
    try {
      await this.extractAuth(request);
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
      await this.extractAuth(request);
      await RentalContractService.returnVehicle(id);
      return ApiResponse.success(null, 'Nhận lại xe thành công. Đã đóng phiên giám sát.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi trả xe.', 400);
    }
  }

  /**
   * POST /api/contracts/[id]/recall (BE-3 Giai đoạn 1 & 2)
   */
  static async recallVehicle(request: NextRequest, id: number) {
    try {
      await this.extractAuth(request);
      const body = await request.json().catch(() => ({}));
      const result = await RentalContractService.recallVehicle(id, body);
      return ApiResponse.success(result, 'Đã cập nhật biên bản yêu cầu thu hồi phương tiện.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi thu hồi phương tiện.', 400);
    }
  }

  /**
   * PUT /api/contracts/[id]/recall/settle (BE-3 Giai đoạn 3)
   */
  static async settleRecall(request: NextRequest, id: number) {
    try {
      await this.extractAuth(request);
      const body = await request.json().catch(() => ({}));
      const result = await RentalContractService.settleRecall(id, body);
      return ApiResponse.success(result, 'Đã hoàn tất nghiệm thu và quyết toán hợp đồng.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi quyết toán thu hồi phương tiện.', 400);
    }
  }
}

export default RentalContractController;
