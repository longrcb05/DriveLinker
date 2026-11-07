import prisma from '@/lib/prisma';

export class TrackingService {
  /**
   * Tính toán các chỉ số vận hành Live Tracking (KPIs).
   */
  static async getKpi(organizationId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId },
      select: {
        id: true,
        movementStatus: true,
        status: true,
        lastSeenAt: true,
        lastSpeed: true,
      },
    });

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    let rollingCount = 0;
    let stoppedCount = 0;
    let parkedCount = 0;
    let offlineCount = 0;

    for (const v of vehicles) {
      const isOnline = v.lastSeenAt && v.lastSeenAt >= tenMinutesAgo;
      if (!isOnline) {
        offlineCount++;
      } else if (v.movementStatus === 'MOVING' || (v.lastSpeed && v.lastSpeed > 0)) {
        rollingCount++;
      } else if (v.movementStatus === 'STOPPED') {
        stoppedCount++;
      } else {
        parkedCount++;
      }
    }

    const activeAlertsCount = await prisma.alert.count({
      where: {
        organizationId,
        resolutionStatus: 'NEW',
      },
    });

    return {
      totalVehicles: vehicles.length,
      rollingCount,
      stoppedCount,
      parkedCount,
      offlineCount,
      activeAlertsCount,
    };
  }

  /**
   * Lấy vị trí thời gian thực và thông tin chi tiết các phương tiện.
   */
  static async getPositions(organizationId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId },
      include: {
        devices: {
          select: {
            id: true,
            deviceCode: true,
            status: true,
            deviceType: true,
          },
        },
        rentalContracts: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { licensePlate: 'asc' },
    });

    return vehicles.map((v) => {
      const activeContract = v.rentalContracts[0] || null;
      const primaryDevice = v.devices[0] || null;

      return {
        id: v.id,
        plateNumber: v.licensePlate,
        model: v.model || 'N/A',
        make: v.brand || 'N/A',
        vehicleType: v.vehicleType || 'Car',
        status: v.status,
        movementStatus: v.movementStatus || 'STOPPED',
        latitude: v.lastLatitude ? Number(v.lastLatitude) : null,
        longitude: v.lastLongitude ? Number(v.lastLongitude) : null,
        speed: v.lastSpeed ? Number(v.lastSpeed) : 0,
        lastSeenAt: v.lastSeenAt ? v.lastSeenAt.toISOString() : null,
        device: primaryDevice
          ? {
              id: primaryDevice.id,
              serialNumber: primaryDevice.deviceCode,
              status: primaryDevice.status,
              model: primaryDevice.deviceType,
            }
          : null,
        currentContract: activeContract
          ? {
              contractId: activeContract.id,
              contractNumber: `HD-${activeContract.id}`,
              customerName: activeContract.customer?.fullName || 'Khách vãng lai',
              customerPhone: activeContract.customer?.phone || 'N/A',
              startTime: activeContract.startTime.toISOString(),
              endTime: activeContract.endTime.toISOString(),
            }
          : null,
      };
    });
  }
}

export default TrackingService;
