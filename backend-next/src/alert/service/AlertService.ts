import prisma from '@/lib/prisma';
import { AlertRequest } from '@/alert/dto/AlertRequest';
import { RealtimeAlertEvent } from '@/alert/dto/RealtimeAlertEvent';
import { AlertDetailResponse } from '@/alert/dto/AlertDetailResponse';
import { MonitoringStatus } from '@/monitoring/enums/MonitoringStatus';
import { ResolutionStatus } from '@/alert/enums/ResolutionStatus';

/**
 * Service lưu trữ, truy vấn và xử lý Cảnh báo (Alerts).
 * Tương ứng 1:1 với com.drivelinker.alert.service.AlertService trong Java.
 */
export class AlertService {
  /**
   * Lưu Cảnh báo từ Thiết bị IoT gửi lên
   */
  public static async saveAlert(request: AlertRequest, deviceId: number): Promise<void> {
    // Idempotency check: Tránh trùng lặp sự kiện
    const existingAlert = await prisma.alert.findUnique({
      where: { eventId: request.eventId },
    });
    if (existingAlert) {
      return;
    }

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

    const activeSession = await prisma.monitoringSession.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: MonitoringStatus.ACTIVE,
      },
    });

    if (!activeSession) {
      throw new Error('Xe không trong phiên giám sát nào');
    }

    const occurredAtDate = new Date(request.occurredAt);

    const savedAlert = await prisma.alert.create({
      data: {
        eventId: request.eventId,
        organizationId: device.organizationId,
        vehicleId: vehicle.id,
        monitoringSessionId: activeSession.id,
        alertType: request.alertType,
        severityLevel: request.severityLevel,
        drowsinessScore: request.drowsinessScore ?? null,
        latitude: request.latitude ?? null,
        longitude: request.longitude ?? null,
        occurredAt: occurredAtDate,
        resolutionStatus: ResolutionStatus.NEW,
      },
    });

    const event = new RealtimeAlertEvent(
      savedAlert.id.toString(),
      savedAlert.alertType,
      savedAlert.severityLevel,
      vehicle.id,
      savedAlert.latitude,
      savedAlert.longitude,
      savedAlert.occurredAt
    );

    console.log(`[Alert] Triggered ${savedAlert.alertType} (${savedAlert.severityLevel}) on Vehicle ${vehicle.licensePlate}`);
  }

  /**
   * Lấy danh sách Cảnh báo cho Web Frontend (có thể lọc theo status)
   */
  public static async getAlerts(
    organizationId: number,
    statusFilter?: string
  ): Promise<AlertDetailResponse[]> {
    const whereCondition: any = { organizationId };

    if (statusFilter && statusFilter.trim() !== '') {
      whereCondition.resolutionStatus = statusFilter.trim();
    }

    const list = await prisma.alert.findMany({
      where: whereCondition,
      include: {
        vehicle: true,
        resolver: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: 100, // Giới hạn 100 cảnh báo gần nhất để tối ưu hiệu năng
    });

    return list.map((item) => new AlertDetailResponse(item));
  }

  /**
   * Nhân viên trực điều hành xác nhận đã xử lý cảnh báo
   */
  public static async resolveAlert(
    alertId: string | number,
    userId: number,
    note?: string,
    actionName?: string
  ): Promise<AlertDetailResponse> {
    const numericId = BigInt(alertId);

    const existingAlert = await prisma.alert.findUnique({
      where: { id: numericId },
    });

    if (!existingAlert) {
      throw new Error('Không tìm thấy cảnh báo.');
    }

    if (existingAlert.resolutionStatus === 'RESOLVED') {
      throw new Error('Cảnh báo này đã được giải quyết trước đó.');
    }

    const now = new Date();

    const updatedAlert = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái Cảnh báo thành RESOLVED
      const alert = await tx.alert.update({
        where: { id: numericId },
        data: {
          resolutionStatus: 'RESOLVED',
          resolvedBy: userId,
          resolvedAt: now,
          resolutionNote: note || null,
        },
        include: {
          vehicle: true,
          resolver: true,
        },
      });

      // 2. Ghi nhận lịch sử hành động giải quyết
      await tx.alertAction.create({
        data: {
          alertId: numericId,
          action: actionName || 'RESOLVE_ALERT',
          performedBy: userId,
          note: note || 'Nhân viên đã gọi điện nhắc nhở tài xế an toàn',
        },
      });

      return alert;
    });

    return new AlertDetailResponse(updatedAlert);
  }
}

export default AlertService;
