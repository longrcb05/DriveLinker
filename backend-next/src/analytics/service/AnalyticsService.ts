import prisma from '@/lib/prisma';

export class AnalyticsService {
  /**
   * Lấy danh sách sự kiện vi phạm / cảnh báo an toàn lọc theo ngày, trạng thái, mức độ.
   */
  static async getEvents(
    organizationId: number,
    options: {
      date?: string;
      status?: string;
      severity?: string;
      limit?: number;
    } = {}
  ) {
    const { date, status, severity, limit = 100 } = options;

    const whereClause: any = {
      organizationId,
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.occurredAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status && status !== 'ALL') {
      whereClause.resolutionStatus = status;
    }

    if (severity && severity !== 'ALL') {
      whereClause.severityLevel = severity;
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            model: true,
            brand: true,
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    return alerts.map((alert) => ({
      id: Number(alert.id),
      eventId: alert.eventId,
      vehicleId: alert.vehicleId,
      plateNumber: alert.vehicle?.licensePlate || 'N/A',
      vehicleModel: alert.vehicle
        ? `${alert.vehicle.brand || ''} ${alert.vehicle.model || ''}`.trim()
        : 'N/A',
      alertType: alert.alertType,
      severity: alert.severityLevel,
      status: alert.resolutionStatus,
      drowsinessScore: alert.drowsinessScore,
      latitude: alert.latitude,
      longitude: alert.longitude,
      timestamp: alert.occurredAt.toISOString(),
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
      resolvedBy: alert.resolver
        ? alert.resolver.fullName
        : alert.resolvedBy
        ? `User #${alert.resolvedBy}`
        : null,
      resolutionNote: alert.resolutionNote,
    }));
  }

  /**
   * Tính toán chỉ số hiệu suất an toàn (KPIs).
   */
  static async getKpis(organizationId: number, date?: string) {
    const whereClause: any = { organizationId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.occurredAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      select: {
        id: true,
        severityLevel: true,
        resolutionStatus: true,
        alertType: true,
      },
    });

    const totalViolations = alerts.length;
    const resolvedCount = alerts.filter((a) => a.resolutionStatus === 'RESOLVED').length;
    const pendingCount = totalViolations - resolvedCount;
    const resolutionRate =
      totalViolations > 0 ? Math.round((resolvedCount / totalViolations) * 100) : 100;

    const criticalCount = alerts.filter((a) => a.severityLevel === 'CRITICAL').length;
    const highCount = alerts.filter((a) => a.severityLevel === 'HIGH').length;
    const mediumCount = alerts.filter((a) => a.severityLevel === 'MEDIUM').length;
    const lowCount = alerts.filter((a) => a.severityLevel === 'LOW').length;

    // Tính điểm số an toàn (Safety Score) trên thang 100
    const scoreDeduction =
      criticalCount * 15 + highCount * 10 + mediumCount * 5 + lowCount * 2;
    const safetyScore = Math.max(0, 100 - scoreDeduction);

    // Phân bố loại vi phạm
    const typeCounts: Record<string, number> = {};
    for (const a of alerts) {
      typeCounts[a.alertType] = (typeCounts[a.alertType] || 0) + 1;
    }

    return {
      safetyScore,
      totalViolations,
      resolvedCount,
      pendingCount,
      resolutionRate,
      severityBreakdown: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      typeBreakdown: typeCounts,
    };
  }

  /**
   * Xuất danh sách sự kiện ra định dạng CSV UTF-8.
   */
  static async exportEventsCsv(organizationId: number, date?: string) {
    const events = await this.getEvents(organizationId, { date, limit: 1000 });

    const headers = [
      'ID',
      'Mã Sự Kiện',
      'Biển số',
      'Dòng xe',
      'Loại vi phạm',
      'Mức độ',
      'Trạng thái',
      'Thời gian ghi nhận',
      'Thời gian xử lý',
      'Người xử lý',
      'Ghi chú',
    ];

    const rows = events.map((e) => [
      e.id,
      `"${e.eventId}"`,
      `"${e.plateNumber}"`,
      `"${e.vehicleModel}"`,
      `"${e.alertType}"`,
      `"${e.severity}"`,
      `"${e.status}"`,
      `"${e.timestamp}"`,
      `"${e.resolvedAt || ''}"`,
      `"${e.resolvedBy || ''}"`,
      `"${(e.resolutionNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return csvContent;
  }
}

export default AnalyticsService;
