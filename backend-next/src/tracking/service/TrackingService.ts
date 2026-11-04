import prisma from '@/lib/prisma';

export interface ContractEvidenceOptions {
  date?: string;
  alertType?: string;
  page?: number;
  limit?: number;
}

export class TrackingService {
  /**
   * Tính toán các chỉ số vận hành Live Tracking (KPIs).
   * Chỉ tính trên các xe ĐANG CÓ HỢP ĐỒNG THUÊ HOẠT ĐỘNG (status: 'ACTIVE').
   */
  static async getKpi(organizationId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        organizationId,
        rentalContracts: {
          some: {
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        movementStatus: true,
        status: true,
        lastSeenAt: true,
        lastSpeed: true,
      },
    });

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    let rollingCount = 0;
    let stoppedCount = 0;
    let parkedCount = 0;
    let offlineCount = 0;

    for (const v of vehicles) {
      const isOnline = v.lastSeenAt && v.lastSeenAt >= tenMinutesAgo;
      if (!isOnline) {
        offlineCount++;
      } else if (v.movementStatus === 'MOVING' || (v.lastSpeed && v.lastSpeed > 0)) {
        rollingCount++;
      } else if (v.movementStatus === 'STOPPED') {
        stoppedCount++;
      } else {
        parkedCount++;
      }
    }

    const activeAlertsCount = await prisma.alert.count({
      where: {
        organizationId,
        resolutionStatus: 'NEW',
        vehicle: {
          rentalContracts: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      },
    });

    return {
      totalVehicles: vehicles.length,
      rollingCount,
      stoppedCount,
      parkedCount,
      offlineCount,
      activeAlertsCount,
    };
  }

