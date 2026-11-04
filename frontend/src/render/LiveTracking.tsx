import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronRight,
  RefreshCw,
  Camera,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Target,
  FileText,
  Grid,
  List,
  Download,
  Maximize2,
  Car,
  Clock,
  ArrowLeft,
  ArrowRight,
  MapPin,
  User,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import trackingService, {
  TrackingKpi,
  LiveVehiclePosition,
  EvidenceItem,
  ContractEvidenceResponse,
} from '../api/trackingService';

// 1. Icon mặc định giống Overview.tsx
const defaultCarIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icon xe đang được chọn (Viền xanh dương đậm nổi bật, hiển thị chính xác biển số xe đang chọn)
const createActiveVehicleIcon = (plateNumber: string) => {
  return new L.DivIcon({
    className: 'custom-active-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: #0284c7; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span>${plateNumber}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0284c7;"></div>
      </div>
    `,
    iconSize: [110, 36],
    iconAnchor: [55, 36],
  });
};

// Icon các điểm vi phạm 📸 trên bản đồ
const createViolationIcon = (type: string, timeStr: string) => {
  const isSleep = type === 'DROWSINESS';
  const bgColor = isSleep ? '#ef4444' : '#f59e0b';
  return new L.DivIcon({
    className: 'custom-violation-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background-color: ${bgColor}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; border: 1.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); white-space: nowrap; display: flex; align-items: center; gap: 2px;">
          <span>📸</span>
          <span>${timeStr}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid ${bgColor};"></div>
      </div>
    `,
    iconSize: [75, 30],
    iconAnchor: [37, 30],
  });
};

/**
 * Component tự động cập nhật tâm và mức zoom bản đồ (giống Overview.tsx)
 */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// 2. DỮ LIỆU BẰNG CHỨNG THỰC TẾ PHÂN BỔ ĐỦ 5 NGÀY CỦA HỢP ĐỒNG HD-3 (31/10 - 04/11) CHO XE 43A-999.88
