import prisma from '@/lib/prisma';
import { ReportAnalyticsResponse } from '@/report/dto/ReportAnalyticsResponse';

/**
 * Service tổng hợp các số liệu báo cáo phân tích cho doanh nghiệp.
 * Tương ứng 1:1 với com.drivelinker.report.service.ReportService trong Java.
 */
export class ReportService {
  public static async getAnalytics(orgId: number): Promise<ReportAnalyticsResponse> {
    const response = new ReportAnalyticsResponse();

    // 1. Hành trình vận chuyển (Trips)
    const [totalTrips, onTimeRows, lateRows] = await Promise.all([
      prisma.rentalContract.count({
        where: { organizationId: orgId },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM rentalcontracts
        WHERE organizationid = ${orgId} AND status = 'COMPLETED' AND actualreturntime <= endtime
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM rentalcontracts
        WHERE organizationid = ${orgId} AND status = 'COMPLETED' AND actualreturntime > endtime
      `,
    ]);

    response.totalTrips = totalTrips;
    response.onTimeTrips = Number(onTimeRows[0]?.count ?? 0);
    response.lateTrips = Number(lateRows[0]?.count ?? 0);

    // 2. Cảnh báo (Alerts)
    const [level1, level2, level3] = await Promise.all([
      prisma.alert.count({
        where: { organizationId: orgId, severityLevel: 'WARNING' },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, severityLevel: 'DANGER' },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, severityLevel: 'CRITICAL' },
      }),
    ]);

    response.level1Alerts = level1;
    response.level2Alerts = level2;
    response.level3Alerts = level3;
    response.totalAlerts = level1 + level2 + level3;

    // 3. Hiệu suất xử lý (Resolution)
    const [resolvedAlerts, newAlerts, processingAlerts] = await Promise.all([
      prisma.alert.count({
        where: { organizationId: orgId, resolutionStatus: 'RESOLVED' },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, resolutionStatus: 'NEW' },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, resolutionStatus: 'PROCESSING' },
      }),
    ]);

    response.resolvedAlerts = resolvedAlerts;
    response.pendingAlerts = newAlerts + processingAlerts;

    // 4. Phân loại theo AlertType
    const typeCounts = await prisma.alert.groupBy({
      by: ['alertType'],
      where: { organizationId: orgId },
      _count: { alertType: true },
    });

    const distribution: Record<string, number> = {};
    for (const item of typeCounts) {
      distribution[item.alertType] = item._count.alertType;
    }
    response.alertTypeDistribution = distribution;

    return response;
  }
}

export default ReportService;

