import { NextRequest } from 'next/server';
import JwtService from '@/common/security/JwtService';
import prisma from '@/lib/prisma';

export interface AuthContext {
  userId: number;
  username: string;
  role: string;
  organizationId: number;
  companyCode?: string;
}

/**
 * Hàm phân giải quyền và định danh Tenant thông minh, hỗ trợ đa doanh nghiệp:
 * 1. Ưu tiên giải mã Bearer Token JWT nếu có.
 * 2. Nếu chưa có Bearer Token (phiên demo local), nhận diện qua header X-Tenant-Code hoặc X-Tenant-ID.
 * 3. Fallback an toàn về Doanh nghiệp mẫu CTA2026 (id: 2).
 */
export async function extractAuth(request: NextRequest): Promise<AuthContext> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = JwtService.getTokenFromHeader(authHeader);
    if (token) {
      const user = await JwtService.extractUser(token);
      if (user && user.organizationId && !isNaN(Number(user.organizationId))) {
        return {
          userId: Number(user.userId) || 1,
          username: user.username || 'user',
          role: user.role || 'ADMIN',
          organizationId: Number(user.organizationId),
          companyCode: user.companyCode || 'CTA2026',
        };
      } else if (user && user.username) {
        // Token có thông tin user nhưng thiếu organizationId -> truy vấn lại DB
        try {
          const dbUser = await prisma.user.findFirst({
            where: { username: user.username },
            include: { organization: true, role: true },
          });
          if (dbUser) {
            return {
              userId: dbUser.id,
              username: dbUser.username,
              role: dbUser.role?.name || 'ADMIN',
              organizationId: dbUser.organizationId,
              companyCode: dbUser.organization?.companyCode || 'CTA2026',
            };
          }
        } catch (_) {}
      }
    }

    const tenantCode = request.headers.get('x-tenant-code');
    const tenantIdHeader = request.headers.get('x-tenant-id');

    let org = null;
    if (tenantCode) {
      org = await prisma.organization.findFirst({
        where: { companyCode: tenantCode.trim().toUpperCase() },
      });
    }

    if (!org && tenantIdHeader) {
      const codeMap: Record<string, string> = {
        COMPANY_A: 'CTA2026',
        TENANT_CTYA: 'CTA2026',
        COMPANY_B: 'CTB2026',
        TENANT_CTYB: 'CTB2026',
        COMPANY_C: 'CTC2026',
        TENANT_CTYC: 'CTC2026',
      };
      const code = codeMap[tenantIdHeader.trim()] || tenantIdHeader.trim();
      org = await prisma.organization.findFirst({
        where: { companyCode: code },
      });
    }

    if (!org) {
      org =
        (await prisma.organization.findFirst({
          where: { companyCode: 'CTA2026' },
        })) || (await prisma.organization.findFirst());
    }

    const orgId = org ? org.id : 2;
    const companyCode = org ? org.companyCode : 'CTA2026';

    return {
      userId: 1,
      username: 'owner.an',
      role: 'ADMIN',
      organizationId: Number(orgId) || 2,
      companyCode: companyCode,
    };
  } catch (err) {
    return {
      userId: 1,
      username: 'owner.an',
      role: 'ADMIN',
      organizationId: 2,
      companyCode: 'CTA2026',
    };
  }
}

export default extractAuth;

