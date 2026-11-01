import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seed Data) cho hệ thống DriveLinker...');

  // 1. Tạo Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: { name: 'STAFF' },
  });

  console.log('✅ Đã tạo Roles: ADMIN, STAFF');

  // 2. Tạo Organization ORG_1
  const org1 = await prisma.organization.upsert({
    where: { companyCode: 'ORG_1' },
    update: {},
    create: {
      name: 'Công ty Cổ phần DriveLinker VN',
      companyCode: 'ORG_1',
      phone: '0886557205',
      email: 'contact@drivelinker.vn',
      address: 'Hà Nội, Việt Nam',
      status: 'ACTIVE',
    },
  });

  // 3. Tạo Organization CTA2026 và CTB2026
  const orgA = await prisma.organization.upsert({
    where: { companyCode: 'CTA2026' },
    update: {},
    create: {
      name: 'Demo CTY A',
      companyCode: 'CTA2026',
      phone: '0901234567',
      email: 'admin@ctya.com',
      address: '120 Hoàng Minh Thảo, Đà Nẵng',
      status: 'ACTIVE',
    },
  });

  const orgB = await prisma.organization.upsert({
    where: { companyCode: 'CTB2026' },
    update: {},
    create: {
      name: 'Demo CTY B',
      companyCode: 'CTB2026',
      phone: '0912345678',
      email: 'admin@ctyb.com',
      address: '456 Lê Duẩn, Hà Nội',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Đã tạo Organizations: ORG_1, CTA2026, CTB2026');

  // 4. Băm mật khẩu mặc định
  const passwordHash = await bcrypt.hash('password123', 10);
  const password123456Hash = await bcrypt.hash('123456', 10);

  // 5. Tạo User 'admin' ở ORG_1
  await prisma.user.upsert({
    where: {
      uq_users_org_username: {
        organizationId: org1.id,
        username: 'admin',
      },
    },
    update: { passwordHash: passwordHash },
    create: {
      organizationId: org1.id,
      roleId: adminRole.id,
      username: 'admin',
      passwordHash: passwordHash,
      fullName: 'Quản trị viên Hệ thống (ORG_1)',
      email: 'admin@drivelinker.vn',
      phone: '0886557205',
      status: 'ACTIVE',
    },
  });

  // 6. Tạo User 'owner.an' và 'staff.a' ở CTA2026
  const ownerAn = await prisma.user.upsert({
    where: {
      uq_users_org_username: {
        organizationId: orgA.id,
        username: 'owner.an',
      },
    },
    update: { passwordHash: password123456Hash },
    create: {
      organizationId: orgA.id,
      roleId: adminRole.id,
      username: 'owner.an',
      passwordHash: password123456Hash,
      fullName: 'Nguyễn Phạm Thiện Ân (Admin Cty A)',
      email: 'an.ctya@drivelinker.vn',
      phone: '0901234567',
      status: 'ACTIVE',
    },
  });

  const staffA = await prisma.user.upsert({
    where: {
      uq_users_org_username: {
        organizationId: orgA.id,
        username: 'staff.a',
      },
    },
    update: { passwordHash: password123456Hash },
    create: {
      organizationId: orgA.id,
      roleId: staffRole.id,
      username: 'staff.a',
      passwordHash: password123456Hash,
      fullName: 'Trần Văn Nhân Viên (Staff Cty A)',
      email: 'staff.a@drivelinker.vn',
      phone: '0905555555',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Đã tạo Users CTA2026: owner.an (Admin), staff.a (Staff)');

  // 7. Tạo Xe mẫu cho CTA2026 (Đà Nẵng)
  const veh1 = await prisma.vehicle.upsert({
    where: { licensePlate: '43A-12345' },
    update: {},
    create: {
      licensePlate: '43A-12345',
      brand: 'VINFAST',
      model: 'VF8',
      vehicleType: 'CAR',
      organizationId: orgA.id,
      status: 'AVAILABLE',
      movementStatus: 'STOPPED',
      lastLatitude: 16.0544,
      lastLongitude: 108.2022,
      lastSpeed: 0,
    },
  });

  const veh2 = await prisma.vehicle.upsert({
    where: { licensePlate: '43C-67890' },
    update: {},
    create: {
      licensePlate: '43C-67890',
      brand: 'HYUNDAI',
      model: 'HD120',
      vehicleType: 'TRUCK',
      organizationId: orgA.id,
      status: 'RENTED',
      movementStatus: 'MOVING',
      lastLatitude: 16.0600,
      lastLongitude: 108.2100,
      lastSpeed: 55,
    },
  });

  const veh3 = await prisma.vehicle.upsert({
    where: { licensePlate: '43B-55555' },
    update: {},
    create: {
      licensePlate: '43B-55555',
      brand: 'TOYOTA',
      model: 'Fortuner',
      vehicleType: 'CAR',
      organizationId: orgA.id,
      status: 'MAINTENANCE',
      movementStatus: 'STOPPED',
      lastLatitude: 16.0400,
      lastLongitude: 108.1900,
      lastSpeed: 0,
    },
  });

  console.log('✅ Đã tạo 3 Xe mẫu cho CTA2026: 43A-12345 (AVAILABLE), 43C-67890 (RENTED), 43B-55555 (MAINTENANCE)');

  // 8. Tạo Khách hàng mẫu cho CTA2026
  const cus1 = await prisma.customer.upsert({
    where: { phone: '0901112233' },
    update: {},
    create: {
      fullName: 'Trần Văn Khách (Đà Nẵng)',
      phone: '0901112233',
      idCardNumber: '048099887766',
      drivingLicense: 'B2-112233',
      address: '120 Hoàng Minh Thảo, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  const cus2 = await prisma.customer.upsert({
    where: { phone: '0902223344' },
    update: {},
    create: {
      fullName: 'Lê Thị Mẫu (Khách DN)',
      phone: '0902223344',
      idCardNumber: '048099554433',
      drivingLicense: 'B2-445566',
      address: '456 Lê Duẩn, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  console.log('✅ Đã tạo Khách hàng mẫu cho CTA2026');

  // 9. Tạo Hợp đồng thuê xe cho CTA2026
  // Hợp đồng 1: ACTIVE (Đang thuê xe 43C-67890, có yêu cầu đổi giá PENDING)
  const contract1 = await prisma.rentalContract.create({
    data: {
      customerId: cus1.id,
      vehicleId: veh2.id,
      createdByStaffId: staffA.id,
      organizationId: orgA.id,
      startTime: new Date(Date.now() - 86400000 * 2),
      endTime: new Date(Date.now() + 86400000 * 8),
      status: 'ACTIVE',
      price: 5000000,
      depositAmount: 2000000,
      hasPendingPriceRequest: true,
      notes: 'Hợp đồng dài hạn vận tải hàng hóa Đà Nẵng - Huế',
    },
  });

  // Tạo MonitoringSession cho Hợp đồng 1
  const session1 = await prisma.monitoringSession.create({
    data: {
      contractId: contract1.id,
      vehicleId: veh2.id,
      startedAt: new Date(Date.now() - 86400000 * 2),
      status: 'ACTIVE',
    },
  });

  // Hợp đồng 2: DRAFT (Bản nháp chờ Quản lý duyệt)
  await prisma.rentalContract.create({
    data: {
      customerId: cus2.id,
      vehicleId: veh1.id,
      createdByStaffId: staffA.id,
      organizationId: orgA.id,
      startTime: new Date(Date.now() + 86400000 * 1),
      endTime: new Date(Date.now() + 86400000 * 6),
      status: 'DRAFT',
      price: 3500000,
      depositAmount: 1500000,
      hasPendingPriceRequest: false,
      notes: 'Bản nháp thuê xe du lịch cuối tuần',
    },
  });

  console.log('✅ Đã tạo 2 Hợp đồng cho CTA2026 (1 ACTIVE, 1 DRAFT)');

  // 10. Tạo Yêu cầu Đổi giá (PriceChangeRequest) đang PENDING cho CTA2026
  await prisma.priceChangeRequest.create({
    data: {
      contractId: contract1.id,
      requestedByStaffId: staffA.id,
      currentPrice: 5000000,
      proposedPrice: 4500000,
      reason: 'Khách hàng thân thiết xin giảm giá 10% do hợp đồng thuê dài ngày',
      status: 'PENDING',
    },
  });

  console.log('✅ Đã tạo Yêu cầu đổi giá PENDING cho Hợp đồng #1 (CTA2026)');

  // 11. Tạo Cảnh báo AI (Alert) cho CTA2026
  await prisma.alert.create({
    data: {
      eventId: `EVT-ALERT-CTA-${Date.now()}`,
      organizationId: orgA.id,
      vehicleId: veh2.id,
      monitoringSessionId: session1.id,
      alertType: 'DROWSINESS',
      severityLevel: 'DANGER',
      drowsinessScore: 92,
      latitude: 16.0544,
      longitude: 108.2022,
      resolutionStatus: 'NEW',
      occurredAt: new Date(),
    },
  });

  console.log('✅ Đã tạo Cảnh báo AI (Ngủ gật) cho CTA2026');
  console.log('🎉 Seed dữ liệu mẫu cho CTA2026 hoàn tất 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