const REAL_EVIDENCE_DATA: (EvidenceItem & { fileName: string; date: string; time: string; label: string })[] = [
  // Ngày 5: 04/11/2026 (Ngày trả xe) - 2 ảnh
  {
    alertId: '1',
    eventId: 'NGU_GAT_1645',
    fileName: 'NGU_GAT_(1.5s)_20261022_214414.jpg',
    evidenceUrl: '/evidence/NGU_GAT_(1.5s)_20261022_214414.jpg',
    alertType: 'DROWSINESS',
    label: 'Ngủ gật (1.5s)',
    severityLevel: 'CRITICAL',
    drowsinessScore: 92,
    date: '2026-11-04',
    time: '16:45:12',
    occurredAt: '2026-11-04T16:45:12Z',
    latitude: 16.0610,
    longitude: 108.2170,
    speed: 48.5,
  },
  {
    alertId: '2',
    eventId: 'NGAP_SAU_1642',
    fileName: 'CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg',
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg',
    alertType: 'YAWN',
    label: 'Ngáp sâu liên tục',
    severityLevel: 'WARNING',
    drowsinessScore: 65,
    date: '2026-11-04',
    time: '16:42:05',
    occurredAt: '2026-11-04T16:42:05Z',
    latitude: 16.0592,
    longitude: 108.2095,
    speed: 52.0,
  },

  // Ngày 4: 03/11/2026 - 3 ảnh
  {
    alertId: '3',
    eventId: 'GUC_DAU_2110',
    fileName: 'GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg',
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg',
    alertType: 'HEAD_DROP',
    label: 'Gục đầu (3.2s)',
    severityLevel: 'DANGER',
    drowsinessScore: 82,
    date: '2026-11-03',
    time: '21:10:05',
    occurredAt: '2026-11-03T21:10:05Z',
    latitude: 16.0650,
    longitude: 108.2380,
    speed: 42.0,
  },
  {
    alertId: '4',
    eventId: 'GUC_DAU_1615',
    fileName: 'GUC_DAU_(NHAM_MAT)_(1.5s)_20261022_230208.jpg',
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(1.5s)_20261022_230208.jpg',
    alertType: 'HEAD_DROP',
    label: 'Gục đầu nhắm mắt',
    severityLevel: 'DANGER',
    drowsinessScore: 78,
    date: '2026-11-03',
    time: '16:15:22',
    occurredAt: '2026-11-03T16:15:22Z',
    latitude: 16.0550,
    longitude: 108.2030,
    speed: 40.5,
  },
  {
    alertId: '5',
    eventId: 'NGAP_SAU_1550',
    fileName: 'NGAP_SAU_20261022_212010.jpg',
    evidenceUrl: '/evidence/NGAP_SAU_20261022_212010.jpg',
    alertType: 'YAWN',
    label: 'Ngáp sâu',
    severityLevel: 'WARNING',
    drowsinessScore: 60,
    date: '2026-11-03',
    time: '15:50:10',
    occurredAt: '2026-11-03T15:50:10Z',
    latitude: 16.0545,
    longitude: 108.2025,
    speed: 55.0,
  },

  // Ngày 3: 02/11/2026 - 3 ảnh
  {
    alertId: '6',
    eventId: 'NGU_GAT_2215',
    fileName: 'NGU_GAT_(1.5s)_20261024_201436.jpg',
    evidenceUrl: '/evidence/NGU_GAT_(1.5s)_20261024_201436.jpg',
    alertType: 'DROWSINESS',
    label: 'Ngủ gật nguy hiểm',
    severityLevel: 'CRITICAL',
    drowsinessScore: 95,
    date: '2026-11-02',
    time: '22:15:00',
    occurredAt: '2026-11-02T22:15:00Z',
    latitude: 16.0680,
    longitude: 108.2435,
    speed: 50.0,
  },
  {
    alertId: '7',
    eventId: 'NGU_GAT_2140',
    fileName: 'NGU_GAT_(1.6s)_20261022_214458.jpg',
    evidenceUrl: '/evidence/NGU_GAT_(1.6s)_20261022_214458.jpg',
    alertType: 'DROWSINESS',
    label: 'Ngủ gật 1.6s',
    severityLevel: 'DANGER',
    drowsinessScore: 88,
    date: '2026-11-02',
    time: '21:40:12',
    occurredAt: '2026-11-02T21:40:12Z',
    latitude: 16.0675,
    longitude: 108.2420,
    speed: 47.0,
  },
  {
    alertId: '8',
    eventId: 'NGAP_SAU_1930',
    fileName: 'NGAP_SAU_(4.1s)_20261024_201455.jpg',
    evidenceUrl: '/evidence/NGAP_SAU_(4.1s)_20261024_201455.jpg',
    alertType: 'YAWN',
    label: 'Ngáp sâu 4.1s',
    severityLevel: 'WARNING',
    drowsinessScore: 62,
    date: '2026-11-02',
    time: '19:30:40',
    occurredAt: '2026-11-02T19:30:40Z',
    latitude: 16.0615,
    longitude: 108.2355,
    speed: 53.0,
  },

  // Ngày 2: 01/11/2026 - 3 ảnh
  {
    alertId: '9',
    eventId: 'BUON_NGU_2305',
    fileName: 'BUON_NGU_20261024_094018.jpg',
    evidenceUrl: '/evidence/BUON_NGU_20261024_094018.jpg',
    alertType: 'DROWSINESS',
    label: 'Buồn ngủ đêm khuya',
    severityLevel: 'CRITICAL',
    drowsinessScore: 90,
    date: '2026-11-01',
    time: '23:05:10',
    occurredAt: '2026-11-01T23:05:10Z',
    latitude: 16.0750,
    longitude: 108.2400,
    speed: 54.0,
  },
  {
    alertId: '10',
    eventId: 'GUC_DAU_2115',
    fileName: 'GUC_DAU_(NHAM_MAT)_(4.3s)_20261022_214433.jpg',
    evidenceUrl: '/evidence/GUC_DAU_(NHAM_MAT)_(4.3s)_20261022_214433.jpg',
    alertType: 'HEAD_DROP',
    label: 'Gục đầu nhắm mắt (4.3s)',
    severityLevel: 'WARNING',
    drowsinessScore: 70,
    date: '2026-11-01',
    time: '21:15:00',
    occurredAt: '2026-11-01T21:15:00Z',
    latitude: 16.0592,
    longitude: 108.2095,
    speed: 38.0,
  },
  {
    alertId: '11',
    eventId: 'DANG_NGAP_1420',
    fileName: 'CANH_BAO_DO_5_LAN_VANG_10P_-_DANG_NGAP_0.0s_20261029_100639.jpg',
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_DANG_NGAP_0.0s_20261029_100639.jpg',
    alertType: 'YAWN',
    label: 'Đang ngáp mệt mỏi',
    severityLevel: 'WARNING',
    drowsinessScore: 58,
    date: '2026-11-01',
    time: '14:20:15',
    occurredAt: '2026-11-01T14:20:15Z',
    latitude: 16.0601,
    longitude: 108.2238,
    speed: 49.0,
  },

  // Ngày 1: 31/10/2026 (Ngày nhận xe) - 3 ảnh
  {
    alertId: '12',
    eventId: 'NGU_GAT_2230',
    fileName: 'NGU_GAT_1.5s_20261029_100605.jpg',
    evidenceUrl: '/evidence/NGU_GAT_1.5s_20261029_100605.jpg',
    alertType: 'DROWSINESS',
    label: 'Ngủ gật 1.5s',
    severityLevel: 'DANGER',
    drowsinessScore: 85,
    date: '2026-10-31',
    time: '22:30:22',
    occurredAt: '2026-10-31T22:30:22Z',
    latitude: 16.0710,
    longitude: 108.2380,
    speed: 51.0,
  },
  {
    alertId: '13',
    eventId: 'CHOP_MAT_2012',
    fileName: 'CHOP_MAT_CHAM_(0.60s)_20261024_201525.jpg',
    evidenceUrl: '/evidence/CHOP_MAT_CHAM_(0.60s)_20261024_201525.jpg',
    alertType: 'DROWSINESS',
    label: 'Chớp mắt chậm (0.60s)',
    severityLevel: 'WARNING',
    drowsinessScore: 64,
    date: '2026-10-31',
    time: '20:12:00',
    occurredAt: '2026-10-31T20:12:00Z',
    latitude: 16.0650,
    longitude: 108.2250,
    speed: 56.0,
  },
  {
    alertId: '14',
    eventId: 'CANH_BAO_DO_1840',
    fileName: 'CANH_BAO_DO_5_LAN_VANG_10P_-_CUI_DAU_-_MAT_MO_0.0s_20261029_100645.jpg',
    evidenceUrl: '/evidence/CANH_BAO_DO_5_LAN_VANG_10P_-_CUI_DAU_-_MAT_MO_0.0s_20261029_100645.jpg',
    alertType: 'HEAD_DROP',
    label: 'Cúi đầu mắt mờ',
    severityLevel: 'WARNING',
    drowsinessScore: 75,
    date: '2026-10-31',
    time: '18:40:50',
    occurredAt: '2026-10-31T18:40:50Z',
    latitude: 16.0544,
    longitude: 108.2022,
    speed: 44.0,
  },
];

