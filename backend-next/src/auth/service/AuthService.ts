import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import JwtService from '@/common/security/JwtService';
import { LoginRequest } from '@/auth/dto/LoginRequest';
import { AuthResponse } from '@/auth/dto/AuthResponse';
import { UserMeResponse } from '@/auth/dto/UserMeResponse';

/**
 * Service xử lý nghiệp vụ xác thực.
 * Tương ứng com.drivelinker.auth.service.AuthService trong Java.
 */
export class AuthService {
  static async login(request: LoginRequest): Promise<AuthResponse> {
    const { companyCode, username, password } = request;

    if (!companyCode || !username || !password) {
      throw new Error('Vui lòng kiểm tra lại thông tin.');
    }

    const org = await prisma.organization.findUnique({
      where: { companyCode: companyCode.trim() },
    });

    if (!org) {
      throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }

    if (org.status !== 'ACTIVE') {
      throw new Error('Tổ chức đã bị vô hiệu hóa.');
    }

    const user = await prisma.user.findUnique({
      where: {
        uq_users_org_username: {
          organizationId: org.id,
          username: username.trim(),
        },
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error('Đăng nhập thất bại.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị vô hiệu hóa.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Đăng nhập thất bại.');
    }

    const jwtToken = await JwtService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      organizationId: org.id,
      companyCode: org.companyCode,
    });

    return new AuthResponse(jwtToken, user.username, user.role.name, org.id);
  }

  static async getMe(userId: number): Promise<UserMeResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('Không tìm thấy User');
    }

    return new UserMeResponse(
      user.id,
      user.username,
      user.fullName,
      user.email,
      user.phone,
      user.role.name,
      user.organization.id,
      user.organization.companyCode,
      user.organization.name,
      user.status
    );
  }
}

export default AuthService;

