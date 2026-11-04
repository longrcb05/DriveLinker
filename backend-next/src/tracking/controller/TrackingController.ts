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

  /**
   * GET /api/tracking/contracts/[contractId]/evidence
   * Lấy danh sách bằng chứng vi phạm khi xe thuê nhiều ngày, hỗ trợ lọc ngày và phân trang.
   */
  static async getContractEvidence(request: NextRequest, contractIdParam: string) {
    try {
      const user = await this.extractAuth(request);
      const contractId = parseInt(contractIdParam, 10);
      if (isNaN(contractId)) {
        return ApiResponse.error('Mã hợp đồng không hợp lệ.', 400);
      }

      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date') || undefined;
      const alertType = searchParams.get('alertType') || undefined;
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 12;

      const result = await TrackingService.getContractEvidence(user.organizationId, contractId, {
        date,
        alertType,
        page,
        limit,
      });

      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy kho ảnh bằng chứng vi phạm.', 400);
    }
  }

  /**
   * GET /api/tracking/contracts/[contractId]/export-dossier
   * Kết xuất Biên bản đối soát vi phạm (PDF / Printable HTML).
   */
  static async exportDossier(request: NextRequest, contractIdParam: string) {
    try {
      const user = await this.extractAuth(request);
      const contractId = parseInt(contractIdParam, 10);
      if (isNaN(contractId)) {
        return ApiResponse.error('Mã hợp đồng không hợp lệ.', 400);
      }

      const html = await TrackingService.exportDossier(user.organizationId, contractId);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi kết xuất biên bản đối soát vi phạm.', 400);
    }
  }
}

export default TrackingController;
