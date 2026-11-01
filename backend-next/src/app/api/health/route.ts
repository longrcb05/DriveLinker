import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import ApiResponse from '@/common/response/ApiResponse';

/**
 * Endpoint kiểm tra sức khỏe hệ thống và kết nối Cơ sở dữ liệu.
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    // Chạy câu lệnh nhẹ SELECT 1 để kiểm tra kết nối PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    return ApiResponse.success({
      status: 'UP',
      database: 'CONNECTED',
      serverTime: new Date().toISOString(),
      engine: 'Next.js App Router API',
    });
  } catch (error: any) {
    return ApiResponse.error(
      `Không thể kết nối đến Database: ${error.message || 'Lỗi không xác định'}`,
      503
    );
  }
}
