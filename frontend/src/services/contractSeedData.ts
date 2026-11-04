/**
 * @file contractSeedData.ts
 * @description Dữ liệu mẫu khởi tạo cho Hợp đồng và Yêu cầu duyệt giá trên Frontend,
 * đồng bộ 1:1 với seed.ts trong Backend Next.js & PostgreSQL và ảnh từ bang_chung.
 */

export const INITIAL_SEED_CONTRACTS = [
  {
    id: 'HD-2026-001',
    partnerName: 'Trần Văn Khách (Đà Nẵng)',
    partnerPhone: '0901.112.233',
    customer: 'Trần Văn Khách (Đà Nẵng)',
    phone: '0901.112.233',
    idCard: '048099112233',
    cccdNumber: '048099112233',
    carPlate: '43A-999.88',
    vehiclePlate: '43A-999.88',
    carModel: 'VinFast VF8 Plus (2024)',
    vehicleName: 'VinFast VF8 Plus',
    rentStartDate: '2026-10-31 08:00',
    rentEndDate: '2026-11-04 20:00',
    startDate: '2026-10-31',
    endDate: '2026-11-04',
    value: '3.600.000 VNĐ',
    rentPrice: '3600000',
    price: 3600000,
    rentalPrice: 3600000,
    deposit: '10.000.000 VNĐ',
    depositAmount: 10000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: false,
    tenantId: 'COMPANY_A',
    notes: 'Hợp đồng thuê 5 ngày xe VinFast VF8 phục vụ đối tác ngoại giao. Gắn AI DMS giám sát hành trình.',
    evidenceList: [
      { file: 'NGU_GAT_(1.5s)_20261022_214414.jpg', type: 'DROWSINESS', score: 92, time: '2026-11-04 23:45' },
      { file: 'CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg', type: 'YAWN', score: 65, time: '2026-11-04 23:42' },
      { file: 'GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg', type: 'HEAD_DROP', score: 82, time: '2026-11-03 21:10' },
      { file: 'BUON_NGU_20261024_094018.jpg', type: 'DROWSINESS', score: 90, time: '2026-11-01 23:05' },
    ]
  },
  {
    id: 'HD-2026-002',
    partnerName: 'Công ty TNHH Vận tải Miền Trung',
    partnerPhone: '0905.987.654',
    customer: 'Công ty TNHH Vận tải Miền Trung',
    phone: '0905.987.654',
    idCard: '048099778899',
    cccdNumber: '048099778899',
    carPlate: '43C-678.90',
    vehiclePlate: '43C-678.90',
    carModel: 'Hyundai HD120 (2023)',
    vehicleName: 'Hyundai HD120',
    rentStartDate: '2026-10-29 07:00',
    rentEndDate: '2026-11-04 19:00',
    startDate: '2026-10-29',
    endDate: '2026-11-04',
    value: '8.000.000 VNĐ',
    rentPrice: '8000000',
    price: 8000000,
    rentalPrice: 8000000,
    deposit: '15.000.000 VNĐ',
    depositAmount: 15000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: false,
    tenantId: 'COMPANY_A',
    notes: 'Hợp đồng vận chuyển 7 ngày tuyến liên tỉnh miền Trung.',
  },
  {
    id: 'HD-2026-003',
    partnerName: 'Trần Thị Mai',
    partnerPhone: '0912.111.222',
    customer: 'Trần Thị Mai',
    phone: '0912.111.222',
    idCard: '048099556677',
    cccdNumber: '048099556677',
    carPlate: '92A-345.67',
    vehiclePlate: '92A-345.67',
    carModel: 'Mazda CX-5 Premium (2023)',
    vehicleName: 'Mazda CX-5',
    rentStartDate: '2026-11-01 10:00',
    rentEndDate: '2026-11-04 12:00',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    value: '2.200.000 VNĐ',
    rentPrice: '2200000',
    price: 2200000,
    rentalPrice: 2200000,
    deposit: '8.000.000 VNĐ',
    depositAmount: 8000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: false,
    tenantId: 'COMPANY_A',
    notes: 'Hợp đồng du lịch gia đình 4 ngày trải nghiệm Đà Nẵng - Hội An (Đã duyệt giảm 200k hỗ trợ con nhỏ).',
  },
  {
    id: 'HD-2026-004',
    partnerName: 'Cty Du Lịch Á Châu',
    partnerPhone: '0912.333.444',
    customer: 'Cty Du Lịch Á Châu',
    phone: '0912.333.444',
    idCard: '048099334455',
    cccdNumber: '048099334455',
    carPlate: '43B-888.99',
    vehiclePlate: '43B-888.99',
    carModel: 'Ford Transit 16 Chỗ (2024)',
    vehicleName: 'Ford Transit',
    rentStartDate: '2026-11-01 06:00',
    rentEndDate: '2026-11-08 18:00',
    startDate: '2026-11-01',
    endDate: '2026-11-08',
    value: '12.000.000 VNĐ',
    rentPrice: '12000000',
    price: 12000000,
    rentalPrice: 12000000,
    deposit: '20.000.000 VNĐ',
    depositAmount: 20000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: false,
    tenantId: 'COMPANY_A',
    notes: 'Hợp đồng đoàn du lịch 8 ngày tham quan danh lam thắng cảnh miền Trung.',
  },
  {
    id: 'HD-2026-005',
    partnerName: 'Công ty CP Xây Dựng Miền Trung',
    partnerPhone: '0935.123.456',
    customer: 'Công ty CP Xây Dựng Miền Trung',
    phone: '0935.123.456',
    idCard: '048099665544',
    cccdNumber: '048099665544',
    carPlate: '43A-123.45',
    vehiclePlate: '43A-123.45',
    carModel: 'VinFast VF8 Eco (2024)',
    vehicleName: 'VinFast VF8 Eco',
    rentStartDate: '2026-11-05 08:00',
    rentEndDate: '2026-11-20 18:00',
    startDate: '2026-11-05',
    endDate: '2026-11-20',
    value: '4.500.000 VNĐ',
    rentPrice: '4500000',
    price: 4500000,
    rentalPrice: 4500000,
    deposit: '10.000.000 VNĐ',
    depositAmount: 10000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: true,
    tenantId: 'COMPANY_A',
    notes: 'HĐ-XD: Hợp đồng thuê 15 ngày xe VinFast VF8 phục vụ công trình dự án. (Đang chờ duyệt giảm giá 600k).',
  },
  {
    id: 'HD-2026-006',
    partnerName: 'Nguyễn Hải Đăng',
    partnerPhone: '0978.999.888',
    customer: 'Nguyễn Hải Đăng',
    phone: '0978.999.888',
    idCard: '048099443322',
    cccdNumber: '048099443322',
    carPlate: '43C-678.90',
    vehiclePlate: '43C-678.90',
    carModel: 'Hyundai HD120 (2023)',
    vehicleName: 'Hyundai HD120',
    rentStartDate: '2026-11-06 07:00',
    rentEndDate: '2026-11-09 19:00',
    startDate: '2026-11-06',
    endDate: '2026-11-09',
    value: '3.000.000 VNĐ',
    rentPrice: '3000000',
    price: 3000000,
    rentalPrice: 3000000,
    deposit: '8.000.000 VNĐ',
    depositAmount: 8000000,
    status: 'OFFICIAL',
    type: 'E_CONTRACT',
    hasPendingRequest: true,
    tenantId: 'COMPANY_A',
    notes: 'HĐ-VP: Hợp đồng xe tải phục vụ chuyển văn phòng trọn gói. (Đang chờ duyệt giá giờ chót 2.6tr).',
  },
];

