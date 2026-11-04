import extractAuth from '@/common/security/authHelper';
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
  private static async extractAuth(request: NextRequest) {
    return extractAuth(request);
  }

  /**
   * POST /api/vehicles
   */
  static async createVehicle(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const body = await request.json();
      const response = await VehicleService.createVehicle(body, user.organizationId);
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
      const user = await this.extractAuth(request);
      const list = await VehicleService.getAllVehicle(user.organizationId);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải danh sách phương tiện.', 400);
    }
  }

  /**
   * GET /api/vehicles/[id]
   */
  static async getVehicleById(request: NextRequest, id: number | string) {
    try {
      const user = await this.extractAuth(request);
      const vehicle = await VehicleService.getVehicleById(Number(id), user.organizationId);
      return ApiResponse.success(vehicle);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải chi tiết phương tiện.', 400);
    }
  }

  /**
   * PUT /api/vehicles/[id]
   */
  static async updateVehicle(request: NextRequest, id: number | string) {
    try {
      const user = await this.extractAuth(request);
      const body = await request.json();
      const updated = await VehicleService.updateVehicle(id, body, user.organizationId);
      return ApiResponse.success(updated, 'Cập nhật thông tin phương tiện thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi cập nhật phương tiện.', 400);
    }
  }

  /**
   * DELETE /api/vehicles/[id]
   */
  static async deleteVehicle(request: NextRequest, id: number | string) {
    try {
      const user = await this.extractAuth(request);
      await VehicleService.deleteVehicle(id, user.organizationId);
      return ApiResponse.success(null, 'Đã xóa phương tiện khỏi hệ thống.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xóa phương tiện.', 400);
    }
  }

  /**
   * POST /api/vehicles/[id]/inspect (BE-4)
   */
  static async inspectVehicle(request: NextRequest, id: number | string) {
    try {
      const user = await this.extractAuth(request);
      const body = await request.json();
      const result = body.result || 'PASS';
      const notes = body.notes || '';
      const response = await VehicleService.inspectVehicle(id, result, notes, user.organizationId);
      return ApiResponse.success(response, 'Nghiệm thu kỹ thuật phương tiện thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi nghiệm thu phương tiện.', 400);
    }
  }
}

export default VehicleController;
