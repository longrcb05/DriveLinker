import prisma from '@/lib/prisma';
import { DashboardSummaryResponse } from '@/dashboard/dto/DashboardSummaryResponse';
import { JourneyPointDto } from '@/dashboard/dto/JourneyPointDto';

/**
 * Service chứa logic thống kê dữ liệu Dashboard và lịch sử hành trình.
 * Tương ứng 1:1 với com.drivelinker.dashboard.service.DashboardService trong Java.
 */
export class DashboardService {
  public static async getSummary(orgId: number): Promise<DashboardSummaryResponse> {
    const [
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      activeContracts,
      activeAlerts,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { organizationId: orgId },
      }),
      prisma.vehicle.count({
        where: { organizationId: orgId, status: 'AVAILABLE' },
      }),
      prisma.vehicle.count({
        where: { organizationId: orgId, status: 'RENTED' },
      }),
      prisma.vehicle.count({
        where: { organizationId: orgId, status: 'MAINTENANCE' },
      }),
      prisma.rentalContract.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),
      prisma.alert.count({
        where: { organizationId: orgId, resolutionStatus: 'NEW' },
      }),
    ]);

    const res = new DashboardSummaryResponse();
    res.totalVehicles = totalVehicles;
    res.availableVehicles = availableVehicles;
    res.rentedVehicles = rentedVehicles;
    res.maintenanceVehicles = maintenanceVehicles;
    res.activeContracts = activeContracts;
    res.activeAlerts = activeAlerts;

    return res;
  }

  public static async getVehicleJourney(
    vehicleId: number,
    from: Date,
    to: Date
  ): Promise<JourneyPointDto[]> {
    const logs = await prisma.gpsLog.findMany({
      where: {
        vehicleId,
        recordedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });

    return logs.map((log) => {
      const point = new JourneyPointDto();
      point.latitude = log.latitude;
      point.longitude = log.longitude;
      point.speed = log.speed;
      point.recordedAt = log.recordedAt;
      return point;
    });
  }
}

export default DashboardService;

