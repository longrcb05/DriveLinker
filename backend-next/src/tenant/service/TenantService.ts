import prisma from '@/lib/prisma';

export class TenantService {
  /**
   * Đổi mã công ty (Company Code) của doanh nghiệp.
   */
  static async updateCompanyCode(organizationId: number, newCode: string, userId: number) {
    const formattedCode = newCode.trim().toUpperCase();

    if (!formattedCode || formattedCode.length < 4) {
      throw new Error('Mã doanh nghiệp phải chứa ít nhất 4 ký tự.');
    }

    const existing = await prisma.organization.findUnique({
      where: { companyCode: formattedCode },
    });

    if (existing && existing.id !== organizationId) {
      throw new Error(`Mã doanh nghiệp "${formattedCode}" đã được sử dụng bởi công ty khác.`);
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: { companyCode: formattedCode },
    });

    // Ghi nhật ký hệ thống (Audit Log)
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'ĐỔI MÃ CÔNG TY',
        entityType: 'ORGANIZATION',
        entityId: String(organizationId),
        metadata: JSON.stringify({ newCode: formattedCode }),
      },
    });

    return updatedOrg;
  }

  /**
   * Lấy danh sách thiết bị duyệt Web/App của nhân sự công ty.
   */
  static async getAccessDevices(organizationId: number) {
    const devices = await prisma.userAccessDevice.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { lastLoginAt: 'desc' },
    });

    return devices.map((d) => ({
      id: Number(d.id),
      userId: d.userId,
      userName: d.user?.fullName || d.user?.username || 'Nhân viên',
      userRole: d.user?.role?.name || 'STAFF',
      deviceName: d.deviceName,
      deviceType: d.deviceType,
      os: d.os || 'Windows 11',
      browser: d.browser || 'Chrome',
      ipAddress: d.ipAddress,
      deviceFingerprint: d.deviceFingerprint,
      status: d.status,
      lastLoginAt: d.lastLoginAt,
    }));
  }

  /**
   * Phê duyệt hoặc khóa thiết bị truy cập của người dùng.
   */
  static async updateDeviceStatus(deviceId: number, status: string, organizationId: number, userId: number) {
    const validStatuses = ['APPROVED', 'LOCKED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái thiết bị không hợp lệ (APPROVED, LOCKED, PENDING).');
    }

    const device = await prisma.userAccessDevice.findUnique({
      where: { id: BigInt(deviceId) },
    });

    if (!device || device.organizationId !== organizationId) {
      throw new Error('Không tìm thấy thiết bị hoặc không có quyền truy cập.');
    }

    const updated = await prisma.userAccessDevice.update({
      where: { id: BigInt(deviceId) },
      data: { status },
    });

    // Ghi Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: status === 'APPROVED' ? 'PHÊ DUYỆT THIẾT BỊ' : 'KHÓA THIẾT BỊ',
        entityType: 'USER_ACCESS_DEVICE',
        entityId: String(deviceId),
        metadata: JSON.stringify({ deviceName: updated.deviceName, newStatus: status }),
      },
    });

    return {
      id: Number(updated.id),
      status: updated.status,
      deviceName: updated.deviceName,
    };
  }

  /**
   * Lấy danh sách lịch sử thao tác & nhật ký an toàn của doanh nghiệp.
   */
  static async getAuditLogs(organizationId: number) {
    const logs = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: Number(log.id),
      organizationId: log.organizationId,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }
}

export default TenantService;

