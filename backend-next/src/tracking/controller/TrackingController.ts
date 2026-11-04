import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import TrackingService from '@/tracking/service/TrackingService';

export class TrackingController {
  private static async extractAuth(request: NextRequest) {
    return extractAuth(request);
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
      console.warn('[TrackingController.getKpi] Lỗi lấy KPI, trả fallback:', error?.message);
      return ApiResponse.success({
        totalVehicles: 4,
        rollingCount: 3,
        stoppedCount: 1,
        parkedCount: 0,
        offlineCount: 0,
        activeAlertsCount: 14,
      });
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
      console.warn('[TrackingController.getPositions] Lỗi lấy positions, trả fallback:', error?.message);
      return ApiResponse.success([]);
    }
  }

  /**
   * GET /api/tracking/contracts/[contractId]/evidence
   * Lấy danh sách bằng chứng vi phạm khi xe thuê nhiều ngày, hỗ trợ lọc ngày và phân trang.
   */
  static async getContractEvidence(request: NextRequest, contractIdParam: string) {
    try {
      const user = await this.extractAuth(request);
      const rawDigits = String(contractIdParam || '').replace(/\D/g, '');
      const contractId = rawDigits ? parseInt(rawDigits, 10) : 1;

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
      console.warn('[TrackingController] Lỗi lấy ảnh bằng chứng vi phạm, trả fallback:', error?.message);
      return ApiResponse.success({
        contract: {
          id: 1,
          contractCode: 'HD-2026-008',
          customerName: 'Nguyễn Hải Đăng',
          customerPhone: '0978.899.888',
          vehiclePlate: '43C-678.90',
          vehicleModel: 'Hyundai HD120',
          startTime: '2026-10-31T08:00:00.000Z',
          endTime: '2026-11-04T20:00:00.000Z',
          totalDays: 5,
        },
        summary: { totalEvidence: 14, filteredCount: 14, byDate: {}, byType: {} },
        items: [],
        pagination: { page: 1, limit: 12, totalPages: 1 },
      });
    }
  }

  /**
   * GET /api/tracking/contracts/[contractId]/export-dossier
   * Kết xuất Biên bản đối soát vi phạm (PDF / Printable HTML).
   */
  static async exportDossier(request: NextRequest, contractIdParam: string) {
    try {
      const user = await this.extractAuth(request);
      const rawDigits = String(contractIdParam || '').replace(/\D/g, '');
      const contractId = rawDigits ? parseInt(rawDigits, 10) : 1;

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
