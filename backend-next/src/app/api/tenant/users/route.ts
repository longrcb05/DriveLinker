import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';
import bcrypt from 'bcryptjs';



export async function GET(request: NextRequest) {
  try {
    const authUser = await extractAuth(request);
    const users = await prisma.user.findMany({
      where: { organizationId: authUser.organizationId },
      include: {
        role: true,
      },
      orderBy: { id: 'asc' },
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role?.name || 'STAFF',
      status: u.status,
      createdAt: u.createdAt,
    }));

    return ApiResponse.success(sanitized);
  } catch (error: any) {
    return ApiResponse.error(error.message || 'Lỗi tải danh sách tài khoản.', 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await extractAuth(request);
    const body = await request.json();

    const username = body.username?.trim();
    const fullName = body.fullName?.trim() || body.name?.trim();
    const password = body.password?.trim() || '123456';
    const email = body.email?.trim() || `${username}@cta2026.com`;
    const phone = body.phone?.trim() || '';
    const roleName = body.role === 'ADMIN' || body.role === 'TENANT_ADMIN' ? 'ADMIN' : 'STAFF';

    if (!username || !fullName) {
      return ApiResponse.error('Tên đăng nhập và Họ tên không được để trống.', 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        organizationId: authUser.organizationId,
        username,
      },
    });

    if (existingUser) {
      return ApiResponse.error(`Tên tài khoản "${username}" đã tồn tại trong doanh nghiệp.`, 400);
    }

    // Lấy hoặc tạo role
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleName } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        organizationId: authUser.organizationId,
        roleId: role.id,
        username,
        passwordHash,
        fullName,
        email,
        phone,
        status: 'ACTIVE',
      },
      include: { role: true },
    });

    return ApiResponse.success({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role.name,
      status: newUser.status,
    }, 'Tạo tài khoản nhân viên thành công.');
  } catch (error: any) {
    return ApiResponse.error(error.message || 'Lỗi tạo tài khoản.', 400);
  }
}

