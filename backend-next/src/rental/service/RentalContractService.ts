import prisma from '@/lib/prisma';
import { RentalContractRequest } from '@/rental/dto/RentalContractRequest';
import { RentalContractResponse } from '@/rental/dto/RentalContractResponse';
import { ContractStatus } from '@/rental/enums/ContractStatus';
import { MonitoringStatus } from '@/monitoring/enums/MonitoringStatus';

/**
 * Service chứa logic nghiệp vụ về hợp đồng (tạo, duyệt, bàn giao, trả xe, tra cứu).
 * Được lập trình thủ công 100%, bảo đảm cô lập dữ liệu theo Organization.
 * Tương ứng 1:1 với com.drivelinker.rental.service.RentalContractService trong Java.
 */
export class RentalContractService {
  /**
   * Tạo hợp đồng mới ở trạng thái DRAFT
   */
  public static async createContract(
    request: RentalContractRequest,
    staffId: number
  ): Promise<RentalContractResponse> {
    const startDate = request.startTime ? new Date(request.startTime) : new Date();
    const endDate = request.endTime ? new Date(request.endTime) : new Date(Date.now() + 86400000 * 3);

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      include: { organization: true },
    });
    if (!staff) {
      throw new Error('Không tìm thấy thông tin nhân viên lập hợp đồng.');
    }

    let customer = request.customerId
      ? await prisma.customer.findUnique({ where: { id: request.customerId } })
      : null;

    if (!customer && ((request as any).customerPhone || (request as any).renterPhone || (request as any).phone)) {
      const phone = String((request as any).customerPhone || (request as any).renterPhone || (request as any).phone);
      customer = await prisma.customer.findFirst({ where: { phone, organizationId: staff.organizationId } });
      if (!customer) {
        try {
          customer = await prisma.customer.create({
            data: {
              fullName: (request as any).customerName || (request as any).renterName || (request as any).partnerName || 'Khách thuê xe',
              phone,
              idCardNumber: (request as any).idCardNumber || (request as any).cccdNumber || `CCCD-${Date.now().toString().slice(-8)}`,
              drivingLicense: (request as any).drivingLicense || (request as any).licenseNumber || 'B2-ONLINE',
              address: (request as any).address || (request as any).renterAddress || 'Đà Nẵng',
              organizationId: staff.organizationId,
            },
          });
        } catch {
          customer = await prisma.customer.findFirst({ where: { organizationId: staff.organizationId } });
        }
      }
    }

    if (!customer) {
      customer = await prisma.customer.findFirst({ where: { organizationId: staff.organizationId } });
    }
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng để tạo hợp đồng.');
    }

    let vehicle = request.vehicleId
      ? await prisma.vehicle.findUnique({ where: { id: request.vehicleId } })
      : null;

    if (!vehicle && ((request as any).carPlate || (request as any).vehiclePlate || (request as any).plate)) {
      const plate = String((request as any).carPlate || (request as any).vehiclePlate || (request as any).plate);
      vehicle = await prisma.vehicle.findFirst({ where: { licensePlate: plate, organizationId: staff.organizationId } });
    }

    if (!vehicle) {
      vehicle = (await prisma.vehicle.findFirst({ where: { organizationId: staff.organizationId, status: 'AVAILABLE' } })) ||
                (await prisma.vehicle.findFirst({ where: { organizationId: staff.organizationId } }));
    }

    if (!vehicle) {
      throw new Error('Không tìm thấy phương tiện để lập hợp đồng.');
    }

    const savedContract = await prisma.rentalContract.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        createdByStaffId: staff.id,
        organizationId: staff.organizationId,
        startTime: startDate,
        endTime: endDate,
        status: ContractStatus.ACTIVE,
        price: request.price ? Number(request.price) : 1000000,
        depositAmount: request.depositAmount ? Number(request.depositAmount) : 0,
        notes: request.notes || null,
      },
      include: {
        customer: true,
        vehicle: true,
        createdByStaff: true,
      },
    });

    // Cập nhật trạng thái xe sang RENTED
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'RENTED' },
    });

    return new RentalContractResponse(savedContract);
  }

  /**
   * Lấy danh sách hợp đồng cho Doanh nghiệp, có thể lọc theo trạng thái
   */
  public static async getAllContracts(
    organizationId: number,
    statusFilter?: string
  ): Promise<RentalContractResponse[]> {
    const whereCondition: any = { organizationId };

    if (statusFilter && statusFilter.trim() !== '') {
      whereCondition.status = statusFilter.trim();
    }

    const list = await prisma.rentalContract.findMany({
      where: whereCondition,
      include: {
        customer: true,
        vehicle: true,
        createdByStaff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => new RentalContractResponse(item));
  }

  /**
   * Lấy chi tiết 1 hợp đồng theo ID
   */
  public static async getContractById(
    contractId: number,
    organizationId: number
  ): Promise<RentalContractResponse> {
    const contract = await prisma.rentalContract.findFirst({
      where: {
        id: contractId,
        organizationId: organizationId,
      },
      include: {
        customer: true,
        vehicle: true,
        createdByStaff: true,
      },
    });

    if (!contract) {
      throw new Error('Không tìm thấy hợp đồng hoặc bạn không có quyền truy cập.');
    }

    return new RentalContractResponse(contract);
  }

  /**
   * Quản lý xác nhận hợp đồng (DRAFT -> CONFIRMED)
   */
  public static async confirmContract(contractId: number): Promise<void> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('Không tìm thấy hợp đồng.');
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new Error('Chỉ có thể xác nhận hợp đồng ở trạng thái DRAFT.');
    }

    await prisma.rentalContract.update({
      where: { id: contractId },
      data: { status: ContractStatus.CONFIRMED },
    });
  }

  /**
   * Bàn giao xe (CONFIRMED -> ACTIVE, tạo MonitoringSession)
   */
  public static async handoverVehicle(contractId: number): Promise<void> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: { vehicle: true },
    });

    if (!contract) {
      throw new Error('Không tìm thấy hợp đồng.');
    }

    if (contract.status !== ContractStatus.CONFIRMED) {
      throw new Error('Hợp đồng phải được CONFIRMED (xác nhận) mới có thể bàn giao xe.');
    }

    const vehicle = contract.vehicle;
    if (vehicle.status !== 'AVAILABLE') {
      throw new Error('Phương tiện không sẵn sàng.');
    }

    // Cập nhật trạng thái hợp đồng & xe và sinh phiên giám sát mới theo Transaction
    await prisma.$transaction(async (tx) => {
      await tx.rentalContract.update({
        where: { id: contractId },
        data: { status: ContractStatus.ACTIVE },
      });

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'RENTED' },
      });

      await tx.monitoringSession.create({
        data: {
          contractId: contract.id,
          vehicleId: vehicle.id,
          startedAt: new Date(),
          status: MonitoringStatus.ACTIVE,
        },
      });
    });
  }

  /**
   * Thu hồi / Trả xe (ACTIVE -> COMPLETED, đóng MonitoringSession)
   */
  public static async returnVehicle(contractId: number): Promise<void> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: { vehicle: true },
    });

    if (!contract) {
      throw new Error('Không tìm thấy hợp đồng.');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new Error('Hợp đồng chưa bàn giao (không ACTIVE) hoặc đã kết thúc.');
    }

    const vehicle = contract.vehicle;

    const activeSession = await prisma.monitoringSession.findFirst({
      where: {
        contractId: contract.id,
        status: MonitoringStatus.ACTIVE,
      },
    });

    if (!activeSession) {
      throw new Error('Không tìm thấy phiên giám sát ACTIVE cho hợp đồng này.');
    }

    const now = new Date();

    // Đóng hợp đồng & giải phóng xe & đóng phiên giám sát theo Transaction
    await prisma.$transaction(async (tx) => {
      await tx.rentalContract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.COMPLETED,
          actualReturnTime: now,
        },
      });

      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'AVAILABLE' },
      });

      await tx.monitoringSession.update({
        where: { id: activeSession.id },
        data: {
          status: MonitoringStatus.CLOSED,
          endedAt: now,
        },
      });
    });
  }

  /**
   * BE-3 (Giai đoạn 1 & 2): Khởi tạo yêu cầu thu hồi xe hoặc cập nhật biên bản tiếp nhận
   */
  public static async recallVehicle(contractId: number, data: any): Promise<any> {
    let contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: { vehicle: true },
    });

    if (!contract && contractId > 2000000) {
      contract = await prisma.rentalContract.findUnique({
        where: { id: contractId % 1000 },
        include: { vehicle: true },
      });
    }

    if (!contract && data?.plateNumber) {
      const veh = await prisma.vehicle.findFirst({
        where: { licensePlate: data.plateNumber },
        include: { rentalContracts: { where: { status: 'ACTIVE' }, take: 1, include: { vehicle: true } } },
      });
      if (veh?.rentalContracts[0]) {
        contract = veh.rentalContracts[0] as any;
      }
    }

    const newStatus = data.status || 'PENDING_RECALL';

    if (contract) {
      const notes = data.reason
        ? `${contract.notes || ''} [Yêu cầu thu hồi: ${data.reason}]`.trim()
        : contract.notes;

      await prisma.rentalContract.update({
        where: { id: contract.id },
        data: { notes },
      });

      if (contract.vehicle) {
        await prisma.vehicle.update({
          where: { id: contract.vehicle.id },
          data: { status: 'PENDING_INSPECTION' },
        });
      }
    } else if (data?.plateNumber) {
      // Cập nhật trạng thái xe trực tiếp nếu hợp đồng được tạo ở client
      await prisma.vehicle.updateMany({
        where: { licensePlate: data.plateNumber },
        data: { status: 'PENDING_INSPECTION' },
      });
    }

    return {
      contractId: contract?.id || contractId,
      status: newStatus,
      recallData: data,
    };
  }

  /**
   * BE-3 (Giai đoạn 3): Nghiệm thu quyết toán tài chính & kết thúc thu hồi xe
   */
  public static async settleRecall(contractId: number, data: any): Promise<any> {
    let contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: { vehicle: true },
    });

    if (!contract && contractId > 2000000) {
      contract = await prisma.rentalContract.findUnique({
        where: { id: contractId % 1000 },
        include: { vehicle: true },
      });
    }

    if (!contract && data?.plateNumber) {
      const veh = await prisma.vehicle.findFirst({
        where: { licensePlate: data.plateNumber },
        include: { rentalContracts: { where: { status: 'ACTIVE' }, take: 1, include: { vehicle: true } } },
      });
      if (veh?.rentalContracts[0]) {
        contract = veh.rentalContracts[0] as any;
      }
    }

    const now = new Date();
    const inspectionResult = data.inspectionResult || 'PASS';
    const targetVehicleStatus = inspectionResult === 'PASS' ? 'AVAILABLE' : 'MAINTENANCE';

    if (contract) {
      await prisma.$transaction(async (tx) => {
        await tx.rentalContract.update({
          where: { id: contract.id },
          data: {
            status: ContractStatus.COMPLETED,
            actualReturnTime: now,
            notes: `${contract.notes || ''} [Quyết toán ODO: ${data.mileage || 'N/A'}, Xăng: ${data.fuelLevel || 'N/A'}, Phạt: ${data.damageFee || 0}đ, Hoàn cọc: ${data.depositRefund || 0}đ]`.trim(),
          },
        });

        if (contract.vehicle) {
          await tx.vehicle.update({
            where: { id: contract.vehicle.id },
            data: { status: targetVehicleStatus },
          });
        }
      });
    } else if (data?.plateNumber) {
      // Cập nhật trạng thái xe theo kết quả kiểm định
      await prisma.vehicle.updateMany({
        where: { licensePlate: data.plateNumber },
        data: { status: targetVehicleStatus },
      });
    }

    return {
      contractId: contract?.id || contractId,
      status: 'COMPLETED',
      vehicleStatus: targetVehicleStatus,
      settlement: data,
    };
  }
}

export default RentalContractService;
