import prisma from '@/lib/prisma';
import { CustomerRequest } from '@/customer/dto/CustomerRequest';
import { CustomerResponse } from '@/customer/dto/CustomerResponse';

/**
 * Service chứa logic nghiệp vụ liên quan đến quản lý Khách hàng.
 * Tương ứng 1:1 với com.drivelinker.customer.service.CustomerService trong Java.
 */
export class CustomerService {
  private static validatePhone(phone: string): void {
    if (!phone || phone.length !== 10 || phone.charAt(0) !== '0') {
      throw new Error('Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0');
    }
    for (let i = 0; i < phone.length; i++) {
      if (phone.charAt(i) < '0' || phone.charAt(i) > '9') {
        throw new Error('Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0');
      }
    }
  }

  private static validateIdCard(idCard: string): void {
    if (!idCard || idCard.length !== 12) {
      throw new Error('Căn cước công dân phải bao gồm đúng 12 chữ số');
    }
    for (let i = 0; i < idCard.length; i++) {
      if (idCard.charAt(i) < '0' || idCard.charAt(i) > '9') {
        throw new Error('Căn cước công dân phải bao gồm đúng 12 chữ số');
      }
    }
  }

  public static async createCustomer(
    request: CustomerRequest,
    organizationId: number
  ): Promise<CustomerResponse> {
    if (!request.fullName || request.fullName.trim() === '') {
      throw new Error('Tên khách hàng không được để trống');
    }
    if (!request.drivingLicense || request.drivingLicense.trim() === '') {
      throw new Error('Giấy phép lái xe không được để trống');
    }

    this.validatePhone(request.phone);
    this.validateIdCard(request.idCardNumber);

    const existingPhone = await prisma.customer.findUnique({
      where: { phone: request.phone },
    });
    if (existingPhone) {
      throw new Error('Số điện thoại này đã được sử dụng!');
    }

    const existingIdCard = await prisma.customer.findUnique({
      where: { idCardNumber: request.idCardNumber },
    });
    if (existingIdCard) {
      throw new Error('Số CMND/CCCD này đã được sử dụng!');
    }

    const newCustomer = await prisma.customer.create({
      data: {
        fullName: request.fullName,
        phone: request.phone,
        idCardNumber: request.idCardNumber,
        drivingLicense: request.drivingLicense || null,
        address: request.address || null,
        organizationId: organizationId,
      },
    });

    return new CustomerResponse(newCustomer);
  }

  public static async getAllCustomer(orgId: number): Promise<CustomerResponse[]> {
    const listFromDB = await prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return listFromDB.map((cus) => new CustomerResponse(cus));
  }

  public static async getCustomerById(customerId: number, orgId: number): Promise<CustomerResponse> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: orgId,
      },
    });

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng hoặc không có quyền truy cập.');
    }

    return new CustomerResponse(customer);
  }
}

export default CustomerService;
