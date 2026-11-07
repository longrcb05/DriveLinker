import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import TrackingService from '@/tracking/service/TrackingService';

export class TrackingController {
  private static async extractAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = JwtService.getTokenFromHeader(authHeader);
    if (!token) throw new Error('Chưa xác thực người dùng.');

    const user = await JwtService.extractUser(token);
    if (!user) throw new Error('Token không hợp lệ hoặc đã hết hạn.');

    return user;
  }

  /**
   * GET /api/tracking/kpi
   */
  static async getKpi(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const kpi = await TrackingService.getKpi(user.organizationId);
      return ApiResponse.success(kpi);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy thông tin KPI giám sát.', 400);
    }
  }

  /**
   * GET /api/tracking/positions
   */
  static async getPositions(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const positions = await TrackingService.getPositions(user.organizationId);
      return ApiResponse.success(positions);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy vị trí phương tiện thời gian thực.', 400);
    }
  }
}

export default TrackingController;

