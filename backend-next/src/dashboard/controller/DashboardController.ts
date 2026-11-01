import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import DashboardService from '@/dashboard/service/DashboardService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý các API Dashboard và biểu đồ hành trình xe.
 * Tương ứng 1:1 với com.drivelinker.dashboard.controller.DashboardController trong Java.
 */
export class DashboardController {
  /**
   * GET /api/dashboard/summary
   */
  static async getSummary(request: NextRequest) {
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

      const summary = await DashboardService.getSummary(currentUser.organizationId);
      return ApiResponse.success(summary);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải thống kê Dashboard.', 400);
    }
  }

  /**
   * GET /api/dashboard/vehicles/[id]/journey?from=...&to=...
   */
  static async getJourney(request: NextRequest, vehicleId: number) {
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
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');

      if (!fromParam || !toParam) {
        return ApiResponse.error('Vui lòng cung cấp đầy đủ tham số from và to (ISO 8601).', 400);
      }

      const from = new Date(fromParam);
      const to = new Date(toParam);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return ApiResponse.error('Định dạng thời gian from hoặc to không hợp lệ.', 400);
      }

      const journey = await DashboardService.getVehicleJourney(vehicleId, from, to);
      return ApiResponse.success(journey);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy hành trình xe.', 400);
    }
  }
}

export default DashboardController;