export const INITIAL_SEED_REQUESTS = [
  {
    id: 'REQ-001',
    contractId: 'HD-2026-005',
    staff: 'owner.an',
    reason: 'Khách hàng đối tác doanh nghiệp thuê dài hạn 15 ngày, đề xuất giảm 600.000đ để chốt hợp đồng dự án.',
    currentPrice: 4500000,
    suggestedPrice: 3900000,
    status: 'PENDING',
    createdAt: '2026-11-04 10:15:00',
  },
  {
    id: 'REQ-002',
    contractId: 'HD-2026-006',
    staff: 'owner.an',
    reason: 'Xe có lịch trống 3 ngày tới, nhân viên xin điều chỉnh giá giờ chót để tối ưu tỷ lệ vận hành xe.',
    currentPrice: 3000000,
    suggestedPrice: 2600000,
    status: 'PENDING',
    createdAt: '2026-11-04 11:30:00',
  },
  {
    id: 'REQ-003',
    contractId: 'HD-2026-003',
    staff: 'owner.an',
    reason: 'Khách hàng gia đình có trẻ nhỏ, xin chiết khấu 200.000đ hỗ trợ chi phí vệ sinh nội thất.',
    currentPrice: 2400000,
    suggestedPrice: 2200000,
    status: 'APPROVED',
    managerNote: 'Đồng ý hỗ trợ khách hàng thân thiết. Nhắc tài xế kiểm tra kỹ dây an toàn ghế trẻ em.',
    createdAt: '2026-11-02 13:00:00',
    reviewedAt: '2026-11-02 14:30:00',
  },
  {
    id: 'REQ-004',
    contractId: 'HD-2026-004',
    staff: 'owner.an',
    reason: 'Đoàn du lịch xin giảm 25% tổng đơn giá hợp đồng 8 ngày xe Ford Transit.',
    currentPrice: 12000000,
    suggestedPrice: 9000000,
    status: 'REJECTED',
    managerNote: 'Từ chối vì mức giảm vượt quá hạn mức tối đa cho phép (10%) đối với dòng xe 16 chỗ mùa cao điểm.',
    createdAt: '2026-11-01 15:20:00',
    reviewedAt: '2026-11-01 16:00:00',
  },
];

