import prisma from '@/lib/prisma';
import { VehicleRequest } from '@/vehicle/dto/VehicleRequest';
import { VehicleResponse } from '@/vehicle/dto/VehicleResponse';

/**
 * Service chứa logic nghiệp vụ quản lý Phương tiện.
 * Tương ứng 1:1 với com.drivelinker.vehicle.service.VehicleService trong Java.
 */
export class VehicleService {
  private static validateLicensePlate(licensePlate: string, vehicleType: string): void {
    if (!licensePlate || licensePlate.length < 8 || licensePlate.length > 10) {
      throw new Error('Biển số xe không hợp lệ về độ dài (phải từ 8 - 10 ký tự)!');
    }

    if (
      licensePlate.charAt(0) < '0' ||
      licensePlate.charAt(0) > '9' ||
      licensePlate.charAt(1) < '0' ||
      licensePlate.charAt(1) > '9'
    ) {
      throw new Error('Biển số xe phải bắt đầu bằng 2 chữ số mã tỉnh!');
    }

    const typeUpper = vehicleType ? vehicleType.toUpperCase() : '';

    if (typeUpper === 'CAR' || typeUpper === 'TRUCK') {
      // Mẫu Ô TÔ: 43A-12345 (length 9) hoặc 43A-1234 (length 8)
      const char2 = licensePlate.charAt(2);
      if (!((char2 >= 'A' && char2 <= 'Z') || (char2 >= 'a' && char2 <= 'z'))) {
        throw new Error('Biển số Ô tô/Tải: Ký tự thứ 3 phải là chữ cái in hoa (VD: 43A-12345)');
      }
      if (licensePlate.charAt(3) !== '-') {
        throw new Error('Biển số Ô tô/Tải: Phải có dấu gạch ngang sau phần chữ (VD: 43A-12345)');
      }
      for (let i = 4; i < licensePlate.length; i++) {
        const c = licensePlate.charAt(i);
        if (c < '0' || c > '9') {
          throw new Error('Phần đuôi của biển số Ô tô/Tải chỉ được chứa số!');
        }
      }
    } else if (typeUpper === 'MOTORCYCLE') {
      // Mẫu XE MÁY: 43H1-34615 (length 10) hoặc 43H1-1234 (length 9)
      const char2 = licensePlate.charAt(2);
      if (!((char2 >= 'A' && char2 <= 'Z') || (char2 >= 'a' && char2 <= 'z'))) {
        throw new Error('Biển số Xe máy: Ký tự thứ 3 phải là chữ cái (VD: 43H1-34615)');
      }
      const char3 = licensePlate.charAt(3);
      const isAlphaNum =
        (char3 >= '0' && char3 <= '9') ||
        (char3 >= 'A' && char3 <= 'Z') ||
        (char3 >= 'a' && char3 <= 'z');
      if (!isAlphaNum) {
        throw new Error('Biển số Xe máy: Ký tự thứ 4 phải là số hoặc chữ (VD: 43H1-34615)');
      }
      if (licensePlate.charAt(4) !== '-') {
        throw new Error('Biển số Xe máy: Phải có dấu gạch ngang sau mã vùng (VD: 43H1-34615)');
      }
      for (let i = 5; i < licensePlate.length; i++) {
        const c = licensePlate.charAt(i);
        if (c < '0' || c > '9') {
          throw new Error('Phần đuôi của biển số Xe máy chỉ được chứa số!');
        }
      }
    } else {
      throw new Error('Loại xe (vehicleType) phải là CAR, TRUCK hoặc MOTORCYCLE');
    }
  }

  public static async createVehicle(
    request: VehicleRequest,
    organizationId: number
  ): Promise<VehicleResponse> {
    if (!request.licensePlate || request.licensePlate.trim() === '') {
      throw new Error('Biển số xe không được để trống');
    }
    if (!request.vehicleType || request.vehicleType.trim() === '') {
      throw new Error('Loại xe không được để trống');
    }
    if (!request.brand || request.brand.trim() === '') {
      throw new Error('Hãng xe không được để trống');
    }
    if (!request.model || request.model.trim() === '') {
      throw new Error('Dòng xe không được để trống');
    }

    this.validateLicensePlate(request.licensePlate, request.vehicleType);

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: request.licensePlate },
    });
    if (existingVehicle) {
      throw new Error('Biển số xe này đã tồn tại trong hệ thống!');
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        licensePlate: request.licensePlate,
        vehicleType: request.vehicleType,
        brand: request.brand,
        model: request.model,
        organizationId: organizationId,
        status: 'AVAILABLE',
      },
    });

    return new VehicleResponse(newVehicle);
  }

  public static async getAllVehicle(orgId: number): Promise<VehicleResponse[]> {
    const listFromDB = await prisma.vehicle.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return listFromDB.map((v) => new VehicleResponse(v));
  }

  public static async getVehicleById(vehicleId: number, orgId: number): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        organizationId: orgId,
      },
    });

    if (!vehicle) {
      throw new Error('Không tìm thấy phương tiện hoặc bạn không có quyền truy cập.');
    }

    return new VehicleResponse(vehicle);
  }
}

export default VehicleService;
