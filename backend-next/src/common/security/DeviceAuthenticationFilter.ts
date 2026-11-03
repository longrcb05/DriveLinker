import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export interface AuthenticatedDeviceContext {
  deviceId: number;
  deviceCode: string;
  organizationId: number;
  vehicleId: number;
}

/**
 * Filter / Helper xác thực Thiết bị IoT dựa trên Header X-Device-Code và X-Device-Token.
 * Tương ứng 1:1 với com.drivelinker.common.security.DeviceAuthenticationFilter trong Java.
 */
export class DeviceAuthenticationFilter {
  static async authenticate(request: NextRequest): Promise<AuthenticatedDeviceContext> {
    const deviceCode = request.headers.get('x-device-code') || request.headers.get('X-Device-Code');
    const deviceToken = request.headers.get('x-device-token') || request.headers.get('X-Device-Token');

    if (!deviceCode || !deviceToken) {
      throw new Error('Thiếu Header X-Device-Code hoặc X-Device-Token');
    }

    const device = await prisma.device.findUnique({
      where: { deviceCode },
      include: {
        vehicle: true,
        organization: true,
      },
    });

    if (!device || device.status !== 'ACTIVE') {
      throw new Error('Thiết bị không tồn tại hoặc bị khóa');
    }

    const isMatch = await bcrypt.compare(deviceToken, device.secretHash);
    if (!isMatch) {
      throw new Error('Token thiết bị không hợp lệ');
    }

    if (!device.vehicleId) {
      throw new Error('Thiết bị chưa được gắn vào phương tiện nào');
    }

    return {
      deviceId: device.id,
      deviceCode: device.deviceCode,
      organizationId: device.organizationId,
      vehicleId: device.vehicleId,
    };
  }
}

export default DeviceAuthenticationFilter;

