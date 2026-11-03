import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import CoreAdminService from '@/core/service/CoreAdminService';

export class CoreAdminController {
  private static async extractAdmin(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = JwtService.getTokenFromHeader(authHeader);
    if (!token) throw new Error('Chưa xác thực quyền Quản trị viên nền tảng.');

    const user = await JwtService.extractUser(token);
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new Error('Yêu cầu quyền Super Admin để thực hiện thao tác này.');
    }

    return user;
  }

  /**
   * POST /api/core/auth/login
   */
  static async login(request: NextRequest) {
    try {
      const body = await request.json();
      const { username, password } = body;
      const result = await CoreAdminService.login(username, password);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Đăng nhập Core Admin thất bại.', 401);
    }
  }

  /**
   * GET /api/core/tenants
   */
  static async getTenants(request: NextRequest) {
    try {
      await this.extractAdmin(request);
      const tenants = await CoreAdminService.getTenants();
      return ApiResponse.success(tenants);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy danh sách doanh nghiệp.', 403);
    }
  }

  /**
   * POST /api/core/tenants
   */
  static async createTenant(request: NextRequest) {
    try {
      await this.extractAdmin(request);
      const body = await request.json();
      const tenant = await CoreAdminService.createTenant(body);
      return ApiResponse.success(tenant, 'Tạo doanh nghiệp thành công', 201);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi khởi tạo doanh nghiệp mới.', 400);
    }
  }

  /**
   * POST /api/core/tenants/[id]/impersonate
   */
  static async impersonate(request: NextRequest, tenantIdStr: string) {
    try {
      const admin = await this.extractAdmin(request);
      const tenantId = parseInt(tenantIdStr, 10);
      if (isNaN(tenantId)) {
        return ApiResponse.error('Mã doanh nghiệp không hợp lệ.', 400);
      }

      const result = await CoreAdminService.impersonate(tenantId, admin.userId);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tạo phiên nhập vai doanh nghiệp.', 403);
    }
  }

  /**
   * GET /api/core/patches
   */
  static async getPatches(request: NextRequest) {
    try {
      await this.extractAdmin(request);
      const patches = await CoreAdminService.getPatches();
      return ApiResponse.success(patches);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi lấy danh sách System Patches.', 403);
    }
  }

  /**
   * POST /api/core/sync-production
   */
  static async syncProduction(request: NextRequest) {
    try {
      const admin = await this.extractAdmin(request);
      const body = await request.json();
      const result = await CoreAdminService.syncProduction(admin.userId, body);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi đồng bộ cấu hình Production.', 400);
    }
  }
}

export default CoreAdminController;
