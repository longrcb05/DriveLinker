/**
 * @file vehicleService.ts
 * @description Unified Vehicle Service & Storage Adapter for DriveLinker.
 * Quản lý phương tiện tập trung, phân lập dữ liệu đa doanh nghiệp (tenantId)
 * và tuân thủ máy trạng thái hữu hạn 6 cấp độ nghiêm ngặt.
 * Hỗ trợ lưu trực tiếp vào cơ sở dữ liệu PostgreSQL qua Backend API.
 */

import axiosClient from '../api/axiosClient';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'RENTED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'PENDING_INSPECTION'
  | 'INACTIVE';

export interface VehicleReservation {
  customerName: string;
  phone: string;
  idCard?: string;
  startDate: string;
  endDate: string;
  deposit?: number;
  notes?: string;
}

export interface Vehicle {
  id: string; // Biển số xe hoặc mã định danh duy nhất (VD: '43A-999.88')
  plate: string;
  brand: string;
  model: string;
  year: number;
  payload: string;
  status: VehicleStatus;
  driver?: string;
  driverPhone?: string;
  speed?: string;
  lat?: number;
  lng?: number;
  gpsOnline?: boolean;
  cameraOnline?: boolean;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  reservationInfo?: VehicleReservation;
}

export interface VehicleFilter {
  status?: VehicleStatus | 'ALL';
  search?: string;
}

const STORAGE_KEY = 'sys_vehicles';

