import extractAuth from '@/common/security/authHelper';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import ApiResponse from '@/common/response/ApiResponse';
import JwtService from '@/common/security/JwtService';



export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await extractAuth(request);
    const userId = parseInt(params.id, 10);
    const body = await request.json().catch(() => ({}));

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: authUser.organizationId,
      },
    });

    if (!user) {
      return ApiResponse.error('Không tìm thấy tài khoản nhân viên.', 404);
    }

    const nextStatus = body.status ? body.status : user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status: nextStatus },
      include: { role: true },
    });

    return ApiResponse.success({
      id: updated.id,
      username: updated.username,
      status: updated.status,
    }, `Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${updated.username} thành công.`);
  } catch (error: any) {
    return ApiResponse.error(error.message || 'Lỗi cập nhật trạng thái tài khoản.', 400);
  }
}

