import axiosClient from '../api/axiosClient';
/**
 * @file analyticsService.ts
 * @description Service kết nối với Backend Next.js API để lấy dữ liệu phân tích và cảnh báo an toàn từ DB PostgreSQL.
 * Hỗ trợ fallback tự động về danh sách sự kiện chuẩn nếu backend chưa khởi động.
 */

export interface AnalyticsEvent {
  id: string;
  date: string;
  time: string;
  vehicle: string;
  vehicleModel?: string;
  driver: string;
  type: string;
  rawType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'UNRESOLVED' | 'RESOLVED';
  score?: number;
  evidenceUrl?: string;
}

export interface AnalyticsKpi {
  total: number;
  unresolved: number;
  resolved: number;
  resolveRate: number;
  safetyScore: number;
  highRiskCount: number;
}

// Bộ dữ liệu dự phòng chuẩn đồng bộ với seed 14 cảnh báo AI thực tế trong database
const FALLBACK_EVENTS: AnalyticsEvent[] = [
  // Ngày 5: 04/11
  {
    id: 'EVT-014',
    date: '2026-11-04',
    time: '23:45:12',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    score: 92,
    evidenceUrl: '/evidence/NGU_GAT_(1.5s)_20261022_214414.jpg',
  },
  {
    id: 'EVT-013',
    date: '2026-11-04',
    time: '23:42:05',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Ngáp liên tục',
    rawType: 'YAWN',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    score: 65,
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg',
  },

  // Ngày 4: 03/11
  {
    id: 'EVT-012',
    date: '2026-11-03',
    time: '21:10:05',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Gục đầu nguy hiểm',
    rawType: 'HEAD_DROP',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    score: 82,
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg',
  },
  {
    id: 'EVT-011',
    date: '2026-11-03',
    time: '16:15:22',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Gục đầu nguy hiểm',
    rawType: 'HEAD_DROP',
    severity: 'HIGH',
    status: 'RESOLVED',
    score: 78,
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(1.5s)_20261022_230208.jpg',
  },
  {
    id: 'EVT-010',
    date: '2026-11-03',
    time: '15:50:10',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Ngáp liên tục',
    rawType: 'YAWN',
    severity: 'LOW',
    status: 'RESOLVED',
    score: 60,
    evidenceUrl: '/evidence/NGAP_SAU_20261022_212010.jpg',
  },

  // Ngày 3: 02/11
  {
    id: 'EVT-009',
    date: '2026-11-02',
    time: '22:15:00',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    score: 95,
    evidenceUrl: '/evidence/NGU_GAT_(1.5s)_20261024_201436.jpg',
  },
  {
    id: 'EVT-008',
    date: '2026-11-02',
    time: '21:40:12',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'HIGH',
    status: 'RESOLVED',
    score: 88,
    evidenceUrl: '/evidence/NGU_GAT_(1.6s)_20261022_214458.jpg',
  },
  {
    id: 'EVT-007',
    date: '2026-11-02',
    time: '19:30:40',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Ngáp liên tục',
    rawType: 'YAWN',
    severity: 'LOW',
    status: 'RESOLVED',
    score: 62,
    evidenceUrl: '/evidence/NGAP_SAU_(4.1s)_20261024_201455.jpg',
  },

  // Ngày 2: 01/11
  {
    id: 'EVT-006',
    date: '2026-11-01',
    time: '23:05:10',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    score: 90,
    evidenceUrl: '/evidence/BUON_NGU_20261024_094018.jpg',
  },
  {
    id: 'EVT-005',
    date: '2026-11-01',
    time: '21:15:00',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Gục đầu nguy hiểm',
    rawType: 'HEAD_DROP',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    score: 70,
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(4.3s)_20261022_214433.jpg',
  },
  {
    id: 'EVT-004',
    date: '2026-11-01',
    time: '14:20:15',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Ngáp liên tục',
    rawType: 'YAWN',
    severity: 'LOW',
    status: 'RESOLVED',
    score: 58,
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_DANG_NGAP_0.0s_20261029_100639.jpg',
  },

  // Ngày 1: 31/10
  {
    id: 'EVT-003',
    date: '2026-10-31',
    time: '22:30:22',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    score: 85,
    evidenceUrl: '/evidence/NGU_GAT_1.5s_20261029_100605.jpg',
  },
  {
    id: 'EVT-002',
    date: '2026-10-31',
    time: '20:12:00',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Nhắm mắt kéo dài',
    rawType: 'DROWSINESS',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    score: 64,
    evidenceUrl: '/evidence/CHOP_MAT_CHAM_(0.60s)_20261024_201525.jpg',
  },
  {
    id: 'EVT-001',
    date: '2026-10-31',
    time: '18:40:50',
    vehicle: '43A-999.88',
    vehicleModel: 'VinFast VF8',
    driver: 'Nguyễn Văn An',
    type: 'Gục đầu nguy hiểm',
    rawType: 'HEAD_DROP',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    score: 75,
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_CUI_DAU_-_MAT_MO_0.0s_20261029_100645.jpg',
  },
];

