import { NextRequest } from 'next/server';
import AuthService from '@/auth/service/AuthService';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';

/**
 * Controller xử lý các API liên quan đến xác thực (Authentication).
 * Tương ứng 1:1 với com.drivelinker.auth.controller.AuthController trong Java.
 */
export class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(request: NextRequest) {
    try {
      const body = await request.json();
      const responseData = await AuthService.login(body);
      return ApiResponse.success(responseData);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Đăng nhập thất bại.', 400);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(request: NextRequest) {
    try {
      const authHeader = request.headers.get('authorization');
      const token = JwtService.getTokenFromHeader(authHeader);

      if (!token) {
        return ApiResponse.forbidden('Chưa xác thực người dùng.');
      }

      const user = await JwtService.extractUser(token);
      if (!user) {
        return ApiResponse.forbidden('Token không hợp lệ hoặc đã hết hạn.');
      }

      const responseData = await AuthService.getMe(user.userId);
      return ApiResponse.success(responseData);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi xử lý yêu cầu.', 400);
    }
  }
}

export default AuthController;

