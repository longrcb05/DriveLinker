import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Danh sách 14 ảnh bằng chứng thực tế từ test_yolo/bang_chung phân bổ đủ 5 ngày của hợp đồng (31/10 - 04/11)
const REAL_EVIDENCE_FILES = [
  // Ngày 5: 04/11 (Ngày trả xe)
  { file: 'NGU_GAT_(1.5s)_20261022_214414.jpg', type: 'DROWSINESS', score: 92, severity: 'CRITICAL', occurredAtISO: '2026-11-04T16:45:12.000Z', lat: 16.0610, lng: 108.2170 },
  { file: 'CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg', type: 'YAWN', score: 65, severity: 'WARNING', occurredAtISO: '2026-11-04T16:42:05.000Z', lat: 16.0592, lng: 108.2095 },

  // Ngày 4: 03/11
  { file: 'GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg', type: 'HEAD_DROP', score: 82, severity: 'DANGER', occurredAtISO: '2026-11-03T21:10:05.000Z', lat: 16.0650, lng: 108.2380 },
  { file: 'GUC_DAU_(NHAM_MAT)_(1.5s)_20261022_230208.jpg', type: 'HEAD_DROP', score: 78, severity: 'DANGER', occurredAtISO: '2026-11-03T16:15:22.000Z', lat: 16.0550, lng: 108.2030 },
  { file: 'NGAP_SAU_20261022_212010.jpg', type: 'YAWN', score: 60, severity: 'WARNING', occurredAtISO: '2026-11-03T15:50:10.000Z', lat: 16.0545, lng: 108.2025 },

  // Ngày 3: 02/11
  { file: 'NGU_GAT_(1.5s)_20261024_201436.jpg', type: 'DROWSINESS', score: 95, severity: 'CRITICAL', occurredAtISO: '2026-11-02T22:15:00.000Z', lat: 16.0680, lng: 108.2435 },
  { file: 'NGU_GAT_(1.6s)_20261022_214458.jpg', type: 'DROWSINESS', score: 88, severity: 'DANGER', occurredAtISO: '2026-11-02T21:40:12.000Z', lat: 16.0675, lng: 108.2420 },
  { file: 'NGAP_SAU_(4.1s)_20261024_201455.jpg', type: 'YAWN', score: 62, severity: 'WARNING', occurredAtISO: '2026-11-02T19:30:40.000Z', lat: 16.0615, lng: 108.2355 },

  // Ngày 2: 01/11
  { file: 'BUON_NGU_20261024_094018.jpg', type: 'DROWSINESS', score: 90, severity: 'CRITICAL', occurredAtISO: '2026-11-01T23:05:10.000Z', lat: 16.0750, lng: 108.2400 },
  { file: 'GUC_DAU_(NHAM_MAT)_(4.3s)_20261022_214433.jpg', type: 'HEAD_DROP', score: 70, severity: 'WARNING', occurredAtISO: '2026-11-01T21:15:00.000Z', lat: 16.0592, lng: 108.2095 },
  { file: 'CANH_BAO_DO_5_LAN_VANG_10P_-_DANG_NGAP_0.0s_20261029_100639.jpg', type: 'YAWN', score: 58, severity: 'WARNING', occurredAtISO: '2026-11-01T14:20:15.000Z', lat: 16.0601, lng: 108.2238 },

  // Ngày 1: 31/10 (Ngày nhận xe)
  { file: 'NGU_GAT_1.5s_20261029_100605.jpg', type: 'DROWSINESS', score: 85, severity: 'DANGER', occurredAtISO: '2026-10-31T22:30:22.000Z', lat: 16.0710, lng: 108.2380 },
  { file: 'CHOP_MAT_CHAM_(0.60s)_20261024_201525.jpg', type: 'DROWSINESS', score: 64, severity: 'WARNING', occurredAtISO: '2026-10-31T20:12:00.000Z', lat: 16.0650, lng: 108.2250 },
  { file: 'CANH_BAO_DO_5_LAN_VANG_10P_-_CUI_DAU_-_MAT_MO_0.0s_20261029_100645.jpg', type: 'HEAD_DROP', score: 75, severity: 'WARNING', occurredAtISO: '2026-10-31T18:40:50.000Z', lat: 16.0544, lng: 108.2022 },
];

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu (Seed Data) chuẩn cho DriveLinker...');

  // 1. Roles
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

  // 2. Organization CTA2026
  const orgA = await prisma.organization.upsert({
    where: { companyCode: 'CTA2026' },
    update: {},
    create: {
      name: 'Công ty Cổ phần Vận tải & Du lịch CTA Đà Nẵng',
      companyCode: 'CTA2026',
      phone: '0901234567',
      email: 'admin@cta2026.com',
      address: '120 Hoàng Minh Thảo, Liên Chiểu, Đà Nẵng',
      status: 'ACTIVE',
    },
  });

  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. User Admin & Staff
  const ownerAn = await prisma.user.upsert({
    where: {
      uq_users_org_username: {
        organizationId: orgA.id,
        username: 'owner.an',
      },
    },
    update: { passwordHash },
    create: {
      organizationId: orgA.id,
      roleId: adminRole.id,
      username: 'owner.an',
      passwordHash,
      fullName: 'Nguyễn Phạm Thiện Ân (Admin CTA2026)',
      email: 'an.cta@drivelinker.vn',
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
    update: { passwordHash },
    create: {
      organizationId: orgA.id,
      roleId: staffRole.id,
      username: 'staff.a',
      passwordHash,
      fullName: 'Trần Văn Nhân Viên (Điều hành)',
      email: 'staff.a@cta2026.com',
      phone: '0905555555',
      status: 'ACTIVE',
    },
  });

  // 4. Khách hàng thuê xe
  const cus1 = await prisma.customer.upsert({
    where: { phone: '0901112233' },
    update: {},
    create: {
      fullName: 'Trần Văn Khách',
      phone: '0901112233',
      idCardNumber: '048099887766',
      drivingLicense: 'B2-112233',
      address: '120 Hoàng Minh Thảo, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  const cus2 = await prisma.customer.upsert({
    where: { phone: '0903456789' },
    update: {},
    create: {
      fullName: 'Lê Hoàng Nam',
      phone: '0903456789',
      idCardNumber: '048099778899',
      drivingLicense: 'FC-998877',
      address: '456 Lê Duẩn, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  const cus3 = await prisma.customer.upsert({
    where: { phone: '0988222111' },
    update: {},
    create: {
      fullName: 'Hoàng Minh Trí',
      phone: '0988222111',
      idCardNumber: '048099112233',
      drivingLicense: 'B2-554433',
      address: '78 Nguyễn Văn Linh, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  const cus4 = await prisma.customer.upsert({
    where: { phone: '0912333444' },
    update: {},
    create: {
      fullName: 'Cty Du Lịch Á Châu',
      phone: '0912333444',
      idCardNumber: '048099334455',
      drivingLicense: 'D-887766',
      address: '12 Bạch Đằng, Đà Nẵng',
      organizationId: orgA.id,
    },
  });

  // 5. Xe mẫu cho CTA2026
  const veh1 = await prisma.vehicle.upsert({
    where: { licensePlate: '43A-999.88' },
    update: {},
    create: {
      licensePlate: '43A-999.88',
      brand: 'VinFast',
      model: 'VF8',
      vehicleType: 'Car',
      organizationId: orgA.id,
      status: 'RENTED',
      movementStatus: 'MOVING',
      lastLatitude: 16.0610,
      lastLongitude: 108.2170,
      lastSpeed: 48.5,
      lastSeenAt: new Date(),
    },
  });

  const veh2 = await prisma.vehicle.upsert({
    where: { licensePlate: '43C-678.90' },
    update: {},
    create: {
      licensePlate: '43C-678.90',
      brand: 'Hyundai',
      model: 'HD120',
      vehicleType: 'Truck',
      organizationId: orgA.id,
      status: 'RENTED',
      movementStatus: 'MOVING',
      lastLatitude: 16.0680,
      lastLongitude: 108.2435,
      lastSpeed: 55.0,
      lastSeenAt: new Date(),
    },
  });

  const veh3 = await prisma.vehicle.upsert({
    where: { licensePlate: '92A-345.67' },
    update: {},
    create: {
      licensePlate: '92A-345.67',
      brand: 'Mazda',
      model: 'CX-5',
      vehicleType: 'Car',
      organizationId: orgA.id,
      status: 'RENTED',
      movementStatus: 'STOPPED',
      lastLatitude: 16.0550,
      lastLongitude: 108.2030,
      lastSpeed: 0.0,
      lastSeenAt: new Date(),
    },
  });

  const veh4 = await prisma.vehicle.upsert({
    where: { licensePlate: '43B-888.99' },
    update: {},
    create: {
      licensePlate: '43B-888.99',
      brand: 'Ford',
      model: 'Transit',
      vehicleType: 'Van',
      organizationId: orgA.id,
      status: 'RENTED',
      movementStatus: 'MOVING',
      lastLatitude: 16.0750,
      lastLongitude: 108.2400,
      lastSpeed: 62.0,
      lastSeenAt: new Date(),
    },
  });

  // Xe nằm kho và xe bảo dưỡng (được ẩn tự động trên màn hình Giám sát)
  await prisma.vehicle.upsert({
    where: { licensePlate: '43A-123.45' },
    update: {},
    create: {
      licensePlate: '43A-123.45',
      brand: 'VinFast',
      model: 'VF8',
      vehicleType: 'Car',
      organizationId: orgA.id,
      status: 'AVAILABLE',
      movementStatus: 'STOPPED',
      lastLatitude: 16.0544,
      lastLongitude: 108.2022,
      lastSpeed: 0,
    },
  });

  await prisma.vehicle.upsert({
    where: { licensePlate: '43B-555.55' },
    update: {},
    create: {
      licensePlate: '43B-555.55',
      brand: 'Toyota',
      model: 'Fortuner',
      vehicleType: 'Car',
      organizationId: orgA.id,
      status: 'MAINTENANCE',
      movementStatus: 'STOPPED',
      lastLatitude: 16.0400,
      lastLongitude: 108.1900,
      lastSpeed: 0,
    },
  });

  // 6. Hợp đồng thuê ACTIVE cho 4 xe (Luôn cập nhật đúng thời gian và ghi chú để đồng bộ với UI)
  let contract1 = await prisma.rentalContract.findFirst({
    where: { vehicleId: veh1.id, status: 'ACTIVE' },
  });
  const contract1Data = {
    customerId: cus1.id,
    vehicleId: veh1.id,
    createdByStaffId: staffA.id,
    organizationId: orgA.id,
    startTime: new Date('2026-10-31T08:00:00.000Z'),
    endTime: new Date('2026-11-04T20:00:00.000Z'),
    status: 'ACTIVE',
    price: 3600000,
    depositAmount: 10000000,
    notes: 'Hợp đồng thuê 5 ngày xe VinFast VF8 phục vụ đối tác ngoại giao',
  };
  if (!contract1) {
    contract1 = await prisma.rentalContract.create({ data: contract1Data });
  } else {
    contract1 = await prisma.rentalContract.update({
      where: { id: contract1.id },
      data: contract1Data,
    });
  }

  let contract2 = await prisma.rentalContract.findFirst({
    where: { vehicleId: veh2.id, status: 'ACTIVE' },
  });
  const contract2Data = {
    customerId: cus2.id,
    vehicleId: veh2.id,
    createdByStaffId: staffA.id,
    organizationId: orgA.id,
    startTime: new Date('2026-10-29T07:00:00.000Z'),
    endTime: new Date('2026-11-04T19:00:00.000Z'),
    status: 'ACTIVE',
    price: 8000000,
    depositAmount: 15000000,
    notes: 'Hợp đồng vận chuyển 7 ngày tuyến liên tỉnh miền Trung',
  };
  if (!contract2) {
    contract2 = await prisma.rentalContract.create({ data: contract2Data });
  } else {
    contract2 = await prisma.rentalContract.update({
      where: { id: contract2.id },
      data: contract2Data,
    });
  }

  let contract3 = await prisma.rentalContract.findFirst({
    where: { vehicleId: veh3.id, status: 'ACTIVE' },
  });
  const contract3Data = {
    customerId: cus3.id,
    vehicleId: veh3.id,
    createdByStaffId: staffA.id,
    organizationId: orgA.id,
    startTime: new Date('2026-11-01T10:00:00.000Z'),
    endTime: new Date('2026-11-04T12:00:00.000Z'),
    status: 'ACTIVE',
    price: 2400000,
    depositAmount: 8000000,
    notes: 'Hợp đồng du lịch gia đình 4 ngày trải nghiệm Đà Nẵng - Hội An',
  };
  if (!contract3) {
    contract3 = await prisma.rentalContract.create({ data: contract3Data });
  } else {
    contract3 = await prisma.rentalContract.update({
      where: { id: contract3.id },
      data: contract3Data,
    });
  }

  let contract4 = await prisma.rentalContract.findFirst({
    where: { vehicleId: veh4.id, status: 'ACTIVE' },
  });
  const contract4Data = {
    customerId: cus4.id,
    vehicleId: veh4.id,
    createdByStaffId: staffA.id,
    organizationId: orgA.id,
    startTime: new Date('2026-11-01T06:00:00.000Z'),
    endTime: new Date('2026-11-08T18:00:00.000Z'),
    status: 'ACTIVE',
    price: 12000000,
    depositAmount: 20000000,
    notes: 'Hợp đồng đoàn du lịch 8 ngày tham quan danh lam thắng cảnh',
  };
  if (!contract4) {
    contract4 = await prisma.rentalContract.create({ data: contract4Data });
  } else {
    contract4 = await prisma.rentalContract.update({
      where: { id: contract4.id },
      data: contract4Data,
    });
  }

  // 7. Monitoring Session cho Hợp đồng 1 (Xe duy nhất có vi phạm)
  let session1 = await prisma.monitoringSession.findFirst({
    where: { contractId: contract1.id, status: 'ACTIVE' },
  });
  if (!session1) {
    session1 = await prisma.monitoringSession.create({
      data: {
        contractId: contract1.id,
        vehicleId: veh1.id,
        startedAt: new Date('2026-10-31T08:00:00.000Z'),
        status: 'ACTIVE',
      },
    });
  }

  // 8. Tạo đúng 14 cảnh báo AI thực tế gắn với ảnh từ test_yolo/bang_chung cho đúng xe 1 (VinFast)
  for (const item of REAL_EVIDENCE_FILES) {
    const occurredAt = new Date(item.occurredAtISO);
    const rawName = item.file.replace(/\.jpg$/i, '');
    const eventId = rawName.length > 50 ? rawName.slice(-50) : rawName;
    await prisma.alert.upsert({
      where: { eventId },
      update: {
        occurredAt,
        monitoringSessionId: session1.id,
        vehicleId: veh1.id,
        resolutionNote: `/evidence/${item.file}`,
      },
      create: {
        eventId,
        organizationId: orgA.id,
        vehicleId: veh1.id,
        monitoringSessionId: session1.id,
        alertType: item.type,
        severityLevel: item.severity,
        drowsinessScore: item.score,
        latitude: item.lat,
        longitude: item.lng,
        resolutionStatus: 'NEW',
        resolutionNote: `/evidence/${item.file}`,
        occurredAt,
      },
    });
  }

  console.log('✅ Đã tạo 14 Cảnh báo AI thực tế gắn ảnh từ bang_chung cho CTA2026');
  console.log('🎉 Seed dữ liệu mẫu chuẩn hoàn tất 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