  /**
   * Lấy vị trí thời gian thực và thông tin chi tiết các phương tiện.
   * CHỈ hiển thị các xe ĐÃ LÊN HỢP ĐỒNG THUÊ CHO KHÁCH (status: 'ACTIVE').
   */
  static async getPositions(organizationId: number) {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        organizationId,
        rentalContracts: {
          some: {
            status: 'ACTIVE',
          },
        },
      },
      include: {
        devices: {
          select: {
            id: true,
            deviceCode: true,
            status: true,
            deviceType: true,
          },
        },
        rentalContracts: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                idCardNumber: true,
                drivingLicense: true,
                address: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { licensePlate: 'asc' },
    });

    return vehicles.map((v) => {
      const activeContract = v.rentalContracts[0] || null;
      const primaryDevice = v.devices[0] || null;

      return {
        id: v.id,
        plateNumber: v.licensePlate,
        model: v.model || 'N/A',
        make: v.brand || 'N/A',
        vehicleType: v.vehicleType || 'Car',
        status: v.status,
        movementStatus: v.movementStatus || 'STOPPED',
        latitude: v.lastLatitude ? Number(v.lastLatitude) : null,
        longitude: v.lastLongitude ? Number(v.lastLongitude) : null,
        speed: v.lastSpeed ? Number(v.lastSpeed) : 0,
        lastSeenAt: v.lastSeenAt ? v.lastSeenAt.toISOString() : null,
        device: primaryDevice
          ? {
              id: primaryDevice.id,
              serialNumber: primaryDevice.deviceCode,
              status: primaryDevice.status,
              model: primaryDevice.deviceType,
            }
          : null,
        currentContract: activeContract
          ? {
              contractId: activeContract.id,
              contractNumber: `HD-${activeContract.id}`,
              customerName: activeContract.customer?.fullName || 'Khách vãng lai',
              customerPhone: activeContract.customer?.phone || 'N/A',
              customerIdCard: activeContract.customer?.idCardNumber || 'N/A',
              customerLicense: activeContract.customer?.drivingLicense || 'N/A',
              customerAddress: activeContract.customer?.address || 'N/A',
              startTime: activeContract.startTime.toISOString(),
              endTime: activeContract.endTime.toISOString(),
              price: activeContract.price,
              depositAmount: activeContract.depositAmount,
              notes: activeContract.notes,
              status: activeContract.status,
            }
          : null,
      };
    });
  }

  /**
   * Lấy kho hình ảnh bằng chứng vi phạm khi xe thuê nhiều ngày.
   * Hỗ trợ lọc theo ngày trong chu kỳ hợp đồng, phân loại vi phạm và phân trang.
   */
  static async getContractEvidence(
    organizationId: number,
    contractId: number,
    options: ContractEvidenceOptions = {}
  ) {
    const contract = await prisma.rentalContract.findFirst({
      where: {
        id: contractId,
        organizationId,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!contract) {
      throw new Error(`Không tìm thấy hợp đồng thuê #${contractId} thuộc doanh nghiệp.`);
    }

    // Xây dựng điều kiện lọc Alert
    const whereCondition: any = {
      organizationId,
      monitoringSession: {
        contractId,
      },
    };

    if (options.alertType && options.alertType !== 'ALL') {
      whereCondition.alertType = options.alertType.toUpperCase();
    }

    if (options.date) {
      const startOfDay = new Date(`${options.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${options.date}T23:59:59.999Z`);
      whereCondition.occurredAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // 1. Đếm tổng số lượng và thống kê theo từng ngày thuê
    const allAlertsForSummary = await prisma.alert.findMany({
      where: {
        organizationId,
        monitoringSession: { contractId },
      },
      select: {
        occurredAt: true,
        alertType: true,
      },
    });

    const byDate: Record<string, number> = {};
    const byType: Record<string, number> = {};

    allAlertsForSummary.forEach((a) => {
      const dateKey = a.occurredAt.toISOString().split('T')[0];
      byDate[dateKey] = (byDate[dateKey] || 0) + 1;
      byType[a.alertType] = (byType[a.alertType] || 0) + 1;
    });

    // 2. Phân trang
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(50, options.limit || 12));
    const skip = (page - 1) * limit;

    const totalFiltered = await prisma.alert.count({ where: whereCondition });
    const alerts = await prisma.alert.findMany({
      where: whereCondition,
      orderBy: { occurredAt: 'desc' },
      skip,
      take: limit,
      include: {
        vehicle: {
          select: { licensePlate: true, brand: true, model: true },
        },
      },
    });

    const items = alerts.map((a) => {
      let evidenceUrl = `/uploads/evidence/${organizationId}/contracts/${contractId}/${a.occurredAt.toISOString().split('T')[0]}/${a.eventId}.jpg`;
      
      // Nếu có lưu đường dẫn trong resolutionNote
      if (a.resolutionNote && a.resolutionNote.startsWith('/')) {
        evidenceUrl = a.resolutionNote;
      }

      return {
        alertId: a.id.toString(),
        eventId: a.eventId,
        alertType: a.alertType,
        severityLevel: a.severityLevel,
        drowsinessScore: a.drowsinessScore,
        latitude: a.latitude,
        longitude: a.longitude,
        speed: 45.0, // fallback
        occurredAt: a.occurredAt.toISOString(),
        resolutionStatus: a.resolutionStatus,
        evidenceUrl,
      };
    });

    // Tính số ngày thuê
    const totalDays = Math.max(
      1,
      Math.ceil((contract.endTime.getTime() - contract.startTime.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      contract: {
        id: contract.id,
        contractCode: `HD-${contract.id}`,
        customerName: contract.customer.fullName,
        customerPhone: contract.customer.phone,
        vehiclePlate: contract.vehicle.licensePlate,
        vehicleModel: `${contract.vehicle.brand || ''} ${contract.vehicle.model || ''}`.trim(),
        startTime: contract.startTime.toISOString(),
        endTime: contract.endTime.toISOString(),
        totalDays,
      },
      summary: {
        totalEvidence: allAlertsForSummary.length,
        filteredCount: totalFiltered,
        byDate,
        byType,
      },
      items,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
    };
  }

  /**
   * Tạo nội dung Biên Bản Đối Soát Vi Phạm (PDF Printable Dossier) khi trả xe.
   */
  static async exportDossier(organizationId: number, contractId: number): Promise<string> {
    const evidenceData = await this.getContractEvidence(organizationId, contractId, { limit: 100 });
    const { contract, summary, items } = evidenceData;

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Biên Bản Đối Soát Vi Phạm An Toàn - ${contract.contractCode}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; font-size: 13px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
    .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 5px 0; color: #0f172a; }
    .subtitle { font-size: 12px; color: #64748b; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary-box { background: #fee2e2; border: 1px solid #f87171; border-radius: 8px; padding: 12px; margin-bottom: 20px; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    .sign-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; text-align: center; }
    .sign-box { margin-top: 70px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-weight: bold; font-size: 14px;">HỆ THỐNG QUẢN TRỊ XE CHO THUÊ DRIVELINKER TELEMATICS</div>
    <div class="title">BIÊN BẢN ĐỐI SOÁT VI PHẠM AN TOÀN LÁI XE & BẰNG CHỨNG HÌNH ẢNH</div>
    <div class="subtitle">Mã Hợp Đồng: ${contract.contractCode} • Ngày xuất: ${new Date().toLocaleString('vi-VN')}</div>
  </div>

  <div class="info-grid">
    <div>
      <p><b>Khách hàng thuê xe:</b> ${contract.customerName}</p>
      <p><b>Số điện thoại:</b> ${contract.customerPhone}</p>
      <p><b>Phương tiện:</b> ${contract.vehiclePlate} (${contract.vehicleModel})</p>
    </div>
    <div>
      <p><b>Thời hạn thuê:</b> ${contract.totalDays} ngày</p>
      <p><b>Thời gian bắt đầu:</b> ${new Date(contract.startTime).toLocaleString('vi-VN')}</p>
      <p><b>Thời gian kết thúc:</b> ${new Date(contract.endTime).toLocaleString('vi-VN')}</p>
    </div>
  </div>

  <div class="summary-box">
    <b>TỔNG KẾT VI PHẠM TRONG THỜI GIAN THUÊ XE:</b>
    <p style="margin: 5px 0 0 0;">
      Tổng số lần vi phạm an toàn ghi nhận được: <b>${summary.totalEvidence} lần</b>.<br>
      Phân loại: ${Object.entries(summary.byType).map(([k, v]) => `${k}: ${v} lần`).join(', ')}.
    </p>
  </div>

  <h3 style="margin-bottom: 5px;">DANH SÁCH BẰNG CHỨNG VI PHẠM CHI TIẾT THEO NGÀY:</h3>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Thời gian vi phạm</th>
        <th>Hành vi phát hiện</th>
        <th>Mức độ</th>
        <th>Tọa độ GPS</th>
        <th>Mã sự kiện / Bằng chứng</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${new Date(item.occurredAt).toLocaleString('vi-VN')}</td>
          <td><b>${item.alertType === 'DROWSINESS' ? '😴 Ngủ gật' : item.alertType === 'YAWN' ? '🥱 Ngáp sâu' : item.alertType}</b></td>
          <td style="color: ${item.severityLevel === 'CRITICAL' ? '#dc2626' : '#d97706'}; font-weight: bold;">${item.severityLevel}</td>
          <td>${item.latitude ? `${item.latitude.toFixed(4)}, ${item.longitude ? item.longitude.toFixed(4) : ''}` : 'Chưa có GPS'}</td>
          <td><code>${item.eventId}</code></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="sign-section">
    <div>
      <b>ĐẠI DIỆN BÊN CHO THUÊ</b><br>
      <i>(Ký và ghi rõ họ tên)</i>
      <div class="sign-box"></div>
    </div>
    <div>
      <b>KHÁCH HÀNG THUÊ XE</b><br>
      <i>(Ký xác nhận biên bản)</i>
      <div class="sign-box"></div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

export default TrackingService;
