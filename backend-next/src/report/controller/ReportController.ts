import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import ReportService from '@/report/service/ReportService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý các API báo cáo thống kê vận hành.
 * Tương ứng 1:1 với com.drivelinker.report.controller.ReportController trong Java.
 */
export class ReportController {
  /**
   * GET /api/reports/analytics
   */
  static async getAnalytics(request: NextRequest) {
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

      const report = await ReportService.getAnalytics(currentUser.organizationId);
      return ApiResponse.success(report);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy báo cáo phân tích.', 400);
    }
  }
}

export default ReportController;

