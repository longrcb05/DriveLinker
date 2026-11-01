import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import DeviceAuthenticationFilter from '@/common/security/DeviceAuthenticationFilter';
import AiResultService from '@/ai/service/AiResultService';

/**
 * Controller tiếp nhận kết quả phân tích AI từ thiết bị Edge IoT.
 * Tương ứng 1:1 với com.drivelinker.ai.controller.AiResultController trong Java.
 */
export class AiResultController {
  /**
   * POST /api/iot/ai-results
   */
  static async receiveAiResult(request: NextRequest) {
    try {
      const deviceContext = await DeviceAuthenticationFilter.authenticate(request);
      const body = await request.json();

      await AiResultService.saveAiResult(body, deviceContext.deviceId);

      return ApiResponse.success('Đã ghi nhận kết quả AI thành công');
    } catch (error: any) {
      const statusCode = error.message.includes('Header') || error.message.includes('Token') ? 401 : 400;
      return ApiResponse.error(error.message || 'Lỗi tiếp nhận kết quả AI.', statusCode);
    }
  }
}

export default AiResultController;