const CONTRACT_SEED_VERSION = 'v4_20261104_unified';

/**
 * Tự động đồng bộ seed dữ liệu vào LocalStorage nếu chưa có hoặc phiên bản cũ
 */
export function ensureInitialContractSeed(force: boolean = false) {
  const currentVersion = localStorage.getItem('sys_contract_seed_version');
  const existingContractsStr = localStorage.getItem('sys_e_contracts');
  let needRefresh = force || currentVersion !== CONTRACT_SEED_VERSION;

  if (!existingContractsStr) {
    needRefresh = true;
  } else {
    try {
      const parsed = JSON.parse(existingContractsStr);
      // Nếu danh sách rỗng hoặc có hợp đồng chưa có partnerName -> nạp lại
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].partnerName) {
        needRefresh = true;
      }
    } catch {
      needRefresh = true;
    }
  }

  let currentContracts = INITIAL_SEED_CONTRACTS;
  if (needRefresh) {
    localStorage.setItem('sys_e_contracts', JSON.stringify(INITIAL_SEED_CONTRACTS));
    localStorage.setItem('sys_contract_seed_version', CONTRACT_SEED_VERSION);
  } else {
    currentContracts = JSON.parse(localStorage.getItem('sys_e_contracts') || '[]');
  }

  const existingReqsStr = localStorage.getItem('sys_price_requests');
  let currentReqs = existingReqsStr ? JSON.parse(existingReqsStr) : [];
  if (needRefresh || !Array.isArray(currentReqs) || currentReqs.length === 0) {
    localStorage.setItem('sys_price_requests', JSON.stringify(INITIAL_SEED_REQUESTS));
    currentReqs = INITIAL_SEED_REQUESTS;
  }

  return { contracts: currentContracts, requests: currentReqs };
}
