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
    const startDate = new Date(request.startTime);
    const endDate = new Date(request.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Định dạng thời gian không hợp lệ.');
    }

    if (startDate >= endDate) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc.');
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      include: { organization: true },
    });
    if (!staff) {
      throw new Error('Không tìm thấy thông tin nhân viên lập hợp đồng.');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: request.customerId },
      include: { organization: true },
    });
    if (!customer) {
      throw new Error('Không tìm thấy khách hàng.');
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: request.vehicleId },
      include: { organization: true },
    });
    if (!vehicle) {
      throw new Error('Không tìm thấy phương tiện.');
    }

    // Kiểm tra cô lập dữ liệu (Multi-tenant Data Isolation)
    if (customer.organizationId !== staff.organizationId) {
      throw new Error('Khách hàng không thuộc quyền quản lý của doanh nghiệp bạn.');
    }

    if (vehicle.organizationId !== staff.organizationId) {
      throw new Error('Phương tiện không thuộc quyền quản lý của doanh nghiệp bạn.');
    }

    if (vehicle.status !== 'AVAILABLE') {
      throw new Error('Phương tiện không sẵn sàng cho thuê.');
    }

    const activeContracts = await prisma.rentalContract.findMany({
      where: {
        vehicleId: vehicle.id,
        status: ContractStatus.ACTIVE,
      },
    });

    if (activeContracts.length > 0) {
      throw new Error('Phương tiện này đang có hợp đồng ACTIVE (Đang được thuê).');
    }

    const savedContract = await prisma.rentalContract.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        createdByStaffId: staff.id,
        organizationId: staff.organizationId,
        startTime: startDate,
        endTime: endDate,
        status: ContractStatus.DRAFT,
        price: request.price ?? 0,
        depositAmount: request.depositAmount ?? 0,
        notes: request.notes || null,
      },
      include: {
        customer: true,
        vehicle: true,
        createdByStaff: true,
      },
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
}

export default RentalContractService;
