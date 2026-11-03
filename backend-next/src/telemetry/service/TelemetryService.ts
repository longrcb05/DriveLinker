import prisma from '@/lib/prisma';
import { GpsLogRequest } from '@/telemetry/dto/GpsLogRequest';
import { RealtimeTelemetryEvent } from '@/telemetry/dto/RealtimeTelemetryEvent';
import { MonitoringStatus } from '@/monitoring/enums/MonitoringStatus';

/**
 * Service lưu trữ dữ liệu GPS từ thiết bị IoT và cập nhật trạng thái thời gian thực.
 * Tương ứng 1:1 với com.drivelinker.telemetry.service.TelemetryService trong Java.
 */
export class TelemetryService {
  public static async saveGpsLog(request: GpsLogRequest, deviceId: number): Promise<void> {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        vehicle: true,
        organization: true,
      },
    });

    if (!device || !device.vehicle) {
      throw new Error('Thiết bị không tồn tại hoặc chưa được gán vào xe');
    }

    const vehicle = device.vehicle;

    let activeSession = await prisma.monitoringSession.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: MonitoringStatus.ACTIVE,
      },
    });

    // Tự động kích hoạt phiên giám sát nếu chưa có để không làm mất dữ liệu IoT thực tế
    if (!activeSession) {
      const contract =
        (await prisma.rentalContract.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { id: 'desc' },
        })) ||
        (await prisma.rentalContract.findFirst({
          orderBy: { id: 'desc' },
        }));

      if (contract) {
        activeSession = await prisma.monitoringSession.create({
          data: {
            contractId: contract.id,
            vehicleId: vehicle.id,
            startedAt: new Date(),
            status: MonitoringStatus.ACTIVE,
          },
        });
      } else {
        throw new Error('Xe chưa có hợp đồng nào để khởi tạo phiên giám sát GPS.');
      }
    }

    const recordedAtDate = new Date(request.recordedAt);

    // Lưu log GPS và cập nhật vị trí mới nhất của Xe trong 1 transaction
    await prisma.$transaction(async (tx) => {
      await tx.gpsLog.create({
        data: {
          eventId: request.eventId,
          vehicleId: vehicle.id,
          monitoringSessionId: activeSession!.id,
          latitude: request.latitude,
          longitude: request.longitude,
          speed: request.speed ?? 0,
          recordedAt: recordedAtDate,
        },
      });

      const movementStatus = request.speed && request.speed > 0 ? 'MOVING' : 'STOPPED';

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: {
          lastLatitude: request.latitude,
          lastLongitude: request.longitude,
          lastSpeed: request.speed ?? 0,
          lastSeenAt: recordedAtDate,
          movementStatus: movementStatus,
        },
      });
    });

    // Sự kiện Telemetry thời gian thực (Realtime Event)
    const event = new RealtimeTelemetryEvent(
      vehicle.id,
      request.latitude,
      request.longitude,
      request.speed ?? 0,
      recordedAtDate
    );

    // Log tracking
    console.log(
      `[Telemetry] Recorded GPS for vehicle ${vehicle.licensePlate} (${vehicle.id}): ${request.latitude}, ${request.longitude}`
    );
  }
}

export default TelemetryService;
