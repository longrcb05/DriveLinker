import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import TenantService from '@/tenant/service/TenantService';

export class TenantController {
  private static async extractAuth(request: NextRequest) {
    return extractAuth(request);
  }

  /**
   * PUT /api/tenant/security/code
   */
  static async updateCompanyCode(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      if (user.role !== 'ADMIN' && user.role !== 'TENANT_ADMIN') {
        return ApiResponse.forbidden('Chỉ Quản lý (Admin) mới có quyền đổi mã công ty.');
      }

      const body = await request.json();
      const { newCode } = body;
      if (!newCode) {
        return ApiResponse.error('Vui lòng nhập mã doanh nghiệp mới.', 400);
      }

      const result = await TenantService.updateCompanyCode(user.organizationId, newCode, user.userId);
      return ApiResponse.success({
        message: 'Đổi mã doanh nghiệp thành công!',
        companyCode: result.companyCode,
      });
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi cập nhật mã công ty.', 400);
    }
  }

  /**
   * GET /api/tenant/devices
   */
  static async getAccessDevices(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const devices = await TenantService.getAccessDevices(user.organizationId);
      return ApiResponse.success(devices);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy danh sách thiết bị.', 400);
    }
  }

  /**
   * PUT /api/tenant/devices/[id]/status
   */
  static async updateDeviceStatus(request: NextRequest, deviceId: string) {
    try {
      const user = await this.extractAuth(request);
      if (user.role !== 'ADMIN' && user.role !== 'TENANT_ADMIN') {
        return ApiResponse.forbidden('Chỉ Quản lý mới có quyền phê duyệt/khóa thiết bị.');
      }

      const body = await request.json();
      const { status } = body;
      if (!status) {
        return ApiResponse.error('Vui lòng chỉ định trạng thái mới.', 400);
      }

      const result = await TenantService.updateDeviceStatus(
        Number(deviceId),
        status,
        user.organizationId,
        user.userId
      );
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi cập nhật trạng thái thiết bị.', 400);
    }
  }

  /**
   * GET /api/tenant/logs
   */
  static async getAuditLogs(request: NextRequest) {
    try {
      const user = await this.extractAuth(request);
      const logs = await TenantService.getAuditLogs(user.organizationId);
      return ApiResponse.success(logs);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải nhật ký thao tác.', 400);
    }
  }
}

export default TenantController;