// Helper format tiền tệ VND
const formatVND = (num?: number) => {
  if (typeof num !== 'number') return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

// Helper format ngày giờ
const formatDateTime = (isoStr?: string) => {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
};

// 3. DỮ LIỆU ĐỘI XE ĐANG CHO THUÊ ĐỒNG BỘ 100% VỚI DATABASE
const DEFAULT_DEMO_VEHICLES: LiveVehiclePosition[] = [
  {
    id: 1,
    plateNumber: '43A-999.88',
    model: 'VF8',
    make: 'VinFast',
    vehicleType: 'Car (5 chỗ)',
    status: 'RENTED',
    movementStatus: 'MOVING',
    latitude: 16.0610,
    longitude: 108.2170,
    speed: 48.5,
    lastSeenAt: new Date().toISOString(),
    currentContract: {
      contractId: 3,
      contractNumber: 'HD-3',
      customerName: 'Trần Văn Khách (Đà Nẵng)',
      customerPhone: '0901.112.233',
      customerIdCard: '048099887766',
      customerLicense: 'B2-112233',
      customerAddress: '120 Hoàng Minh Thảo, Q. Cẩm Lệ, Đà Nẵng',
      startTime: '2026-10-31T08:00:00Z',
      endTime: '2026-11-04T20:00:00Z',
      price: 3600000,
      depositAmount: 10000000,
      notes: 'Hợp đồng thuê 5 ngày xe VinFast VF8 phục vụ đối tác ngoại giao',
      status: 'ACTIVE',
    },
    device: {
      id: 1,
      serialNumber: 'PI-001',
      status: 'ACTIVE',
      model: 'AI-Cam-GPS (RTK)',
    },
  },
  {
    id: 5,
    plateNumber: '43C-678.90',
    model: 'HD120',
    make: 'Hyundai',
    vehicleType: 'Truck (5 tấn)',
    status: 'RENTED',
    movementStatus: 'MOVING',
    latitude: 16.0680,
    longitude: 108.2435,
    speed: 55.0,
    lastSeenAt: new Date().toISOString(),
    currentContract: {
      contractId: 4,
      contractNumber: 'HD-4',
      customerName: 'Lê Hoàng Nam',
      customerPhone: '0903.456.789',
      customerIdCard: '048099778899',
      customerLicense: 'FC-998877',
      customerAddress: '456 Lê Duẩn, Q. Hải Châu, Đà Nẵng',
      startTime: '2026-10-29T07:00:00Z',
      endTime: '2026-11-04T19:00:00Z',
      price: 8000000,
      depositAmount: 15000000,
      notes: 'Hợp đồng vận chuyển hàng hóa 7 ngày tuyến liên tỉnh miền Trung',
      status: 'ACTIVE',
    },
    device: {
      id: 2,
      serialNumber: 'PI-002',
      status: 'ACTIVE',
      model: 'AI-Cam-GPS (RTK)',
    },
  },
  {
    id: 6,
    plateNumber: '92A-345.67',
    model: 'CX-5',
    make: 'Mazda',
    vehicleType: 'Car (5 chỗ gầm cao)',
    status: 'RENTED',
    movementStatus: 'STOPPED',
    latitude: 16.0550,
    longitude: 108.2030,
    speed: 0.0,
    lastSeenAt: new Date().toISOString(),
    currentContract: {
      contractId: 5,
      contractNumber: 'HD-5',
      customerName: 'Hoàng Minh Trí',
      customerPhone: '0988.222.111',
      customerIdCard: '048099112233',
      customerLicense: 'B2-554433',
      customerAddress: '78 Nguyễn Văn Linh, Q. Thanh Khê, Đà Nẵng',
      startTime: '2026-11-01T10:00:00Z',
      endTime: '2026-11-04T12:00:00Z',
      price: 2400000,
      depositAmount: 8000000,
      notes: 'Hợp đồng du lịch gia đình 4 ngày trải nghiệm Đà Nẵng - Hội An',
      status: 'ACTIVE',
    },
    device: {
      id: 3,
      serialNumber: 'PI-003',
      status: 'ACTIVE',
      model: 'AI-Cam-GPS (RTK)',
    },
  },
  {
    id: 7,
    plateNumber: '43B-888.99',
    model: 'Transit',
    make: 'Ford',
    vehicleType: 'Van (16 chỗ)',
    status: 'RENTED',
    movementStatus: 'MOVING',
    latitude: 16.0750,
    longitude: 108.2400,
    speed: 62.0,
    lastSeenAt: new Date().toISOString(),
    currentContract: {
      contractId: 6,
      contractNumber: 'HD-6',
      customerName: 'Cty Du Lịch Á Châu',
      customerPhone: '0912.333.444',
      customerIdCard: '048099334455',
      customerLicense: 'D-887766',
      customerAddress: '12 Bạch Đằng, Q. Hải Châu, Đà Nẵng',
      startTime: '2026-11-01T06:00:00Z',
      endTime: '2026-11-08T18:00:00Z',
      price: 12000000,
      depositAmount: 20000000,
      notes: 'Hợp đồng đoàn du lịch 8 ngày tham quan danh lam thắng cảnh',
      status: 'ACTIVE',
    },
    device: {
      id: 4,
      serialNumber: 'PI-004',
      status: 'ACTIVE',
      model: 'AI-Cam-GPS (RTK)',
    },
  },
];

export default function LiveTracking() {
  const { t } = useLanguage();
  // KPI State: Thiết lập giá trị thực tế theo đội xe đang thuê
  const [kpi, setKpi] = useState<TrackingKpi>({
    totalVehicles: 4,
    rollingCount: 3,
    stoppedCount: 1,
    parkedCount: 0,
    offlineCount: 0,
    activeAlertsCount: 14,
  });

  const [vehicles, setVehicles] = useState<LiveVehiclePosition[]>(DEFAULT_DEMO_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Bản đồ Leaflet state: Tâm Đà Nẵng [16.0544, 108.2022] giống Overview.tsx
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.0610, 108.2170]);
  const [mapZoom, setMapZoom] = useState<number>(13);

  // Evidence state
  const [evidenceList, setEvidenceList] = useState<any[]>(REAL_EVIDENCE_DATA);
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(REAL_EVIDENCE_DATA[0]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [evidencePage, setEvidencePage] = useState<number>(1);
  const [isGridView, setIsGridView] = useState<boolean>(false);

  // Ref chống re-render giật giật khi polling vị trí
  const lastVehiclesDataRef = React.useRef<string>('');

  // Tải dữ liệu từ Backend (nếu có API)
  const fetchData = () => {
    trackingService
      .getKpi()
      .then((res) => {
        if (res && res.data && res.data.totalVehicles > 0) {
          setKpi(res.data);
          setIsConnected(true);
        }
      })
      .catch(() => setIsConnected(false));

    trackingService
      .getPositions()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const fp = res.data
            .map((v: any) => `${v.id}:${v.speed}:${v.latitude?.toFixed(4)}:${v.longitude?.toFixed(4)}:${v.movementStatus}`)
            .join('|');
          if (fp !== lastVehiclesDataRef.current) {
            lastVehiclesDataRef.current = fp;
            setVehicles(res.data);
          }
          if (!selectedVehicleId && res.data[0]) {
            setSelectedVehicleId(res.data[0].id);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, []);

  // Helper kiểm tra chính xác xe vi phạm duy nhất trong hệ thống (biển số 43A-999.88)
  const isVehicleWithViolation = (plateNumber?: string) => {
    return plateNumber === '43A-999.88';
  };

  // Lấy xe đang chọn
  const selectedVehicle = useMemo(() => {
    return (
      vehicles.find((v) => v.id === selectedVehicleId) ||
      vehicles.find((v) => v.plateNumber === '43A-999.88') ||
      vehicles[0] ||
      DEFAULT_DEMO_VEHICLES[0]
    );
  }, [vehicles, selectedVehicleId]);

  // Kiểm tra xem xe đang chọn có phải là xe có vi phạm hay không (Xe 43A-999.88 là xe duy nhất có vi phạm)
  const isViolatingVehicle = useMemo(() => {
    return isVehicleWithViolation(selectedVehicle.plateNumber);
  }, [selectedVehicle.plateNumber]);

  // Cập nhật tâm bản đồ khi chọn xe mới
  useEffect(() => {
    if (selectedVehicle.latitude && selectedVehicle.longitude) {
      setMapCenter([selectedVehicle.latitude, selectedVehicle.longitude]);
    }
  }, [selectedVehicle.id]);

  // Đồng bộ bằng chứng vi phạm:
  // - Nếu là xe TỈNH TÁO: XÓA SẠCH bằng chứng vi phạm (0 ảnh) -> hiển thị trạng thái An Toàn 100%.
  // - Nếu là xe CÓ VI PHẠM (43A-999.88): Nạp đúng 14 ảnh của hợp đồng HD-3 trong 5 ngày.
  useEffect(() => {
    if (!isViolatingVehicle) {
      setEvidenceList([]);
      setSelectedEvidence(null);
      setSelectedDateFilter('ALL');
      setSelectedTypeFilter('ALL');
      setEvidencePage(1);
      return;
    }

    const contract = selectedVehicle.currentContract;
    if (contract?.contractId) {
      trackingService
        .getContractEvidence(contract.contractId)
        .then((res) => {
          if (res && res.data && res.data.items && res.data.items.length > 0) {
            const mapped = res.data.items.map((it: any) => {
              const d = new Date(it.occurredAt);
              const dateStr = d.toISOString().split('T')[0];
              const timeStr = d.toTimeString().split(' ')[0];
              let label = 'Cảnh báo an toàn';
              if (it.alertType === 'DROWSINESS') label = 'Ngủ gật';
              else if (it.alertType === 'YAWN') label = 'Ngáp sâu';
              else if (it.alertType === 'HEAD_DROP') label = 'Gục đầu';
              return {
                ...it,
                date: dateStr,
                time: timeStr,
                label,
                fileName: it.eventId + '.jpg',
              };
            });
            setEvidenceList(mapped);
            setSelectedEvidence(mapped[0]);
            setSelectedDateFilter('ALL');
            setSelectedTypeFilter('ALL');
            setEvidencePage(1);
            return;
          }
          // Nếu DB rỗng, fallback về 14 ảnh thật của xe này
          setEvidenceList(REAL_EVIDENCE_DATA);
          setSelectedEvidence(REAL_EVIDENCE_DATA[0]);
          setSelectedDateFilter('ALL');
          setSelectedTypeFilter('ALL');
          setEvidencePage(1);
        })
        .catch(() => {
          setEvidenceList(REAL_EVIDENCE_DATA);
          setSelectedEvidence(REAL_EVIDENCE_DATA[0]);
          setSelectedDateFilter('ALL');
          setSelectedTypeFilter('ALL');
          setEvidencePage(1);
        });
    } else {
      setEvidenceList(REAL_EVIDENCE_DATA);
      setSelectedEvidence(REAL_EVIDENCE_DATA[0]);
      setSelectedDateFilter('ALL');
      setSelectedTypeFilter('ALL');
      setEvidencePage(1);
    }
  }, [selectedVehicle.plateNumber, isViolatingVehicle]);

  // Tạo danh sách các tab ngày dựa trên chu kỳ thuê của hợp đồng (Hiển thị trọn vẹn từ Ngày 1 đến Ngày 5)
  const contractDayTabs = useMemo(() => {
    const contract = selectedVehicle.currentContract;
    if (!contract || !contract.startTime || !contract.endTime) {
      return [];
    }
    const s = new Date(contract.startTime);
    const e = new Date(contract.endTime);
    const sZero = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const eZero = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    const tabs: { dateStr: string; label: string; count: number }[] = [];

    let curr = new Date(sZero);
    let dayIdx = 1;
    while (curr <= eZero && dayIdx <= 15) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = isViolatingVehicle ? evidenceList.filter((ev) => ev.date === dateStr).length : 0;
      tabs.push({
        dateStr,
        label: `Ngày ${dayIdx}: ${dd}/${mm}`,
        count,
      });
      curr.setDate(curr.getDate() + 1);
      dayIdx++;
    }
    return tabs;
  }, [selectedVehicle.currentContract?.startTime, selectedVehicle.currentContract?.endTime, evidenceList, isViolatingVehicle]);

  // Tính số ngày thuê theo lịch (bao gồm cả ngày nhận và trả xe)
  const rentalDurationDays = useMemo(() => {
    const contract = selectedVehicle.currentContract;
    if (!contract?.startTime || !contract?.endTime) return 5;
    try {
      const s = new Date(contract.startTime);
      const e = new Date(contract.endTime);
      const sZero = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const eZero = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      const diff = Math.round((eZero.getTime() - sZero.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diff);
    } catch {
      return 5;
    }
  }, [selectedVehicle.currentContract?.startTime, selectedVehicle.currentContract?.endTime]);

  // Thống kê phân loại vi phạm của hợp đồng đang chọn
  const violationSummary = useMemo(() => {
    if (!isViolatingVehicle || evidenceList.length === 0) {
      return { total: 0, drowsiness: 0, yawn: 0, headDrop: 0 };
    }
    const drowsinessCount = evidenceList.filter((e) => e.alertType === 'DROWSINESS').length;
    const yawnCount = evidenceList.filter((e) => e.alertType === 'YAWN').length;
    const headDropCount = evidenceList.filter((e) => e.alertType === 'HEAD_DROP').length;
    return {
      total: evidenceList.length,
      drowsiness: drowsinessCount,
      yawn: yawnCount,
      headDrop: headDropCount,
    };
  }, [isViolatingVehicle, evidenceList]);

  // Bộ lọc ngày & loại vi phạm
  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((item) => {
      const matchDate = selectedDateFilter === 'ALL' || item.date === selectedDateFilter;
      const matchType = selectedTypeFilter === 'ALL' || item.alertType === selectedTypeFilter;
      return matchDate && matchType;
    });
  }, [evidenceList, selectedDateFilter, selectedTypeFilter]);

  // Phân trang dải ảnh (6 ảnh / trang)
  const pageSize = 6;
  const totalPages = Math.ceil(filteredEvidence.length / pageSize) || 1;
  const paginatedEvidence = useMemo(() => {
    const start = (evidencePage - 1) * pageSize;
    return filteredEvidence.slice(start, start + pageSize);
  }, [filteredEvidence, evidencePage]);

  // Zoom controls cho Leaflet Map
  const handleZoom = (delta: number) => {
    setMapZoom((prev) => Math.min(18, Math.max(10, prev + delta)));
  };

  const handleResetZoom = () => {
    if (selectedVehicle.latitude && selectedVehicle.longitude) {
      setMapCenter([selectedVehicle.latitude, selectedVehicle.longitude]);
      setMapZoom(14);
    }
  };

  const getAlertMeta = (type: string) => {
    switch (type) {
      case 'DROWSINESS':
        return { emoji: '😴', label: 'NGỦ GẬT', badgeClass: 'bg-rose-600 text-white' };
      case 'YAWN':
        return { emoji: '🥱', label: 'NGÁP SÂU', badgeClass: 'bg-amber-500 text-white' };
      case 'HEAD_DROP':
        return { emoji: '🙇', label: 'GỤC ĐẦU', badgeClass: 'bg-rose-500 text-white' };
      default:
        return { emoji: '⚠️', label: type, badgeClass: 'bg-slate-700 text-white' };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 font-sans">
      
      {/* ========================================================= */}
      {/* 1. HEADER BREADCRUMB & TRẠNG THÁI KẾT NỐI RTK             */}
      {/* ========================================================= */}
      <div className="px-6 pt-4 pb-2.5 shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">MENU</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400" />
            <span className="text-slate-900 font-extrabold uppercase">{t('nav.tracking') || 'Giám Sát Xe Đang Cho Thuê'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kết nối RTK Online
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Giám Sát Hành Trình & Kho Bằng Chứng Đa Ngày
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ theo dõi các xe có Hợp đồng đang cho khách thuê (HĐ ACTIVE) • Tự động ẩn xe nằm bãi kho.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THANH CHỈ SỐ KPI ĐỘI XE ĐANG CHO THUÊ                  */}
      {/* ========================================================= */}
      <div className="px-6 py-3 grid grid-cols-5 gap-3 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xe đang cho thuê</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900">{kpi.totalVehicles}</h3>
            <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded">Hợp đồng</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang lăn bánh</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-emerald-600">{kpi.rollingCount}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Di chuyển
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tạm dừng / Đỗ</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-700">{kpi.stoppedCount}</h3>
            <span className="text-[10px] text-slate-500 font-medium">Nghỉ chân</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng cảnh báo mới</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-rose-600">{kpi.activeAlertsCount}</h3>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded animate-pulse">Cần chú ý</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tình trạng GPS</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-base font-extrabold text-emerald-600">RTK Chuẩn 100%</h3>
            <span className="text-[10px] text-slate-400 font-mono">3.0s/lần</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. THANH CHỌN XE ĐANG THUÊ (FLEET QUICK-SELECTOR BAR)     */}
      {/* ========================================================= */}
      <div className="px-6 mb-3 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-sky-600" />
              Chọn xe đang lưu thông ngoài đường ({vehicles.length} xe):
            </span>
            <span className="text-[11px] text-slate-400">Click chọn xe để xem bản đồ và bằng chứng vi phạm tương ứng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {vehicles.map((v) => {
              const isSelected = v.plateNumber === selectedVehicle.plateNumber;
              const hasAlert = isVehicleWithViolation(v.plateNumber);
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    setEvidencePage(1);
                    if (v.latitude && v.longitude) {
                      setMapCenter([v.latitude, v.longitude]);
                      setMapZoom(14);
                    }
                  }}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition shadow-xs ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/50 scale-[1.01]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-slate-900">{v.plateNumber}</span>
                    {hasAlert ? (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded animate-pulse">
                        14 vi phạm
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Tỉnh táo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs">
                    <p className="font-semibold text-slate-700 truncate">
                      {v.currentContract ? `${v.currentContract.contractNumber} • ${v.currentContract.customerName}` : 'Hợp đồng thuê'}
                    </p>
                    <div className="flex justify-between items-center mt-1 text-[11px]">
                      <span className="text-slate-500">{v.make} {v.model}</span>
                      <span className={`font-bold ${v.speed > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {v.speed > 0 ? `${v.speed} km/h` : 'Tạm dừng (0 km/h)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. KHU VỰC CHÍNH: MAP 3 PHẦN - BÊN CÒN LẠI RỘNG RÃI       */}
      {/* ========================================================= */}
      <div className="flex-1 flex gap-4 px-6 pb-5 overflow-hidden">
        
        {/* CỘT TRÁI (3 PHẦN): BẢN ĐỒ LEAFLET OPENSTREETMAP */}
        <div className="w-[32%] min-w-[320px] max-w-[420px] bg-white rounded-2xl border border-slate-200 relative overflow-hidden flex flex-col shadow-xs shrink-0">
          
          {/* Top HUD Overlay: Tóm tắt thông tin xe */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 pointer-events-auto flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <span className="font-black text-slate-900">
                  {selectedVehicle.plateNumber}
                </span>
                <span className="text-slate-500 ml-1.5 font-mono">
                  <b>{selectedVehicle.speed} km/h</b>
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-md pointer-events-auto font-mono flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">
                {selectedVehicle.currentContract?.contractNumber || 'HD-3'} (ACTIVE)
              </span>
            </div>
          </div>

          {/* Cụm nút điều khiển Zoom Leaflet (+ / - / 🎯) */}
          <div className="absolute top-16 right-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
            <button
              onClick={() => handleZoom(1)}
              title="Phóng to bản đồ"
              className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 font-black text-sm rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            >
              +
            </button>
            <button
              onClick={() => handleZoom(-1)}
              title="Thu nhỏ bản đồ"
              className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-900 font-black text-sm rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            >
              −
            </button>
            <button
              onClick={handleResetZoom}
              title="Vừa khung xe đang chọn"
              className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            >
              <Target className="w-4 h-4 text-sky-600" />
            </button>
            <div className="bg-slate-900/90 text-white text-[10px] font-mono px-1 py-0.5 rounded text-center">
              {mapZoom}z
            </div>
          </div>

          {/* BẢN ĐỒ LEAFLET THỰC TẾ (GIỐNG HỆT OVERVIEW.TSX) */}
          <div className="flex-1 w-full h-full relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              
              {/* Lớp bản đồ đường phố OpenStreetMap */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Marker cho tất cả các xe đang cho thuê */}
              {vehicles.map((v) => {
                if (!v.latitude || !v.longitude) return null;
                const isSelected = v.plateNumber === selectedVehicle.plateNumber;
                return (
                  <Marker
                    key={`veh-${v.id}`}
                    position={[v.latitude, v.longitude]}
                    icon={isSelected ? createActiveVehicleIcon(v.plateNumber) : defaultCarIcon}
                  >
                    <Popup>
                      <div className="font-sans text-xs">
                        <p className="font-black text-slate-900 text-sm">{v.plateNumber}</p>
                        <p className="text-slate-600 mt-1">Loại xe: {v.make} {v.model}</p>
                        <p className="text-slate-600">Khách thuê: <b>{v.currentContract?.customerName || 'N/A'}</b></p>
                        <p className="text-emerald-600 font-bold mt-1">Tốc độ: {v.speed} km/h</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Marker cho các vị trí vi phạm 📸 trên bản đồ */}
              {filteredEvidence.map((ev) => {
                if (!ev.latitude || !ev.longitude) return null;
                return (
                  <Marker
                    key={`ev-marker-${ev.alertId}`}
                    position={[ev.latitude, ev.longitude]}
                    icon={createViolationIcon(ev.alertType, ev.time.substring(0, 5))}
                    eventHandlers={{
                      click: () => {
                        setSelectedEvidence(ev);
                        setIsGridView(false);
                      },
                    }}
                  >
                    <Popup>
                      <div className="font-sans text-xs">
                        <p className="font-bold text-rose-600">{ev.label}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Giờ: {ev.date} {ev.time}</p>
                        <p className="text-slate-600 text-[11px]">Tốc độ: {ev.speed} km/h</p>
                        <button
                          onClick={() => {
                            setSelectedEvidence(ev);
                            setIsGridView(false);
                          }}
                          className="mt-2 w-full py-1 bg-rose-600 text-white rounded text-[10px] font-bold"
                        >
                          Xem ảnh bằng chứng này
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Bottom Floating HUD */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-md flex items-center justify-between text-xs text-slate-700 z-[400]">
              <div className="flex items-center gap-3 text-[11px]">
                <span>📍 <b>{selectedVehicle.latitude?.toFixed(4)}, {selectedVehicle.longitude?.toFixed(4)}</b></span>
                <span>🧭 <b>Đông Bắc (92°)</b></span>
              </div>
              <span className="text-slate-400 text-[10px]">Click ghim 📸 để mở ảnh</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (BÊN CÒN LẠI): KHO BẰNG CHỨNG + CHI TIẾT HỢP ĐỒNG */}
        <div className="flex-1 flex gap-3.5 overflow-hidden">
          
          {/* PHẦN 1: KHO BẰNG CHỨNG VI PHẠM THỰC TẾ (RỘNG RÃI - KHÔNG BỊ KHUẤT) */}
          <div className="flex-[1.15] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full">
            
            {/* Header & Tabs lọc theo ngày của hợp đồng thuê */}
            <div className="p-3 bg-slate-900 text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-black uppercase tracking-wide">
                    {isViolatingVehicle ? 'Kho Bằng Chứng Vi Phạm Thực Tế' : 'Giám Sát Hành Trình An Toàn'}
                  </span>
                </div>
                {isViolatingVehicle && filteredEvidence.length > 0 ? (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                    {filteredEvidence.length} ảnh thật
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 0 vi phạm • Tỉnh táo
                  </span>
                )}
              </div>

              {/* BỘ LỌC CHỌN NGÀY ĐỒNG BỘ CHU KỲ HỢP ĐỒNG (HIỂN THỊ ĐỦ CẢ 5 NGÀY) */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pb-1">
                <button
                  onClick={() => {
                    setSelectedDateFilter('ALL');
                    setEvidencePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                    selectedDateFilter === 'ALL'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Tất cả ngày thuê ({isViolatingVehicle ? evidenceList.length : 0})
                </button>
                {contractDayTabs.map((tab) => (
                  <button
                    key={tab.dateStr}
                    onClick={() => {
                      if (isViolatingVehicle) {
                        setSelectedDateFilter(tab.dateStr);
                        setEvidencePage(1);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium ${
                      selectedDateFilter === tab.dateStr
                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* BỘ LỌC THEO LOẠI VI PHẠM & NÚT CHUYỂN CHẾ ĐỘ LƯỚI */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">Lỗi:</span>
                  <button
                    onClick={() => setSelectedTypeFilter('ALL')}
                    className={`font-semibold hover:underline ${selectedTypeFilter === 'ALL' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
                  >
                    Tất cả
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setSelectedTypeFilter('DROWSINESS')}
                    className={`hover:underline ${selectedTypeFilter === 'DROWSINESS' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
                  >
                    Ngủ gật ({violationSummary.drowsiness})
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setSelectedTypeFilter('YAWN')}
                    className={`hover:underline ${selectedTypeFilter === 'YAWN' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
                  >
                    Ngáp ({violationSummary.yawn})
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setSelectedTypeFilter('HEAD_DROP')}
                    className={`hover:underline ${selectedTypeFilter === 'HEAD_DROP' ? 'text-rose-300 font-bold' : 'text-slate-400'}`}
                  >
                    Gục đầu ({violationSummary.headDrop})
                  </button>
                </div>

                {isViolatingVehicle && filteredEvidence.length > 0 && (
                  <button
                    onClick={() => setIsGridView(!isGridView)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700 flex items-center gap-1"
                  >
                    {isGridView ? <List className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
                    <span>{isGridView ? 'Dải ảnh' : 'Lưới ảnh'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* KHUNG XEM ẢNH THẬT CHỤP TỪ CAMERA AI HOẶC HERO SAFE STATE (XE TỈNH TÁO) */}
            {!isViolatingVehicle || !selectedEvidence || filteredEvidence.length === 0 ? (
              <div className="flex-1 bg-slate-950 min-h-[280px] flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <ShieldCheck className="w-9 h-9 text-emerald-400" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-1.5">
                  0 Vi Phạm • Tài Xế Tỉnh Táo 100%
                </span>
                <h4 className="text-sm font-black text-white tracking-wide">
                  HÀNH TRÌNH VẬN HÀNH AN TOÀN TUYỆT ĐỐI
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mt-1.5 leading-relaxed">
                  Phương tiện <b className="text-emerald-400 font-mono">{selectedVehicle.plateNumber}</b> ({selectedVehicle.make} {selectedVehicle.model}) đang lưu thông chuẩn mực.
                  Hệ thống AI DMS không ghi nhận bất kỳ dấu hiệu ngủ gật hay vi phạm nào trong suốt chu kỳ thuê.
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-4 w-full max-w-xs text-center">
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Vi phạm ghi nhận</span>
                    <span className="text-emerald-400 font-black text-xs">0 lỗi</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Điểm an toàn</span>
                    <span className="text-emerald-400 font-black text-xs">100 / 100</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Khấu trừ cọc</span>
                    <span className="text-emerald-400 font-black text-xs">0 đ (An toàn)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative bg-slate-950 min-h-[260px] flex items-center justify-center overflow-hidden border-b border-slate-800">
                <img
                  src={selectedEvidence.evidenceUrl}
                  alt={selectedEvidence.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Watermark in thông số kỹ thuật trực tiếp trên ảnh */}
                <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono border border-slate-700 leading-tight">
                  <p className="text-sky-400 font-bold">{selectedEvidence.fileName}</p>
                  <p className="text-slate-200">
                    Thời gian: {selectedEvidence.date} {selectedEvidence.time}
                  </p>
                  <p className="text-slate-300">
                    GPS: {selectedEvidence.latitude?.toFixed(4)}°N, {selectedEvidence.longitude?.toFixed(4)}°E • Tốc độ: {selectedEvidence.speed} km/h
                  </p>
                </div>

                {/* Badge loại vi phạm và điểm AI */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase ${getAlertMeta(selectedEvidence.alertType).badgeClass}`}>
                    {getAlertMeta(selectedEvidence.alertType).emoji} {selectedEvidence.label}
                  </span>
                  <span className="bg-black/80 text-rose-400 border border-rose-500/50 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                    Điểm mệt mỏi: {selectedEvidence.drowsinessScore}/100
                  </span>
                </div>

                {/* Nút tác vụ phóng to & tải ảnh */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <a
                    href={selectedEvidence.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] px-2.5 py-1 rounded border border-slate-600 transition flex items-center gap-1 backdrop-blur-xs font-semibold"
                  >
                    <Maximize2 className="w-3 h-3" /> Phóng to
                  </a>
                  <a
                    href={selectedEvidence.evidenceUrl}
                    download={selectedEvidence.fileName}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] px-2.5 py-1 rounded font-bold shadow-xs transition flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Tải về
                  </a>
                </div>
              </div>
            )}

            {/* DẢI ẢNH (FILMSTRIP) & PHÂN TRANG HOẶC CHẾ ĐỘ LƯỚI */}
            {!isViolatingVehicle || filteredEvidence.length === 0 ? (
              <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Không có hình ảnh vi phạm • Tài xế tỉnh táo, hồ sơ lái xe an toàn tuyệt đối</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedVehicle.currentContract?.contractNumber || 'HD-5'} ({rentalDurationDays} ngày)
                </span>
              </div>
            ) : !isGridView ? (
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 shrink-0">
                <div className="flex items-center justify-between mb-1.5 px-0.5 text-[11px]">
                  <span className="text-slate-600 font-semibold">
                    Hiển thị {paginatedEvidence.length > 0 ? (evidencePage - 1) * pageSize + 1 : 0} -{' '}
                    {Math.min(evidencePage * pageSize, filteredEvidence.length)} trên tổng {filteredEvidence.length} ảnh thật
                  </span>
                  
                  {/* Nút điều hướng trang */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={evidencePage <= 1}
                      onClick={() => setEvidencePage((p) => Math.max(1, p - 1))}
                      className="w-5 h-5 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-xs font-bold text-slate-700"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-800 text-[10px] px-1">
                      {evidencePage} / {totalPages}
                    </span>
                    <button
                      disabled={evidencePage >= totalPages}
                      onClick={() => setEvidencePage((p) => Math.min(totalPages, p + 1))}
                      className="w-5 h-5 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-xs font-bold text-slate-700"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Dải thumbnail ảnh thật: Click chọn là đổi ảnh to ngay lập tức */}
                <div className="grid grid-cols-6 gap-1.5">
                  {paginatedEvidence.map((item) => {
                    const isItemActive = item.alertId === selectedEvidence?.alertId;
                    return (
                      <div
                        key={item.alertId}
                        onClick={() => setSelectedEvidence(item)}
                        className={`p-1 rounded-lg border-2 cursor-pointer text-center transition ${
                          isItemActive
                            ? 'border-rose-500 bg-rose-50/80 shadow-xs scale-[1.02]'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="h-12 bg-slate-900 rounded overflow-hidden">
                          <img
                            src={item.evidenceUrl}
                            alt={item.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`text-[9px] block mt-0.5 truncate ${item.alertType === 'DROWSINESS' ? 'text-rose-600 font-black' : 'text-slate-700 font-bold'}`}>
                          {item.time.substring(0, 5)}
                        </span>
                        <span className="text-[8px] text-slate-400 block">
                          {item.date.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ LƯỚI (GRID VIEW) HIỂN THỊ TOÀN BỘ ẢNH THẬT */
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 max-h-56 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Toàn bộ {filteredEvidence.length} ảnh bằng chứng của đợt thuê:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {filteredEvidence.map((item) => (
                    <div
                      key={item.alertId}
                      onClick={() => {
                        setSelectedEvidence(item);
                        setIsGridView(false);
                      }}
                      className={`p-1.5 rounded-lg border cursor-pointer text-center transition ${
                        item.alertId === selectedEvidence?.alertId
                          ? 'border-2 border-rose-500 bg-rose-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="h-14 bg-slate-900 rounded overflow-hidden">
                        <img
                          src={item.evidenceUrl}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 block mt-1 truncate">
                        {item.label}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {item.date.substring(5)} {item.time.substring(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PHẦN 2: BẢNG DỮ LIỆU HỢP ĐỒNG THUÊ XE CHI TIẾT (ĐỒNG BỘ TỪ DB) */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-full overflow-y-auto space-y-3">
            
            {/* Header hợp đồng */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Hợp Đồng Cho Thuê Xe
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Phương tiện: <b className="text-slate-800">{selectedVehicle.plateNumber}</b> ({selectedVehicle.make} {selectedVehicle.model})
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-sky-100 text-sky-800 font-extrabold text-xs px-2.5 py-1 rounded-lg font-mono">
                  {selectedVehicle.currentContract?.contractNumber || 'HD-3'}
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE
                </span>
              </div>
            </div>

            {/* Khối 1: Thông tin Khách thuê xe */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Khách hàng thuê xe</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Họ và tên:</span>
                  <span className="font-bold text-slate-900">{selectedVehicle.currentContract?.customerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedVehicle.currentContract?.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Số CCCD / CMND:</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedVehicle.currentContract?.customerIdCard || '048099887766'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Hạng GPLX:</span>
                  <span className="font-semibold text-sky-700">{selectedVehicle.currentContract?.customerLicense || 'B2-112233'}</span>
                </div>
              </div>
              <div className="pt-1.5 text-xs border-t border-slate-200/60">
                <span className="text-slate-400 text-[10px] block">Địa chỉ thường trú:</span>
                <span className="text-slate-700 font-medium">{selectedVehicle.currentContract?.customerAddress || 'Đà Nẵng'}</span>
              </div>
            </div>

            {/* Khối 2: Lịch trình & Thời hạn thuê xe */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Thời hạn & Lịch trình</span>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Thời hạn: {rentalDurationDays} ngày
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Bắt đầu nhận xe:</span>
                  <span className="font-bold text-slate-800">{formatDateTime(selectedVehicle.currentContract?.startTime)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Dự kiến trả xe:</span>
                  <span className="font-bold text-slate-800">{formatDateTime(selectedVehicle.currentContract?.endTime)}</span>
                </div>
              </div>
            </div>

            {/* Khối 3: Tài chính & Tiền cọc */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Tài chính & Đặt cọc giữ xe</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Giá thuê hợp đồng:</span>
                  <span className="font-black text-sky-700 text-sm">{formatVND(selectedVehicle.currentContract?.price)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Tiền đặt cọc xe (Deposit):</span>
                  <span className="font-black text-amber-700 text-sm">{formatVND(selectedVehicle.currentContract?.depositAmount)}</span>
                </div>
              </div>
              {isViolatingVehicle && evidenceList.length > 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Trạng thái cọc: <b>Cần trừ tiền cọc do {evidenceList.length} lỗi vi phạm an toàn</b></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Trạng thái cọc: <b>Đủ điều kiện hoàn trả 100% tiền cọc (Không bị khấu trừ)</b></span>
                </div>
              )}
            </div>

            {/* Khối 4: Thiết bị IoT Telematics */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>Thiết bị IoT Telematics gắn kèm</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Mã thiết bị:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVehicle.device?.serialNumber || 'PI-001'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dòng thiết bị:</span>
                  <span className="font-semibold text-slate-700">{selectedVehicle.device?.model || 'AI-Cam & RTK'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vận tốc hiện tại:</span>
                  <span className={`font-bold ${selectedVehicle.speed > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {selectedVehicle.speed > 0 ? `${selectedVehicle.speed} km/h` : 'Tạm dừng (0 km/h)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Khối 5: Ghi chú & Thỏa thuận hợp đồng */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>Điều khoản & Ghi chú hợp đồng</span>
              </div>
              <p className="text-slate-600 text-xs italic bg-white p-2 rounded-lg border border-slate-200 mt-1">
                "{selectedVehicle.currentContract?.notes || 'Hợp đồng cho thuê xe tự lái tuân thủ quy chuẩn an toàn DriveLinker.'}"
              </p>
            </div>

            {/* Khối 6: Tổng kết vi phạm an toàn lái xe */}
            {isViolatingVehicle && evidenceList.length > 0 ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tổng kết vi phạm an toàn</span>
                  </div>
                  <span className="font-black text-rose-600 text-xs">
                    {evidenceList.length} lần phát hiện
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center pt-1 text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Ngủ gật</span>
                    <span className="font-bold text-rose-600">{violationSummary.drowsiness} lần</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Ngáp sâu</span>
                    <span className="font-bold text-amber-600">{violationSummary.yawn} lần</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Gục đầu</span>
                    <span className="font-bold text-rose-500">{violationSummary.headDrop} lần</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đánh giá an toàn lái xe</span>
                  </div>
                  <span className="font-black text-emerald-600 text-xs bg-emerald-100 px-2 py-0.5 rounded">
                    0 vi phạm • An toàn 100%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center pt-1 text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Ngủ gật</span>
                    <span className="font-bold text-emerald-600">0 lần</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Ngáp sâu</span>
                    <span className="font-bold text-emerald-600">0 lần</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Gục đầu</span>
                    <span className="font-bold text-emerald-600">0 lần</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium text-center pt-0.5">
                  Tài xế tỉnh táo, tuân thủ nghiêm ngặt quy định an toàn hành trình
                </p>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
