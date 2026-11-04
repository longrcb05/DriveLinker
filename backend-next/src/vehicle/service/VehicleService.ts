import prisma from '@/lib/prisma';
import { VehicleRequest } from '@/vehicle/dto/VehicleRequest';
import { VehicleResponse } from '@/vehicle/dto/VehicleResponse';

/**
 * Service chứa logic nghiệp vụ quản lý Phương tiện.
 * Tương ứng 1:1 với com.drivelinker.vehicle.service.VehicleService trong Java.
 */
export class VehicleService {
  private static validateLicensePlate(licensePlate: string, vehicleType: string): void {
    if (!licensePlate || licensePlate.length < 7 || licensePlate.length > 12) {
      throw new Error('Biển số xe không hợp lệ về độ dài (phải từ 7 - 12 ký tự)!');
    }

    if (
      licensePlate.charAt(0) < '0' ||
      licensePlate.charAt(0) > '9' ||
      licensePlate.charAt(1) < '0' ||
      licensePlate.charAt(1) > '9'
    ) {
      throw new Error('Biển số xe phải bắt đầu bằng 2 chữ số mã tỉnh!');
    }

    const typeUpper = vehicleType ? vehicleType.toUpperCase() : 'CAR';

    if (typeUpper === 'CAR' || typeUpper === 'TRUCK' || typeUpper === 'VAN' || typeUpper === 'SUV') {
      const char2 = licensePlate.charAt(2);
      if (!((char2 >= 'A' && char2 <= 'Z') || (char2 >= 'a' && char2 <= 'z'))) {
        throw new Error('Biển số Ô tô/Tải: Ký tự thứ 3 phải là chữ cái (VD: 43A-123.45)');
      }
      if (licensePlate.charAt(3) !== '-') {
        throw new Error('Biển số Ô tô/Tải: Phải có dấu gạch ngang sau phần chữ (VD: 43A-123.45)');
      }
      for (let i = 4; i < licensePlate.length; i++) {
        const c = licensePlate.charAt(i);
        if ((c < '0' || c > '9') && c !== '.') {
          throw new Error('Phần đuôi của biển số Ô tô/Tải chỉ được chứa số hoặc dấu chấm!');
        }
      }
    } else if (typeUpper === 'MOTORCYCLE') {
      const char2 = licensePlate.charAt(2);
      if (!((char2 >= 'A' && char2 <= 'Z') || (char2 >= 'a' && char2 <= 'z'))) {
        throw new Error('Biển số Xe máy: Ký tự thứ 3 phải là chữ cái (VD: 43H1-34615)');
      }
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
        status: request.status || 'AVAILABLE',
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

  public static async updateVehicle(
    vehicleIdOrPlate: number | string,
    data: any,
    orgId: number
  ): Promise<any> {
    const whereClause: any = { organizationId: orgId };
    if (typeof vehicleIdOrPlate === 'number' || !isNaN(Number(vehicleIdOrPlate))) {
      whereClause.id = Number(vehicleIdOrPlate);
    } else {
      whereClause.licensePlate = String(vehicleIdOrPlate);
    }

    const existing = await prisma.vehicle.findFirst({ where: whereClause });
    if (!existing) {
      throw new Error('Không tìm thấy phương tiện cần cập nhật.');
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.brand) updateData.brand = data.brand;
    if (data.model) updateData.model = data.model;
    if (data.vehicleType) updateData.vehicleType = data.vehicleType;
    if (data.movementStatus) updateData.movementStatus = data.movementStatus;
    if (data.lastSpeed !== undefined) updateData.lastSpeed = Number(data.lastSpeed);

    const updated = await prisma.vehicle.update({
      where: { id: existing.id },
      data: updateData,
    });

    return updated;
  }

  public static async deleteVehicle(
    vehicleIdOrPlate: number | string,
    orgId: number
  ): Promise<boolean> {
    const whereClause: any = { organizationId: orgId };
    if (typeof vehicleIdOrPlate === 'number' || !isNaN(Number(vehicleIdOrPlate))) {
      whereClause.id = Number(vehicleIdOrPlate);
    } else {
      whereClause.licensePlate = String(vehicleIdOrPlate);
    }

    const existing = await prisma.vehicle.findFirst({ where: whereClause });
    if (!existing) {
      throw new Error('Không tìm thấy phương tiện cần xóa.');
    }

    try {
      await prisma.vehicle.delete({ where: { id: existing.id } });
    } catch {
      await prisma.vehicle.update({
        where: { id: existing.id },
        data: { status: 'INACTIVE' },
      });
    }

    return true;
  }

  /**
   * Nghiệm thu xe sau thu hồi (BE-4): Chuyển PENDING_INSPECTION sang AVAILABLE (Đạt) hoặc MAINTENANCE (Cần bảo trì)
   */
  public static async inspectVehicle(
    vehicleIdOrPlate: number | string,
    result: 'PASS' | 'FAIL',
    notes: string,
    orgId: number
  ): Promise<any> {
    const whereClause: any = { organizationId: orgId };
    if (typeof vehicleIdOrPlate === 'number' || !isNaN(Number(vehicleIdOrPlate))) {
      whereClause.id = Number(vehicleIdOrPlate);
    } else {
      whereClause.licensePlate = String(vehicleIdOrPlate);
    }

    const existing = await prisma.vehicle.findFirst({ where: whereClause });
    if (!existing) {
      throw new Error('Không tìm thấy phương tiện để nghiệm thu.');
    }

    const targetStatus = result === 'PASS' ? 'AVAILABLE' : 'MAINTENANCE';

    const updated = await prisma.vehicle.update({
      where: { id: existing.id },
      data: {
        status: targetStatus,
      },
    });

    return {
      vehicle: updated,
      inspectionResult: result,
      status: targetStatus,
      notes,
    };
  }
}

export default VehicleService;
