import prisma from '@/lib/prisma';
import { AiResultRequest } from '@/ai/dto/AiResultRequest';
import { MonitoringStatus } from '@/monitoring/enums/MonitoringStatus';

/**
 * Service lưu trữ kết quả phân tích AI hành vi tài xế.
 * Tương ứng 1:1 với com.drivelinker.ai.service.AiResultService trong Java.
 */
export class AiResultService {
  public static async saveAiResult(request: AiResultRequest, deviceId: number): Promise<void> {
    if (request.drowsinessScore !== undefined && request.drowsinessScore !== null && request.drowsinessScore > 100) {
      throw new Error('Drowsiness score không được vượt quá 100');
    }

    // Idempotency check
    const existing = await prisma.aiResult.findUnique({
      where: { eventId: request.eventId },
    });
    if (existing) {
      return;
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        vehicle: true,
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

    await prisma.aiResult.create({
      data: {
        eventId: request.eventId,
        vehicleId: vehicle.id,
        monitoringSessionId: activeSession.id,
        drowsinessScore: request.drowsinessScore ?? null,
        eyeStatus: request.eyeStatus ?? null,
        headPoseStatus: request.headPoseStatus ?? null,
        occurredAt: occurredAtDate,
      },
    });

    console.log(`[AI Result] Recorded AI event for vehicle ${vehicle.licensePlate}: Drowsiness ${request.drowsinessScore}`);
  }
}

export default AiResultService;

