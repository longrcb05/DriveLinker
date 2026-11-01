import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import VehicleService from '@/vehicle/service/VehicleService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý API quản lý Phương tiện (Xe).
 * Tương ứng 1:1 với com.drivelinker.vehicle.controller.VehicleController trong Java.
 */
export class VehicleController {
  /**
   * POST /api/vehicles
   */
  static async createVehicle(request: NextRequest) {
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

      const currentUser = await prisma.user.findUnique({
        where: { id: userPayload.userId },
        include: { organization: true },
      });

      if (!currentUser) {
        return ApiResponse.notFound('Không tìm thấy User');
      }

      const body = await request.json();
      const response = await VehicleService.createVehicle(body, currentUser.organizationId);
      return ApiResponse.success(response);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi thêm phương tiện.', 400);
    }
  }

  /**
   * GET /api/vehicles
   */
  static async getAllVehicles(request: NextRequest) {
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

      const list = await VehicleService.getAllVehicle(userPayload.organizationId);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải danh sách phương tiện.', 400);
    }
  }

  /**
   * GET /api/vehicles/[id]
   */
  static async getVehicleById(request: NextRequest, id: number) {
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

      const vehicle = await VehicleService.getVehicleById(id, userPayload.organizationId);
      return ApiResponse.success(vehicle);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải chi tiết phương tiện.', 400);
    }
  }
}

export default VehicleController;
