import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import DeviceAuthenticationFilter from '@/common/security/DeviceAuthenticationFilter';
import TelemetryService from '@/telemetry/service/TelemetryService';

/**
 * Controller tiếp nhận dữ liệu Telemetry (GPS) từ thiết bị IoT.
 * Tương ứng 1:1 với com.drivelinker.telemetry.controller.TelemetryController trong Java.
 */
export class TelemetryController {
  /**
   * POST /api/iot/telemetry
   */
  static async receiveGpsData(request: NextRequest) {
    try {
      const deviceContext = await DeviceAuthenticationFilter.authenticate(request);
      const body = await request.json();

      await TelemetryService.saveGpsLog(body, deviceContext.deviceId);

      return ApiResponse.success('Đã ghi nhận GPS thành công');
    } catch (error: any) {
      const statusCode = error.message.includes('Header') || error.message.includes('Token') ? 401 : 400;
      return ApiResponse.error(error.message || 'Lỗi tiếp nhận dữ liệu GPS.', statusCode);
    }
  }
}

export default TelemetryController;

