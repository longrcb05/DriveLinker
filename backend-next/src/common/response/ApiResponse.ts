import { NextResponse } from 'next/server';

/**
 * Lớp chuẩn hóa cấu trúc dữ liệu trả về cho mọi API (success, message, data).
 * Tương ứng 1:1 với com.drivelinker.common.response.ApiResponse trong Java.
 */
export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export class ApiResponse {
  static success<T>(data: T, message: string = 'Success', status: number = 200): NextResponse<StandardApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status }
    );
  }

  static error(message: string, status: number = 400): NextResponse<StandardApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        message,
        data: null,
      },
      { status }
    );
  }

  static unauthorized(message: string = 'Chưa xác thực hoặc Token không hợp lệ.'): NextResponse<StandardApiResponse<null>> {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Bạn không có quyền thực hiện thao tác này.'): NextResponse<StandardApiResponse<null>> {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Không tìm thấy dữ liệu yêu cầu.'): NextResponse<StandardApiResponse<null>> {
    return this.error(message, 404);
  }
}

export default ApiResponse;

