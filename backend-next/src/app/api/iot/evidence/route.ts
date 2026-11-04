import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import ApiResponse from '@/common/response/ApiResponse';
import DeviceAuthenticationFilter from '@/common/security/DeviceAuthenticationFilter';

export async function POST(request: NextRequest) {
  try {
    const deviceContext = await DeviceAuthenticationFilter.authenticate(request);
    const formData = await request.formData();

    const file = (formData.get('image') || formData.get('file')) as File | null;
    const eventId = formData.get('eventId') as string | null;
    const contractIdParam = formData.get('contractId') as string | null;

    if (!file || !eventId) {
      return ApiResponse.error('Thiếu file ảnh bằng chứng hoặc mã sự kiện (eventId).', 400);
    }

    // Xác định hợp đồng thuê đang active của xe
    let contractId = contractIdParam ? parseInt(contractIdParam, 10) : null;
    if (!contractId) {
      const activeContract = await prisma.rentalContract.findFirst({
        where: {
          vehicleId: deviceContext.vehicleId,
          status: 'ACTIVE',
        },
        orderBy: { id: 'desc' },
      });
      contractId = activeContract ? activeContract.id : 0;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const relativeUrl = `/uploads/evidence/${deviceContext.organizationId}/contracts/${contractId}/${todayStr}/${eventId}.jpg`;
    const absoluteDirPath = path.join(process.cwd(), 'public', 'uploads', 'evidence', String(deviceContext.organizationId), 'contracts', String(contractId), todayStr);

    fs.mkdirSync(absoluteDirPath, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const absoluteFilePath = path.join(absoluteDirPath, `${eventId}.jpg`);

    fs.writeFileSync(absoluteFilePath, buffer);

    // Cập nhật đường dẫn bằng chứng vào bản ghi Alert nếu đã tồn tại
    try {
      await prisma.alert.update({
        where: { eventId },
        data: {
          resolutionNote: relativeUrl,
        },
      });
    } catch {
      // Alert có thể chưa kịp ghi hoặc được ghi sau
    }

    console.log(`[IoT Evidence] Saved evidence image for event ${eventId} -> ${relativeUrl}`);

    return ApiResponse.success({
      eventId,
      evidenceUrl: relativeUrl,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('[IoT Evidence Error]', error);
    const statusCode = error.message?.includes('Header') || error.message?.includes('Token') ? 401 : 400;
    return ApiResponse.error(error.message || 'Lỗi tiếp nhận ảnh bằng chứng.', statusCode);
  }
}