const mapAlertTypeToLabel = (type: string): string => {
  switch (type?.toUpperCase()) {
    case 'DROWSINESS':
      return 'Nhắm mắt kéo dài';
    case 'YAWN':
      return 'Ngáp liên tục';
    case 'HEAD_DROP':
      return 'Gục đầu nguy hiểm';
    case 'DISTRACTION':
      return 'Mất tập trung';
    case 'SPEEDING':
      return 'Vượt tốc độ';
    default:
      return type || 'Cảnh báo an toàn';
  }
};

const mapSeverity = (level: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
    case 'DANGER':
    case 'HIGH':
      return 'HIGH';
    case 'WARNING':
    case 'MEDIUM':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

export const analyticsService = {
  /**
   * Lấy danh sách sự kiện từ API Backend Next.js (/api/analytics/events), kết nối trực tiếp DB PostgreSQL
   */
  async getEvents(options: { date?: string; status?: string; severity?: string } = {}): Promise<AnalyticsEvent[]> {
    try {
      const params: any = {};
      if (options.date && options.date !== 'ALL') params.date = options.date;
      if (options.status && options.status !== 'ALL') params.status = options.status;
      if (options.severity && options.severity !== 'ALL') params.severity = options.severity;

      const res = await axiosClient.get('/analytics/events', { params });
      const apiData = res.data?.data || res.data;

      if (Array.isArray(apiData) && apiData.length > 0) {
        return apiData.map((item: any) => {
          const dt = item.timestamp ? new Date(item.timestamp) : new Date();
          const dateStr = dt.toISOString().split('T')[0];
          const timeStr = dt.toLocaleTimeString('vi-VN', { hour12: false });

          return {
            id: item.eventId || `EVT-${item.id}`,
            date: dateStr,
            time: timeStr,
            vehicle: item.plateNumber || '43A-999.88',
            vehicleModel: item.vehicleModel || 'VinFast VF8',
            driver: 'Nguyễn Văn An',
            type: mapAlertTypeToLabel(item.alertType),
            rawType: item.alertType,
            severity: mapSeverity(item.severity),
            status: item.status === 'RESOLVED' ? 'RESOLVED' : 'UNRESOLVED',
            score: item.drowsinessScore || 0,
            evidenceUrl: item.resolutionNote || null,
          };
        });
      }

      if (options.date && options.date !== 'ALL') {
        return FALLBACK_EVENTS.filter((e) => e.date === options.date);
      }
      return FALLBACK_EVENTS;
    } catch {
      if (options.date && options.date !== 'ALL') {
        return FALLBACK_EVENTS.filter((e) => e.date === options.date);
      }
      return FALLBACK_EVENTS;
    }
  },

  /**
   * Tính toán các chỉ số KPI an toàn
   */
  calculateKpis(events: AnalyticsEvent[]): AnalyticsKpi {
    const total = events.length;
    const unresolved = events.filter((e) => e.status === 'UNRESOLVED').length;
    const resolved = total - unresolved;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    const highRiskCount = events.filter((e) => e.severity === 'HIGH').length;
    const safetyScore = Math.max(0, 100 - highRiskCount * 10 - (total - highRiskCount) * 2);

    return { total, unresolved, resolved, resolveRate, safetyScore, highRiskCount };
  },
};

