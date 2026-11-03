import { NextRequest, NextResponse } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import AnalyticsService from '@/analytics/service/AnalyticsService';

export class AnalyticsController {
  private static async extractAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = JwtService.getTokenFromHeader(authHeader);
    if (!token) throw new Error('Chưa xác thực người dùng.');

    const user = await JwtService.extractUser(token);
    if (!user) throw new Error('Token không hợp lệ hoặc đã hết hạn.');

    return user;
  }

  /**
   * GET /api/analytics/events
   */
  static async getEvents(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const { searchParams } = new URL(request.url);

      const date = searchParams.get('date') || undefined;
      const status = searchParams.get('status') || undefined;
      const severity = searchParams.get('severity') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

      const events = await AnalyticsService.getEvents(user.organizationId, {
        date,
        status,
        severity,
        limit,
      });

      return ApiResponse.success(events);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải danh sách sự kiện vi phạm.', 400);
    }
  }

  /**
   * GET /api/analytics/kpis
   */
  static async getKpis(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date') || undefined;

      const kpis = await AnalyticsService.getKpis(user.organizationId, date);
      return ApiResponse.success(kpis);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tính toán chỉ số an toàn.', 400);
    }
  }

  /**
   * GET /api/analytics/export
   */
  static async exportCsv(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date') || undefined;

      const csvData = await AnalyticsService.exportEventsCsv(user.organizationId, date);

      const filename = `drivelinker_analytics_${date || 'all'}.csv`;

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xuất báo cáo CSV.', 400);
    }
  }
}

export default AnalyticsController;

