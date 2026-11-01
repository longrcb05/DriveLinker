import { NextRequest } from 'next/server';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import CustomerService from '@/customer/service/CustomerService';
import prisma from '@/lib/prisma';

/**
 * Controller xử lý các API quản lý thông tin Khách hàng.
 * Tương ứng 1:1 với com.drivelinker.customer.controller.CustomerController trong Java.
 */
export class CustomerController {
  /**
   * POST /api/customers
   */
  static async createCustomer(request: NextRequest) {
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

      const currentUser = await prisma.user.findUnique({
        where: { id: userPayload.userId },
        include: { organization: true },
      });

      if (!currentUser) {
        return ApiResponse.notFound('Không tìm thấy User');
      }

      const body = await request.json();
      const response = await CustomerService.createCustomer(body, currentUser.organizationId);
      return ApiResponse.success(response);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tạo khách hàng.', 400);
    }
  }

  /**
   * GET /api/customers
   */
  static async getAllCustomer(request: NextRequest) {
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

      const list = await CustomerService.getAllCustomer(userPayload.organizationId);
      return ApiResponse.success(list);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải danh sách khách hàng.', 400);
    }
  }

  /**
   * GET /api/customers/[id]
   */
  static async getCustomerById(request: NextRequest, id: number) {
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

      const customer = await CustomerService.getCustomerById(id, userPayload.organizationId);
      return ApiResponse.success(customer);
    } catch (error: any) {
      return ApiResponse.error(error.message || 'Lỗi tải chi tiết khách hàng.', 400);
    }
  }
}

export default CustomerController;