// Dữ liệu hạt giống mặc định đồng bộ 100% với Overview, Tracking, Contracts & Database
const SEED_VEHICLES: Vehicle[] = [
  // --- COMPANY_A (Đà Nẵng & Miền Trung) ---
  {
    id: '43A-999.88',
    plate: '43A-999.88',
    brand: 'VinFast',
    model: 'VF8 Plus',
    year: 2024,
    payload: '5 Chỗ Điện VIP',
    status: 'RENTED',
    driver: 'Trần Văn Khách (Đà Nẵng)',
    driverPhone: '0901.112.233',
    speed: '48.5 km/h',
    lat: 16.0610,
    lng: 108.2170,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    notes: 'Hợp đồng HD-2026-001 đang vận hành, gắn camera AI DMS.',
  },
  {
    id: '43C-678.90',
    plate: '43C-678.90',
    brand: 'Hyundai',
    model: 'HD120',
    year: 2023,
    payload: 'Xe Tải 8 Tấn',
    status: 'RENTED',
    driver: 'Lê Hoàng Nam',
    driverPhone: '0905.987.654',
    speed: '55.0 km/h',
    lat: 16.0680,
    lng: 108.2435,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now(),
    notes: 'Hợp đồng HD-2026-002 tuyến vận chuyển liên tỉnh.',
  },
  {
    id: '92A-345.67',
    plate: '92A-345.67',
    brand: 'Mazda',
    model: 'CX-5 Premium',
    year: 2023,
    payload: 'Crossover 5 Chỗ',
    status: 'RENTED',
    driver: 'Hoàng Minh Trí',
    driverPhone: '0912.111.222',
    speed: '0 km/h',
    lat: 16.0550,
    lng: 108.2030,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now(),
    notes: 'Hợp đồng HD-2026-003 du lịch gia đình Đà Nẵng - Hội An.',
  },
  {
    id: '43B-888.99',
    plate: '43B-888.99',
    brand: 'Ford',
    model: 'Transit 16 Chỗ',
    year: 2024,
    payload: '16 Chỗ Du Lịch',
    status: 'RENTED',
    driver: 'Cty Du Lịch Á Châu',
    driverPhone: '0912.333.444',
    speed: '62.0 km/h',
    lat: 16.0750,
    lng: 108.2400,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now(),
    notes: 'Hợp đồng HD-2026-004 tour tham quan miền Trung.',
  },
  {
    id: '43A-123.45',
    plate: '43A-123.45',
    brand: 'VinFast',
    model: 'VF8 Eco',
    year: 2024,
    payload: '5 Chỗ Điện',
    status: 'AVAILABLE',
    driver: 'Chưa xếp tài',
    driverPhone: '',
    speed: '0 km/h',
    lat: 16.0544,
    lng: 108.2022,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now(),
    notes: 'Xe sẵn sàng xuất kho đón khách thuê mới.',
  },
  {
    id: '43B-555.55',
    plate: '43B-555.55',
    brand: 'Toyota',
    model: 'Fortuner Legender',
    year: 2022,
    payload: 'SUV 7 Chỗ',
    status: 'MAINTENANCE',
    driver: 'Đang bảo dưỡng định kỳ',
    driverPhone: '',
    speed: '0 km/h',
    lat: 16.0400,
    lng: 108.1900,
    gpsOnline: false,
    cameraOnline: false,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
    notes: 'Bảo dưỡng định kỳ 40.000km, thay dầu nhớt và kiểm tra hệ thống phanh ABS.',
  },
  {
    id: '43A-112.22',
    plate: '43A-112.22',
    brand: 'Hyundai',
    model: 'Solati 16 Chỗ',
    year: 2024,
    payload: '16 Chỗ VIP',
    status: 'RESERVED',
    driver: 'Chưa xếp tài',
    driverPhone: '',
    speed: '0 km/h',
    lat: 16.0544,
    lng: 108.2021,
    gpsOnline: true,
    cameraOnline: false,
    tenantId: 'COMPANY_A',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    notes: 'Khách hàng đặt trước nhận xe ngày 05/11.',
    reservationInfo: {
      customerName: 'Công ty CP Xây Dựng Miền Trung',
      phone: '0935.123.456',
      idCard: '048099665544',
      startDate: '2026-11-05 08:00',
      endDate: '2026-11-20 18:00',
      deposit: 10000000,
      notes: 'Hợp đồng tạm thuê 15 ngày phục vụ công trình dự án.',
    },
  },

  // --- COMPANY_B (Hồ Chí Minh) ---
  {
    id: '51F-888.11',
    plate: '51F-888.11',
    brand: 'Volvo',
    model: 'FH16 750',
    year: 2024,
    payload: 'Đầu kéo 30 Tấn',
    status: 'RENTED',
    driver: 'Phạm Văn D',
    driverPhone: '0988.777.666',
    speed: '50 km/h',
    lat: 10.762622,
    lng: 106.660172,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_B',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
  {
    id: '51G-999.22',
    plate: '51G-999.22',
    brand: 'Thaco',
    model: 'Mobihome 36 Phòng',
    year: 2023,
    payload: 'Xe Khách 36 Chỗ',
    status: 'AVAILABLE',
    driver: 'Hoàng Thị E',
    driverPhone: '0977.666.555',
    speed: '0 km/h',
    lat: 10.775000,
    lng: 106.700000,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_B',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now(),
  },

  // --- COMPANY_C (Hà Nội) ---
  {
    id: '29A-111.11',
    plate: '29A-111.11',
    brand: 'Ford',
    model: 'Ranger Raptor',
    year: 2024,
    payload: 'Bán Tải 1 Tấn',
    status: 'RENTED',
    driver: 'Vũ Thị H',
    driverPhone: '0966.555.444',
    speed: '35 km/h',
    lat: 21.028511,
    lng: 105.804817,
    gpsOnline: true,
    cameraOnline: true,
    tenantId: 'COMPANY_C',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
  },
];

const VEHICLE_STORAGE_VERSION = 'v4_20261104_unified';

class VehicleService {
  private initStorage(): Vehicle[] {
    const version = localStorage.getItem('sys_vehicle_seed_version');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || version !== VEHICLE_STORAGE_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
      localStorage.setItem('sys_vehicle_seed_version', VEHICLE_STORAGE_VERSION);
      return SEED_VEHICLES;
    }
    try {
      const parsed = JSON.parse(raw);
      // Nếu số lượng xe của COMPANY_A chưa đủ 7 xe chuẩn hoặc thiếu xe 43A-999.88, làm mới danh sách seed
      const compACount = parsed.filter((v: Vehicle) => v.tenantId === 'COMPANY_A').length;
      const hasCoreCar = parsed.some((v: Vehicle) => v.plate === '43A-999.88');
      if (compACount < 7 || !hasCoreCar) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
        localStorage.setItem('sys_vehicle_seed_version', VEHICLE_STORAGE_VERSION);
        return SEED_VEHICLES;
      }
      return parsed;
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
      localStorage.setItem('sys_vehicle_seed_version', VEHICLE_STORAGE_VERSION);
      return SEED_VEHICLES;
    }
  }

  private lastFetchTime = 0;
  private inFlightFetch: Promise<Vehicle[]> | null = null;
  private syncedPlates = new Set<string>();

  private saveStorage(vehicles: Vehicle[], notify: boolean = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    if (notify) {
      window.dispatchEvent(new CustomEvent('dl_vehicles_updated', { detail: vehicles }));
    }
  }

  async getFleetList(tenantId: string): Promise<Vehicle[]> {
    return this.getVehicles(tenantId);
  }

  async updateVehicleStatus(
    tenantId: string,
    plateOrId: string,
    targetStatus: VehicleStatus,
    reason?: string
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(tenantId, plateOrId);
    if (!vehicle) throw new Error('Không tìm thấy phương tiện.');
    return this.updateVehicle(tenantId, vehicle.id, {
      status: targetStatus,
      notes: reason ? `${vehicle.notes || ''} [${new Date().toLocaleDateString('vi-VN')}]: ${reason}`.trim() : vehicle.notes,
    });
  }

  async getVehicles(tenantId: string, filter?: VehicleFilter): Promise<Vehicle[]> {
    const now = Date.now();
    // Cache chống spam 2.5s nếu không có bộ lọc tìm kiếm
    if (!filter && this.inFlightFetch) {
      return this.inFlightFetch;
    }

    const fetchAction = async (): Promise<Vehicle[]> => {
      try {
        const res = await axiosClient.get('/vehicles');
      const apiVehicles = res.data?.data || res.data;
      if (Array.isArray(apiVehicles) && apiVehicles.length > 0) {
        const localList = this.initStorage();
        const localMap = new Map<string, Vehicle>();
        localList.forEach((v) => {
          localMap.set(v.plate.toUpperCase(), v);
        });

        const apiMergedVehicles: Vehicle[] = apiVehicles.map((bv: any) => {
          const plateClean = (bv.licensePlate || '').toUpperCase();
          const cached = localMap.get(plateClean);

          const payload = bv.vehicleType || cached?.payload || 'Xe Tải 5 Tấn';

          return {
            id: String(bv.id || bv.licensePlate),
            plate: bv.licensePlate,
            brand: bv.brand || cached?.brand || 'Hyundai',
            model: bv.model || cached?.model || 'Thương mại',
            year: cached?.year || 2024,
            payload: payload,
            status: (bv.status || cached?.status || 'AVAILABLE') as VehicleStatus,
            driver: cached?.driver || 'Chưa xếp tài',
            driverPhone: cached?.driverPhone || '',
            speed: bv.lastSpeed ? `${bv.lastSpeed} km/h` : (cached?.speed || '0 km/h'),
            lat: bv.lastLatitude ?? cached?.lat ?? 16.0544,
            lng: bv.lastLongitude ?? cached?.lng ?? 108.2022,
            gpsOnline: cached ? cached.gpsOnline : true,
            cameraOnline: cached ? cached.cameraOnline : true,
            tenantId: tenantId,
            createdAt: bv.createdAt ? new Date(bv.createdAt).getTime() : (cached?.createdAt || Date.now()),
            updatedAt: Date.now(),
            notes: cached?.notes || '',
            reservationInfo: cached?.reservationInfo,
          };
        });

        // Bảo tồn các xe tạo thủ công local chưa kịp lên DB (như 43A-28006)
        const apiPlates = new Set(apiVehicles.map((bv: any) => (bv.licensePlate || '').toUpperCase()));
        const locallyCreatedVehicles = localList.filter(
          (v) =>
            v.tenantId === tenantId &&
            !apiPlates.has(v.plate.toUpperCase()) &&
            !SEED_VEHICLES.some((sv) => sv.plate === v.plate)
        );

        // Đồng bộ ngầm các xe tạo thủ công lên CSDL PostgreSQL (chỉ gửi 1 lần duy nhất)
        for (const locV of locallyCreatedVehicles) {
          const plateUp = locV.plate.toUpperCase();
          if (!this.syncedPlates.has(plateUp)) {
            this.syncedPlates.add(plateUp);
            axiosClient
              .post('/vehicles', {
                licensePlate: locV.plate,
                brand: locV.brand,
                model: locV.model,
                vehicleType: locV.payload?.toLowerCase().includes('tải') ? 'Truck' : 'Car',
                status: locV.status,
              })
              .catch(() => {
                this.syncedPlates.delete(plateUp);
              });
          }
        }

        const merged: Vehicle[] = [...apiMergedVehicles, ...locallyCreatedVehicles];

        // Bảo tồn các xe thuộc tenant khác trong localStorage nếu có
        const otherTenantVehicles = localList.filter((v) => v.tenantId !== tenantId);
        const newTotalStorage = [...merged, ...otherTenantVehicles];
        this.saveStorage(newTotalStorage, false);

        let result = merged;
        if (filter?.status && filter.status !== 'ALL') {
          result = result.filter((v) => v.status === filter.status);
        }

        if (filter?.search) {
          const q = filter.search.toLowerCase().trim();
          result = result.filter(
            (v) =>
              v.plate.toLowerCase().includes(q) ||
              v.brand.toLowerCase().includes(q) ||
              v.model.toLowerCase().includes(q) ||
              (v.driver && v.driver.toLowerCase().includes(q))
          );
        }

        return result;
      }
    } catch (err) {
      console.warn('[VehicleService] Lỗi kết nối API /vehicles, sử dụng bộ đệm LocalStorage:', err);
    }

      // Fallback: Khi mất mạng hoặc chưa gọi được BE
      const all = this.initStorage();
      let tenantVehicles = all.filter((v) => v.tenantId === tenantId);

      if (filter?.status && filter.status !== 'ALL') {
        tenantVehicles = tenantVehicles.filter((v) => v.status === filter.status);
      }

      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        tenantVehicles = tenantVehicles.filter(
          (v) =>
            v.plate.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            (v.driver && v.driver.toLowerCase().includes(q))
        );
      }

      return tenantVehicles;
    };

    if (!filter) {
      this.inFlightFetch = fetchAction().finally(() => {
        setTimeout(() => {
          this.inFlightFetch = null;
        }, 1500);
      });
      return this.inFlightFetch;
    }

    return fetchAction();
  }

  async getVehicleById(tenantId: string, id: string): Promise<Vehicle | null> {
    const all = this.initStorage();
    return all.find(v => v.tenantId === tenantId && (v.id === id || v.plate === id)) || null;
  }

  async createVehicle(
    tenantId: string,
    data: {
      plate: string;
      brand: string;
      model: string;
      year: number;
      payload: string;
      status?: VehicleStatus;
      driver?: string;
      driverPhone?: string;
      notes?: string;
    }
  ): Promise<Vehicle> {
    const all = this.initStorage();
    const cleanPlate = data.plate.trim().toUpperCase();

    const isDuplicate = all.some(
      v => v.tenantId === tenantId && v.plate.toUpperCase() === cleanPlate
    );
    if (isDuplicate) {
      throw new Error(`Biển số xe ${cleanPlate} đã tồn tại trong hệ thống của doanh nghiệp.`);
    }

    const newVehicle: Vehicle = {
      id: cleanPlate,
      plate: cleanPlate,
      brand: data.brand.trim() || 'Hyundai',
      model: data.model.trim() || 'Thương mại',
      year: Number(data.year) || new Date().getFullYear(),
      payload: data.payload.trim() || 'Xe Tải',
      status: data.status || 'AVAILABLE',
      driver: data.driver?.trim() || 'Chưa xếp tài',
      driverPhone: data.driverPhone?.trim() || '',
      speed: '0 km/h',
      lat: 16.0544,
      lng: 108.2022,
      gpsOnline: true,
      cameraOnline: false,
      tenantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: data.notes?.trim() || '',
    };

    all.unshift(newVehicle);
    this.saveStorage(all);

    // Lưu trực tiếp xuống cơ sở dữ liệu PostgreSQL qua Backend API
    try {
      await axiosClient.post('/vehicles', {
        licensePlate: cleanPlate,
        brand: data.brand.trim() || 'Hyundai',
        model: data.model.trim() || 'Thương mại',
        vehicleType: data.payload?.toLowerCase().includes('tải') ? 'Truck' : 'Car',
        status: data.status || 'AVAILABLE',
      });
      console.log(`[VehicleService] Đã lưu phương tiện ${cleanPlate} thành công vào PostgreSQL.`);
    } catch (apiErr) {
      console.warn('[VehicleService] Lưu backend thất bại, fallback lưu LocalStorage:', apiErr);
    }

    return newVehicle;
  }

  async updateVehicle(
    tenantId: string,
    id: string,
    data: Partial<Omit<Vehicle, 'id' | 'tenantId' | 'createdAt'>>
  ): Promise<Vehicle> {
    const all = this.initStorage();
    const index = all.findIndex(v => v.tenantId === tenantId && (v.id === id || v.plate === id));

    if (index === -1) {
      throw new Error('Không tìm thấy phương tiện để cập nhật.');
    }

    // Cho phép các bước chuyển trạng thái hợp lệ trong quy trình vận hành và thu hồi xe
    const allowedFromRented = ['PENDING_INSPECTION', 'AVAILABLE', 'MAINTENANCE', 'RENTED'];
    if (all[index].status === 'RENTED' && data.status && !allowedFromRented.includes(data.status)) {
      throw new Error('Xe đang trong hợp đồng thuê thực tế, chỉ có thể chuyển sang Chờ kiểm định hoặc Bảo dưỡng.');
    }

    const updated: Vehicle = {
      ...all[index],
      ...data,
      updatedAt: Date.now(),
    };

    all[index] = updated;
    this.saveStorage(all);

    // Cập nhật trạng thái xuống PostgreSQL
    try {
      await axiosClient.put(`/vehicles/${encodeURIComponent(id)}`, {
        status: data.status,
        brand: data.brand,
        model: data.model,
        vehicleType: data.payload,
      });
      console.log(`[VehicleService] Đã cập nhật phương tiện ${id} vào PostgreSQL.`);
    } catch (apiErr) {
      console.warn('[VehicleService] Cập nhật backend thất bại, fallback lưu LocalStorage:', apiErr);
    }

    return updated;
  }

  /**
   * Hoàn thành bảo trì xe: Chuyển trực tiếp từ MAINTENANCE sang AVAILABLE
   */
  async completeMaintenance(tenantId: string, vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(tenantId, vehicleId);
    if (!vehicle) throw new Error('Không tìm thấy xe.');

    return this.updateVehicle(tenantId, vehicleId, {
      status: 'AVAILABLE',
      driver: 'Chưa xếp tài',
      notes: `${vehicle.notes || ''} [Đã hoàn tất bảo dưỡng ngày ${new Date().toLocaleDateString('vi-VN')}]`.trim(),
    });
  }

  /**
   * Nghiệm thu xe sau thu hồi (BE-4): Chuyển PENDING_INSPECTION sang AVAILABLE hoặc MAINTENANCE
   */
  async inspectVehicle(
    tenantId: string,
    vehicleId: string,
    result: 'PASS' | 'FAIL',
    notes: string
  ): Promise<Vehicle> {
    const targetStatus: VehicleStatus = result === 'PASS' ? 'AVAILABLE' : 'MAINTENANCE';

    try {
      await axiosClient.post(`/vehicles/${encodeURIComponent(vehicleId)}/inspect`, {
        result,
        notes,
      });
      console.log(`[VehicleService] Nghiệm thu ${result} cho xe ${vehicleId} vào PostgreSQL.`);
    } catch (apiErr) {
      console.warn('[VehicleService] Nghiệm thu backend thất bại, fallback lưu LocalStorage:', apiErr);
    }

    return this.updateVehicle(tenantId, vehicleId, {
      status: targetStatus,
      notes: `[Nghiệm thu ${result === 'PASS' ? 'Đạt' : 'Không đạt'} ${new Date().toLocaleDateString('vi-VN')}]: ${notes}`,
    });
  }

  /**
   * Đặt trước xe (Lên hợp đồng tạm)
   */
  async reserveVehicle(
    tenantId: string,
    vehicleId: string,
    reservation: VehicleReservation
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(tenantId, vehicleId);
    if (!vehicle) throw new Error('Không tìm thấy xe.');
    if (vehicle.status === 'RENTED') throw new Error('Xe đang cho thuê, không thể đặt trước.');

    const updated = await this.updateVehicle(tenantId, vehicleId, {
      status: 'RESERVED',
      reservationInfo: reservation,
      notes: `Đã đặt trước cho: ${reservation.customerName} (${reservation.phone})`,
    });

    // Tự động tạo bản nháp hợp đồng trong sys_contract_drafts
    try {
      const draftsRaw = localStorage.getItem('sys_contract_drafts');
      const drafts = draftsRaw ? JSON.parse(draftsRaw) : [];
      const newDraft = {
        id: `DRAFT-${Date.now().toString().slice(-6)}`,
        tenantId,
        customerName: reservation.customerName,
        customerPhone: reservation.phone,
        idCardNumber: reservation.idCard || '',
        carPlate: vehicle.plate,
        carModel: `${vehicle.brand} ${vehicle.model}`,
        rentStartDate: reservation.startDate,
        rentEndDate: reservation.endDate,
        depositAmount: reservation.deposit || 0,
        notes: reservation.notes || 'Hợp đồng tạm giữ chỗ phương tiện',
        createdAt: Date.now(),
        status: 'DRAFT',
      };
      drafts.unshift(newDraft);
      localStorage.setItem('sys_contract_drafts', JSON.stringify(drafts));
    } catch (e) {
      console.warn('Lỗi lưu nháp hợp đồng:', e);
    }

    return updated;
  }

  async deleteVehicle(tenantId: string, id: string): Promise<boolean> {
    const all = this.initStorage();
    const target = all.find(v => v.tenantId === tenantId && (v.id === id || v.plate === id));

    if (!target) throw new Error('Không tìm thấy phương tiện.');
    if (target.status === 'RENTED') {
      throw new Error('Không thể xóa xe đang trong trạng thái cho thuê.');
    }

    const filtered = all.filter(v => !(v.tenantId === tenantId && (v.id === id || v.plate === id)));
    this.saveStorage(filtered);

    // Xóa trong PostgreSQL qua Backend API
    try {
      await axiosClient.delete(`/vehicles/${encodeURIComponent(id)}`);
      console.log(`[VehicleService] Đã xóa phương tiện ${id} khỏi PostgreSQL.`);
    } catch (apiErr) {
      console.warn('[VehicleService] Xóa backend thất bại, fallback xóa LocalStorage:', apiErr);
    }

    return true;
  }

  async resetToSeed(tenantId: string): Promise<Vehicle[]> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VEHICLES));
    window.dispatchEvent(new Event('storage'));
    return SEED_VEHICLES.filter(v => v.tenantId === tenantId);
  }
}

export const vehicleService = new VehicleService();
