import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import JwtService from '@/common/security/JwtService';

export class CoreAdminService {
  /**
   * Đăng nhập Super Admin quản trị nền tảng (Platform Core Admin).
   */
  static async login(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.');
    }

    // Tự động khởi tạo tài khoản Super Admin mặc định nếu DB chưa có
    const adminCount = await prisma.coreAdmin.count();
    if (adminCount === 0) {
      const defaultHash = bcrypt.hashSync('Password@123', 10);
      await prisma.coreAdmin.create({
        data: {
          username: 'superadmin',
          passwordHash: defaultHash,
          fullName: 'DriveLinker Root Administrator',
          email: 'admin@drivelinker.vn',
          status: 'ACTIVE',
        },
      });
    }

    const admin = await prisma.coreAdmin.findUnique({
      where: { username },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      throw new Error('Tài khoản quản trị viên không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const isValid = bcrypt.compareSync(password, admin.passwordHash);
    if (!isValid) {
      throw new Error('Mật khẩu không chính xác.');
    }

    // Sinh JWT với quyền Super Admin
    const token = await JwtService.generateToken({
      userId: admin.id,
      username: admin.username,
      role: 'SUPER_ADMIN',
      organizationId: 0,
      companyCode: 'ROOT',
    });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: 'SUPER_ADMIN',
      },
    };
  }

  /**
   * Lấy danh sách toàn bộ các doanh nghiệp (Tenants) trong hệ thống.
   */
  static async getTenants() {
    const tenants = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
            users: true,
            rentalContracts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      companyCode: t.companyCode,
      contactEmail: t.email,
      contactPhone: t.phone,
      address: t.address,
      status: t.status,
      totalVehicles: t._count.vehicles,
      totalUsers: t._count.users,
      totalContracts: t._count.rentalContracts,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /**
   * Tạo doanh nghiệp (Tenant) mới cùng tài khoản Quản trị viên khởi tạo.
   */
  static async createTenant(data: {
    name: string;
    companyCode: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    adminUsername?: string;
    adminPassword?: string;
    adminFullName?: string;
  }) {
    const code = data.companyCode.trim().toUpperCase();

    const existing = await prisma.organization.findUnique({
      where: { companyCode: code },
    });
    if (existing) {
      throw new Error(`Mã doanh nghiệp "${code}" đã tồn tại trên hệ thống.`);
    }

    return await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          companyCode: code,
          email: data.contactEmail || null,
          phone: data.contactPhone || null,
          address: data.address || null,
          status: 'ACTIVE',
        },
      });

      // Tạo tài khoản admin mặc định cho công ty nếu có thông tin
      if (data.adminUsername && data.adminPassword) {
        const adminRole = await tx.role.findFirst({
          where: { name: 'TENANT_ADMIN' },
        });

        const hash = bcrypt.hashSync(data.adminPassword, 10);
        await tx.user.create({
          data: {
            organizationId: org.id,
            roleId: adminRole ? adminRole.id : 1,
            username: data.adminUsername,
            passwordHash: hash,
            fullName: data.adminFullName || `${data.name} Admin`,
            email: data.contactEmail || `${data.adminUsername}@${code.toLowerCase()}.vn`,
            status: 'ACTIVE',
          },
        });
      }

      return org;
    });
  }

  /**
   * Tạo Token Nhập vai (Impersonate) vào một doanh nghiệp cụ thể.
   */
  static async impersonate(tenantId: number, adminId: number) {
    const org = await prisma.organization.findUnique({
      where: { id: tenantId },
    });

    if (!org) {
      throw new Error(`Không tìm thấy doanh nghiệp với ID ${tenantId}.`);
    }

    // Sinh Token mang quyền SUPER_ADMIN_VIEW gắn với Organization ID đó
    const token = await JwtService.generateToken({
      userId: adminId,
      username: `superadmin_view_${org.companyCode}`,
      role: 'SUPER_ADMIN_VIEW',
      organizationId: org.id,
      companyCode: org.companyCode,
    });

    return {
      token,
      tenant: {
        id: org.id,
        name: org.name,
        companyCode: org.companyCode,
      },
    };
  }

  /**
   * Lấy lịch sử các bản vá cấu hình / đồng bộ hệ thống (System Patches).
   */
  static async getPatches() {
    const patches = await prisma.systemPatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return patches.map((p) => ({
      id: Number(p.id),
      patchCode: p.patchCode,
      module: p.module,
      description: p.description,
      configData: p.configData ? JSON.parse(p.configData) : null,
      targetTenantId: p.targetTenantId,
      status: p.status,
      authorAdminId: p.authorAdminId,
      createdAt: p.createdAt.toISOString(),
      appliedAt: p.appliedAt ? p.appliedAt.toISOString() : null,
    }));
  }

  /**
   * Đồng bộ lên Production (Sync Production / System Patch).
   */
  static async syncProduction(
    authorAdminId: number,
    data: {
      patchCode?: string;
      module: string;
      description: string;
      configData?: any;
      targetTenantId?: number;
    }
  ) {
    const patchCode = data.patchCode || `PATCH_${Date.now()}`;

    const patch = await prisma.systemPatch.create({
      data: {
        patchCode,
        module: data.module,
        description: data.description,
        configData: JSON.stringify(data.configData || {}),
        targetTenantId: data.targetTenantId || null,
        status: 'APPLIED',
        authorAdminId,
        appliedAt: new Date(),
      },
    });

    return {
      id: Number(patch.id),
      patchCode: patch.patchCode,
      status: patch.status,
      appliedAt: patch.appliedAt?.toISOString(),
    };
  }
}

export default CoreAdminService;
