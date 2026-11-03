import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import DeviceAuthenticationFilter from '@/common/security/DeviceAuthenticationFilter';
import JwtService from '@/common/security/JwtService';
import AlertService from '@/alert/service/AlertService';

/**
 * Controller tiếp nhận dữ liệu Cảnh báo (Alerts) từ IoT và cung cấp API cho Web Frontend.
 * Tương ứng 1:1 với com.drivelinker.alert.controller.AlertController trong Java.
 */
export class AlertController {
  /**
   * POST /api/iot/alerts (Từ phần cứng IoT)
   */
  static async receiveAlert(request: NextRequest) {
    try {
      const deviceContext = await DeviceAuthenticationFilter.authenticate(request);
      const body = await request.json();

      await AlertService.saveAlert(body, deviceContext.deviceId);

      return ApiResponse.success('Đã ghi nhận cảnh báo thành công');
    } catch (error: any) {
      const statusCode = error.message.includes('Header') || error.message.includes('Token') ? 401 : 400;
      return ApiResponse.error(error.message || 'Lỗi tiếp nhận cảnh báo.', statusCode);
    }
  }

  /**
   * GET /api/alerts (Cho Web Frontend lấy danh sách cảnh báo)
   */
  static async getAlerts(request: NextRequest) {
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
      const status = searchParams.get('status') || undefined;

      const list = await AlertService.getAlerts(userPayload.organizationId, status);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải danh sách cảnh báo.', 400);
    }
  }

  /**
   * POST /api/alerts/[id]/resolve (Nhân viên Web bấm xử lý cảnh báo)
   */
  static async resolveAlert(request: NextRequest, alertId: string) {
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

      let note: string | undefined;
      let action: string | undefined;
      try {
        const body = await request.json();
        note = body?.note;
        action = body?.action;
      } catch (e) {
        // Body có thể để trống
      }

      const updated = await AlertService.resolveAlert(
        alertId,
        userPayload.userId,
        note,
        action
      );
      return ApiResponse.success(updated, 'Đã xử lý cảnh báo thành công.');
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xử lý cảnh báo.', 400);
    }
  }
}

export default AlertController;
