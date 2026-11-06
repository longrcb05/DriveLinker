/**
 * @file LiveTracking.tsx
 * @description Phân hệ Giám sát Hành trình & Trí tuệ Nhân tạo AI DMS (Driver Monitoring System).
 * - Cột trái: Danh sách đội xe trực quan kèm bộ lọc và nút "Chi tiết" xem bằng chứng buồn ngủ.
 * - Khu vực trung tâm: Bản đồ Google Maps vệ tinh/đường phố theo dõi vị trí xe thời gian thực.
 * - Khu vực phải: Luồng giả lập Camera AI DMS với phân tích khuôn mặt, điểm EAR, MAR và cảnh báo cabin.
 * - Modal Bằng chứng: Xem ảnh chụp thời gian gần hành vi buồn ngủ và xem lại các ảnh vi phạm trong quá khứ.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronRight, RefreshCw, Activity, Search, Filter, Camera,
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Sparkles, X,
  ZoomIn, Download, Play, Radio, Volume2, Truck, User, ArrowUpRight,
  Maximize2, History, MapPin, Eye, Phone, BellRing,
  Calendar, Layers, Flame, ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// === KIỂU DỮ LIỆU BẰNG CHỨNG AI DMS ===
export interface AiEvidenceItem {
  id: string;
  image: string;
  time: string;
  date: string;
  type: 'DROWSY' | 'YAWN' | 'HEAD_DROP' | 'SLOW_BLINK';
  typeName: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  ear?: number;
  mar?: number;
  pitch?: number;
  speed: string;
  location: string;
  duration?: string;
  actionTaken: string;
}

// === KIỂU DỮ LIỆU PHƯƠNG TIỆN LIVE TRACKING ===
export interface LiveVehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  driverPhone: string;
  speed: number;
  status: 'ALERT_DROWSY' | 'WARNING_YAWN' | 'ALERT_DISTRACTED' | 'NORMAL';
  statusLabel: string;
  lat: number;
  lng: number;
  currentEar: number;
  currentMar: number;
  lastSeen: string;
  recentEvidence: AiEvidenceItem;
  historyEvidences: AiEvidenceItem[];
}

// === TẠO BIỂU TƯỢNG MARKER XE TRÊN GOOGLE MAPS ===
const createLiveVehicleIcon = (status: LiveVehicle['status'], plate: string, isSelected: boolean) => {
  const isAlert = status === 'ALERT_DROWSY';
  const isWarning = status === 'WARNING_YAWN' || status === 'ALERT_DISTRACTED';
  const color = isAlert ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';
  const shadow = isAlert ? 'rgba(239, 68, 68, 0.55)' : isWarning ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.45)';
  const pulse = isAlert ? 'animate-pulse' : '';
  const scale = isSelected ? 'scale-110' : '';

  return L.divIcon({
    className: 'custom-live-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;" class="${scale}">
        <div style="background: white; border: 1.5px solid ${color}; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; font-family: monospace; color: #0f172a; box-shadow: 0 2px 5px rgba(0,0,0,0.22); white-space: nowrap; margin-bottom: 2px;">
          ${plate}
        </div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px ${shadow}; border: 2.5px solid white;" class="${pulse}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color}; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -50]
  });
};

// === COMPONENT ĐIỀU HƯỚNG TÂM BẢN ĐỒ ===
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.0 });
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

// === BỘ DỮ LIỆU ĐỘI XE & BẰNG CHỨNG ẢNH AI CHỤP THẬT (TỪ /bang_chung) ===
const MOCK_LIVE_FLEET: LiveVehicle[] = [
  {
    id: 'V01',
    plate: '43A-112.22',
    model: 'Hyundai Solati 16 Chỗ',
    driver: 'Trần Văn Bình',
    driverPhone: '0905.123.456',
    speed: 68,
    status: 'ALERT_DROWSY',
    statusLabel: 'Ngủ gật nguy hiểm (1.5s)',
    lat: 16.054407,
    lng: 108.202167,
    currentEar: 0.14,
    currentMar: 0.22,
    lastSeen: '10 giây trước',
    recentEvidence: {
      id: 'EV-01',
      image: '/bang_chung/NGU_GAT_1.5s_20261101_133537.jpg',
      time: '09:28:15',
      date: 'Hôm nay',
      type: 'DROWSY',
      typeName: 'Ngủ gật / Mắt nhắm > 1.5s',
      severity: 'HIGH',
      ear: 0.14,
      mar: 0.22,
      speed: '68 km/h',
      location: 'Đường Nguyễn Văn Linh, Đà Nẵng',
      duration: '1.5s',
      actionTaken: 'Đã kích hoạt còi cabin 10s • Rung ghế • Báo động điều hành'
    },
    historyEvidences: [
      {
        id: 'EV-01-H1',
        image: '/bang_chung/NGU_GAT_1.5s_20261101_133323.jpg',
        time: '09:12:05',
        date: 'Hôm nay',
        type: 'DROWSY',
        typeName: 'Ngủ gật / Mắt nhắm kéo dài',
        severity: 'HIGH',
        ear: 0.15,
        speed: '65 km/h',
        location: 'Cầu Rồng, Đà Nẵng',
        duration: '1.5s',
        actionTaken: 'Hú còi cabin mức 2'
      },
      {
        id: 'EV-01-H2',
        image: '/bang_chung/NGAP_SAU_3.0s_20261029_100625.jpg',
        time: '08:45:30',
        date: 'Hôm nay',
        type: 'YAWN',
        typeName: 'Ngáp sâu liên tục',
        severity: 'MEDIUM',
        mar: 0.72,
        speed: '62 km/h',
        location: 'Ngã tư Nguyễn Hữu Thọ, Đà Nẵng',
        duration: '3.0s',
        actionTaken: 'Phát âm thanh nhắc nhở giữ khoảng cách an toàn'
      },
      {
        id: 'EV-01-H3',
        image: '/bang_chung/GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220933.jpg',
        time: '14:30:15',
        date: '29/10/2026',
        type: 'HEAD_DROP',
        typeName: 'Gục đầu nhắm mắt',
        severity: 'HIGH',
        pitch: -28,
        speed: '58 km/h',
        location: 'Đèo Hải Vân, Đà Nẵng',
        duration: '3.2s',
        actionTaken: 'Còi báo động cabin mức 3'
      },
      {
        id: 'EV-01-H4',
        image: '/bang_chung/CHOP_MAT_CHAM_(0.60s)_20261024_201525.jpg',
        time: '10:15:40',
        date: '28/10/2026',
        type: 'SLOW_BLINK',
        typeName: 'Chớp mắt chậm bất thường',
        severity: 'LOW',
        ear: 0.18,
        speed: '60 km/h',
        location: 'QL1A đoạn Liên Chiểu',
        duration: '0.6s',
        actionTaken: 'Ghi nhận chỉ số mệt mỏi vào báo cáo'
      },
      {
        id: 'EV-01-H5',
        image: '/bang_chung/NGU_GAT_(1.5s)_20261022_214414.jpg',
        time: '09:30:22',
        date: '28/10/2026',
        type: 'DROWSY',
        typeName: 'Ngủ gật khi đang tăng tốc',
        severity: 'HIGH',
        ear: 0.13,
        speed: '70 km/h',
        location: 'Đường tránh Nam Hải Vân',
        duration: '1.5s',
        actionTaken: 'Báo động điều hành & gọi điện thoại tài xế'
      },
      {
        id: 'EV-01-H6',
        image: '/bang_chung/NGAP_LIEN_TUC_20261022_214426.jpg',
        time: '14:20:10',
        date: '27/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp liên tục trong 10 phút',
        severity: 'MEDIUM',
        mar: 0.68,
        speed: '55 km/h',
        location: 'Quận Sơn Trà, Đà Nẵng',
        duration: '2.5s',
        actionTaken: 'Yêu cầu tài xế dừng trạm nghỉ ngơi'
      }
    ]
  },
  {
    id: 'V02',
    plate: '29C-123.45',
    model: 'Isuzu Forward N-Series 5T',
    driver: 'Nguyễn Văn A',
    driverPhone: '0912.888.999',
    speed: 52,
    status: 'WARNING_YAWN',
    statusLabel: 'Ngáp sâu liên tục (3.0s)',
    lat: 16.047079,
    lng: 108.206230,
    currentEar: 0.24,
    currentMar: 0.74,
    lastSeen: '5 giây trước',
    recentEvidence: {
      id: 'EV-02',
      image: '/bang_chung/CANH_BAO_DO_5_LAN_VANG_10P_-_NGAP_SAU_3.0s_20261029_100635.jpg',
      time: '09:15:20',
      date: 'Hôm nay',
      type: 'YAWN',
      typeName: 'Ngáp sâu liên tục (> 3.0s)',
      severity: 'MEDIUM',
      mar: 0.74,
      ear: 0.24,
      speed: '52 km/h',
      location: 'QL1A Hòa Phước, Đà Nẵng',
      duration: '3.0s',
      actionTaken: 'Phát âm thanh giọng nói: "Tài xế vui lòng giữ tỉnh táo!"'
    },
    historyEvidences: [
      {
        id: 'EV-02-H1',
        image: '/bang_chung/NGAP_SAU_20261022_210955.jpg',
        time: '08:50:12',
        date: 'Hôm nay',
        type: 'YAWN',
        typeName: 'Ngáp sâu',
        severity: 'MEDIUM',
        mar: 0.70,
        speed: '50 km/h',
        location: 'Đường 2/9, Đà Nẵng',
        duration: '2.8s',
        actionTaken: 'Âm thanh cảnh báo nhẹ'
      },
      {
        id: 'EV-02-H2',
        image: '/bang_chung/NGAP_LIEN_TUC_20261022_220310.jpg',
        time: '09:10:00',
        date: '29/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp liên tục',
        severity: 'MEDIUM',
        mar: 0.68,
        speed: '54 km/h',
        location: 'Quận Cẩm Lệ, Đà Nẵng',
        duration: '2.0s',
        actionTaken: 'Nhắc nhở qua loa'
      },
      {
        id: 'EV-02-H3',
        image: '/bang_chung/NGU_GAT_(1.5s)_20261022_220927.jpg',
        time: '10:15:00',
        date: '28/10/2026',
        type: 'DROWSY',
        typeName: 'Ngủ gật 1.5s',
        severity: 'HIGH',
        ear: 0.16,
        speed: '48 km/h',
        location: 'Khu công nghiệp Hòa Khánh',
        duration: '1.5s',
        actionTaken: 'Hú còi cabin khẩn cấp'
      }
    ]
  },
  {
    id: 'V03',
    plate: '51D-987.65',
    model: 'Hino 500 Series FL 8T',
    driver: 'Trần Thị B',
    driverPhone: '0938.777.666',
    speed: 60,
    status: 'ALERT_DISTRACTED',
    statusLabel: 'Cúi đầu / Mất tập trung',
    lat: 16.055000,
    lng: 108.215000,
    currentEar: 0.20,
    currentMar: 0.15,
    lastSeen: 'Vừa xong',
    recentEvidence: {
      id: 'EV-03',
      image: '/bang_chung/CANH_BAO_DO_5_LAN_VANG_10P_-_CUI_DAU_-_MAT_MO_0.0s_20261029_100645.jpg',
      time: '08:40:10',
      date: 'Hôm nay',
      type: 'HEAD_DROP',
      typeName: 'Cúi đầu / Mắt lơ đễnh nhìn điện thoại',
      severity: 'MEDIUM',
      pitch: -22,
      ear: 0.20,
      speed: '60 km/h',
      location: 'Cầu Trần Thị Lý, Đà Nẵng',
      duration: '2.0s',
      actionTaken: 'Phát chuông thông báo cabin nhắc ngẩng đầu'
    },
    historyEvidences: [
      {
        id: 'EV-03-H1',
        image: '/bang_chung/GUC_DAU_20261022_211028.jpg',
        time: '07:20:00',
        date: 'Hôm nay',
        type: 'HEAD_DROP',
        typeName: 'Gục đầu',
        severity: 'MEDIUM',
        pitch: -20,
        speed: '58 km/h',
        location: 'Đường Duy Tân',
        duration: '1.8s',
        actionTaken: 'Chuông nhắc nhở'
      },
      {
        id: 'EV-03-H2',
        image: '/bang_chung/NGAP_(1.5s)_20261024_201502.jpg',
        time: '11:20:00',
        date: '30/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp 1.5s',
        severity: 'LOW',
        mar: 0.66,
        speed: '62 km/h',
        location: 'Ngã ba Huế',
        duration: '1.5s',
        actionTaken: 'Ghi nhận hệ thống'
      }
    ]
  },
  {
    id: 'V04',
    plate: '15C-456.78',
    model: 'Isuzu QKR 2T',
    driver: 'Lê Văn C',
    driverPhone: '0988.555.444',
    speed: 45,
    status: 'NORMAL',
    statusLabel: 'Lái xe bình thường / Tập trung',
    lat: 16.035000,
    lng: 108.225000,
    currentEar: 0.29,
    currentMar: 0.18,
    lastSeen: '12 giây trước',
    recentEvidence: {
      id: 'EV-04',
      image: '/bang_chung/BUON_NGU_20261024_094018.jpg',
      time: '16:45:00',
      date: '30/10/2026',
      type: 'DROWSY',
      typeName: 'Ngủ gật / Mắt lờ đờ',
      severity: 'LOW',
      ear: 0.19,
      speed: '45 km/h',
      location: 'Đường Ngũ Hành Sơn, Đà Nẵng',
      duration: '1.2s',
      actionTaken: 'Đã nhắc nhở kết thúc ca lái'
    },
    historyEvidences: [
      {
        id: 'EV-04-H1',
        image: '/bang_chung/NGAP_SAU_20261015_173356.jpg',
        time: '08:00:00',
        date: '25/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp sâu',
        severity: 'LOW',
        mar: 0.69,
        speed: '42 km/h',
        location: 'Quận Hải Châu',
        duration: '2.0s',
        actionTaken: 'Đã xử lý'
      }
    ]
  },
  {
    id: 'V05',
    plate: '29A-111.11',
    model: 'Ford Ranger Raptor',
    driver: 'Vũ Thị H',
    driverPhone: '0911.333.444',
    speed: 35,
    status: 'NORMAL',
    statusLabel: 'Lái xe bình thường / Ổn định',
    lat: 16.060000,
    lng: 108.200000,
    currentEar: 0.31,
    currentMar: 0.12,
    lastSeen: '2 giây trước',
    recentEvidence: {
      id: 'EV-05',
      image: '/bang_chung/NGU_GAT_1.5s_20261029_100605.jpg',
      time: '10:06:05',
      date: '29/10/2026',
      type: 'DROWSY',
      typeName: 'Ngủ gật 1.5s',
      severity: 'HIGH',
      ear: 0.14,
      speed: '35 km/h',
      location: 'Sân bay Quốc tế Đà Nẵng',
      duration: '1.5s',
      actionTaken: 'Còi cabin cấp độ 2'
    },
    historyEvidences: [
      {
        id: 'EV-05-H1',
        image: '/bang_chung/NGAP_SAU_20261022_212533.jpg',
        time: '21:25:33',
        date: '22/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp sâu ca tối',
        severity: 'LOW',
        mar: 0.67,
        speed: '38 km/h',
        location: 'Đường Điện Biên Phủ',
        duration: '2.1s',
        actionTaken: 'Đã hoàn tất'
      }
    ]
  }
];

export default function LiveTracking() {
  const { t, language } = useLanguage();

  // Danh sách xe và xe đang chọn để hiển thị trên bản đồ/camera
  const [vehicles] = useState<LiveVehicle[]>(MOCK_LIVE_FLEET);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(MOCK_LIVE_FLEET[0].id);

  // Bộ lọc tìm kiếm và trạng thái ở cột trái
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ALERT' | 'NORMAL'>('ALL');

  // Chế độ bản đồ Google Maps: 'm' (Đường phố) hoặc 'y' (Vệ tinh)
  const [mapType, setMapType] = useState<'m' | 'y'>('m');

  // Modal Chi tiết bằng chứng buồn ngủ & lịch sử hình ảnh
  const [selectedEvidenceVehicle, setSelectedEvidenceVehicle] = useState<LiveVehicle | null>(null);

  // Tab lọc trong Modal: 'ALL' | 'DROWSY' | 'YAWN' | 'HEAD_DROP'
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'DROWSY' | 'YAWN' | 'HEAD_DROP'>('ALL');

  // Modal phóng to ảnh (Lightbox)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Xe đang được chọn
  const activeVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Danh sách xe lọc theo từ khóa & tab
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch =
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase());

      const isAlert = v.status === 'ALERT_DROWSY' || v.status === 'WARNING_YAWN' || v.status === 'ALERT_DISTRACTED';
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ALERT' && isAlert) ||
        (filterStatus === 'NORMAL' && !isAlert);

      return matchSearch && matchStatus;
    });
  }, [vehicles, searchTerm, filterStatus]);

  // Thống kê KPI
  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      rolling: vehicles.filter(v => v.speed > 0).length,
      drowsyAlerts: vehicles.filter(v => v.status === 'ALERT_DROWSY').length,
      warnings: vehicles.filter(v => v.status === 'WARNING_YAWN' || v.status === 'ALERT_DISTRACTED').length,
      normal: vehicles.filter(v => v.status === 'NORMAL').length
    };
  }, [vehicles]);

  // Danh sách ảnh bằng chứng lịch sử lọc theo tab trong Modal
  const modalFilteredHistory = useMemo(() => {
    if (!selectedEvidenceVehicle) return [];
    if (evidenceFilter === 'ALL') return selectedEvidenceVehicle.historyEvidences;
    return selectedEvidenceVehicle.historyEvidences.filter(e => e.type === evidenceFilter);
  }, [selectedEvidenceVehicle, evidenceFilter]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 font-sans">

      {/* =========================================================================
          1. HEADER TỔNG (GỌN GÀNG, TINH TẾ)
          ========================================================================= */}
      <div className="px-6 py-4 shrink-0 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span className="hover:text-slate-800 cursor-pointer">{t('overview.breadcrumbHome')}</span>
              <ChevronRight className="w-3 h-3 mx-1 text-slate-400" />
              <span className="text-sky-600 font-extrabold">{t('nav.tracking')}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-sky-600" />
              {t('tracking.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('tracking.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. KHÔNG GIAN LÀM VIỆC CHÍNH: CỘT TRÁI (LIST XE) + CỘT PHẢI (MAP & CAMERA)
          ========================================================================= */}
      <div className="flex-1 flex gap-4 p-5 overflow-hidden min-h-0">

        {/* -------------------------------------------------------------
            CỘT BÊN TRÁI: DANH SÁCH XE & NÚT CHI TIẾT XEM BẰNG CHỨNG AI
            ------------------------------------------------------------- */}
        <div className="w-80 lg:w-[380px] bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col shrink-0 overflow-hidden">
          {/* Header Danh sách xe */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>Danh sách xe giám sát</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-mono font-bold">
                  {filteredVehicles.length}
                </span>
              </h3>
            </div>

            {/* Ô tìm kiếm nhanh */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm biển số, tài xế..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition shadow-2xs"
              />
            </div>

            {/* Các nút Tab lọc trạng thái */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                }`}
              >
                Tất cả ({vehicles.length})
              </button>
              <button
                onClick={() => setFilterStatus('ALERT')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterStatus === 'ALERT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-600 border border-rose-200/80 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Cảnh báo ({stats.drowsyAlerts + stats.warnings})
              </button>
              <button
                onClick={() => setFilterStatus('NORMAL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'NORMAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-600 border border-emerald-200/80 hover:bg-emerald-50'
                }`}
              >
                An toàn ({stats.normal})
              </button>
            </div>
          </div>

          {/* Danh sách thẻ phương tiện cuộn mượt */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/40 divide-y divide-slate-100/80">
            {filteredVehicles.map(v => {
              const isSelected = v.id === selectedVehicleId;
              const isAlert = v.status === 'ALERT_DROWSY';
              const isWarning = v.status === 'WARNING_YAWN' || v.status === 'ALERT_DISTRACTED';

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`pt-2.5 p-3 rounded-xl border transition-all cursor-pointer relative select-none ${
                    isSelected
                      ? 'bg-white border-sky-500 shadow-md ring-2 ring-sky-200 scale-[1.01]'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Hàng 1: Biển số & Huy hiệu trạng thái */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {v.plate}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAlert
                          ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-200'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {v.statusLabel}
                    </span>
                  </div>

                  {/* Hàng 2: Thông tin tài xế & Dòng xe */}
                  <div className="text-xs text-slate-600 mb-2">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {v.driver}
                      <span className="text-[10px] font-normal text-slate-400">({v.model})</span>
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                      <span>⚡ {v.speed} km/h</span>
                      <span>EAR: <strong className={v.currentEar < 0.20 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{v.currentEar}</strong></span>
                      <span className="text-[10px] text-slate-400">{v.lastSeen}</span>
                    </div>
                  </div>

                  {/* Hàng 3: Nút Xem Chi Tiết Bằng Chứng AI (YÊU CẦU CỐT LÕI CỦA NGƯỜI DÙNG) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-slate-400" />
                      {v.historyEvidences.length + 1} ảnh chụp AI
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvidenceVehicle(v);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 rounded-lg shadow-xs shadow-sky-500/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -------------------------------------------------------------
            CỘT BÊN PHẢI: BẢN ĐỒ GOOGLE MAPS & WEBCAM AI DMS CABIN
            ------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">

          {/* KHỐI 1: BẢN ĐỒ GOOGLE MAPS TÍCH HỢP */}
          <div className="flex-[3] bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col relative">
            {/* Header Bản đồ & Nút chuyển Roadmap / Satellite */}
            <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    {t('overview.mapTitle')}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200/80 font-mono">
                      Google Maps
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMapType('m')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      mapType === 'm' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bản đồ
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('y')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      mapType === 'y' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vệ tinh
                  </button>
                </div>
              </div>
            </div>

            {/* Container React-Leaflet */}
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer
                center={[activeVehicle.lat, activeVehicle.lng]}
                zoom={14}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                style={{ height: '100%', width: '100%' }}
              >
                <MapController center={[activeVehicle.lat, activeVehicle.lng]} />
                <TileLayer
                  attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
                  url={`https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
                  subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                  maxZoom={20}
                />
                {vehicles.map(v => (
                  <Marker
                    key={v.id}
                    position={[v.lat, v.lng]}
                    icon={createLiveVehicleIcon(v.status, v.plate, v.id === selectedVehicleId)}
                    eventHandlers={{
                      click: () => setSelectedVehicleId(v.id)
                    }}
                  >
                    <Popup>
                      <div className="font-sans pt-1 min-w-[210px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 pr-4">
                          <span className="font-black text-slate-900 text-sm font-mono tracking-tight">{v.plate}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-mono">
                            {v.speed} km/h
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                          <p>👤 Tài xế: <strong className="text-slate-800">{v.driver}</strong></p>
                          <p>
                            🚨 Trạng thái:{' '}
                            <strong className={v.status === 'ALERT_DROWSY' ? 'text-rose-600' : 'text-emerald-600'}>
                              {v.statusLabel}
                            </strong>
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">📍 Tọa độ: {v.lat.toFixed(4)}, {v.lng.toFixed(4)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEvidenceVehicle(v)}
                          className="mt-2.5 w-full py-1.5 text-center bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                        >
                          Xem bằng chứng AI
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* KHỐI 2: CAMERA AI CABIN MONITORING & THAO TÁC CẢNH BÁO */}
          <div className="flex-[2] bg-slate-950 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col relative text-white">
            {/* Header Camera */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-rose-500" />
                  Luồng Camera AI Cabin • {activeVehicle.plate} ({activeVehicle.driver})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">1080P • 30FPS</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">AI DMS ONLINE</span>
              </div>
            </div>

            {/* Khung mô phỏng góc nhìn Camera AI Cabin của xe đang chọn */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-900">
              {/* Hình ảnh camera cabin chụp thực tế từ thư mục bằng chứng */}
              <img
                src={activeVehicle.recentEvidence.image}
                alt="Camera AI Cabin"
                className="w-full h-full object-cover opacity-85 filter contrast-110"
              />

              {/* Lưới tọa độ HUD Face Mesh Bounding Box mô phỏng AI */}
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start text-[11px] font-mono bg-slate-950/70 backdrop-blur-xs p-2 rounded-lg border border-slate-700/60 max-w-xs">
                  <div>
                    <p className="text-slate-400">MODEL: <span className="text-sky-400 font-bold">YOLOv8 + MediaPipe</span></p>
                    <p className="text-slate-400">TỈ LỆ MỞ MẮT (EAR): <span className={`font-bold ${activeVehicle.currentEar < 0.20 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>{activeVehicle.currentEar} (Ngưỡng: &lt; 0.20)</span></p>
                    <p className="text-slate-400">ĐỘ MỞ MIỆNG (MAR): <span className="text-amber-400 font-bold">{activeVehicle.currentMar}</span></p>
                  </div>
                </div>

                {/* Bounding box nhận diện khuôn mặt */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56 border-2 border-dashed border-rose-500/90 rounded-2xl flex flex-col justify-between p-2 shadow-2xl shadow-rose-500/30">
                  <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded self-start">
                    {activeVehicle.status === 'ALERT_DROWSY' ? '🚨 DROWSINESS DETECTED' : 'FACE DETECTED'}
                  </span>
                  <div className="flex justify-between text-[10px] font-mono text-rose-300 bg-slate-950/80 px-1 rounded">
                    <span>EAR: {activeVehicle.currentEar}</span>
                    <span>CONF: 99.4%</span>
                  </div>
                </div>

                {/* Thanh trạng thái dưới cùng của Camera */}
                <div className="flex justify-between items-center text-xs bg-slate-950/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Trạng thái:</span>
                    <strong className={activeVehicle.status === 'ALERT_DROWSY' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {activeVehicle.statusLabel}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEvidenceVehicle(activeVehicle)}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-md flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      <History className="w-3 h-3" />
                      Xem lịch sử ảnh chụp ({activeVehicle.historyEvidences.length + 1})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MODAL: CHI TIẾT BẰNG CHỨNG BUỒN NGỦ & XEM LẠI CÁC ẢNH TRƯỚC ĐÓ
          (ĐÁP ỨNG CHÍNH XÁC YÊU CẦU CỦA USER: XEM ẢNH GẦN ĐÂY & XEM LẠI ẢNH TRƯỚC ĐÓ)
          ========================================================================= */}
      {selectedEvidenceVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 border border-slate-200">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Hồ sơ Bằng chứng AI DMS • {selectedEvidenceVehicle.plate}
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {selectedEvidenceVehicle.statusLabel}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tài xế: <strong>{selectedEvidenceVehicle.driver}</strong> ({selectedEvidenceVehicle.driverPhone}) • Phương tiện: {selectedEvidenceVehicle.model}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEvidenceVehicle(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Cuộn nội dung */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">

              {/* -------------------------------------------------------------
                  PHẦN 1: ẢNH CHỤP THỜI GIAN GẦN NHẤT KHI CÓ DẤU HIỆU BUỒN NGỦ
                  ------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-3 border-b border-rose-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      Ảnh chụp sự cố buồn ngủ gần nhất (Thời gian thực)
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                    Thời gian chụp: {selectedEvidenceVehicle.recentEvidence.time} ({selectedEvidenceVehicle.recentEvidence.date})
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Khung ảnh chụp lớn sắc nét */}
                  <div className="lg:col-span-7 relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
                    <img
                      src={selectedEvidenceVehicle.recentEvidence.image}
                      alt="Ảnh chụp buồn ngủ gần nhất"
                      className="w-full h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => setLightboxImage(selectedEvidenceVehicle.recentEvidence.image)}
                    />

                    {/* HUD Watermark trên ảnh */}
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-md shadow flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{selectedEvidenceVehicle.recentEvidence.typeName}</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-xs text-white p-2.5 rounded-lg border border-slate-700/80 text-xs font-mono flex justify-between items-center">
                      <span>EAR: <strong className="text-rose-400">{selectedEvidenceVehicle.recentEvidence.ear}</strong></span>
                      <span>VẬN TỐC: <strong className="text-sky-400">{selectedEvidenceVehicle.recentEvidence.speed}</strong></span>
                      <span>THỜI LƯỢNG: <strong className="text-amber-400">{selectedEvidenceVehicle.recentEvidence.duration}</strong></span>
                    </div>

                    {/* Nút phóng to ảnh */}
                    <button
                      onClick={() => setLightboxImage(selectedEvidenceVehicle.recentEvidence.image)}
                      className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Phóng to ảnh"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thông số kỹ thuật & biên bản cảnh báo AI */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Hành vi phát hiện bởi Edge AI
                        </span>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {selectedEvidenceVehicle.recentEvidence.typeName}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Hệ thống MediaPipe + YOLOv8 quét 468 điểm mốc khuôn mặt, phát hiện mắt tài xế khép dưới ngưỡng an toàn liên tục trong {selectedEvidenceVehicle.recentEvidence.duration}.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                          <span className="text-[10px] font-bold text-rose-500 block uppercase">Chỉ số EAR</span>
                          <span className="text-lg font-black text-rose-700 font-mono">
                            {selectedEvidenceVehicle.recentEvidence.ear}
                          </span>
                          <span className="text-[10px] text-rose-400 block mt-0.5">Mức nguy hiểm &lt; 0.20</span>
                        </div>

                        <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                          <span className="text-[10px] font-bold text-sky-600 block uppercase">Vận tốc di chuyển</span>
                          <span className="text-lg font-black text-sky-800 font-mono">
                            {selectedEvidenceVehicle.recentEvidence.speed}
                          </span>
                          <span className="text-[10px] text-sky-400 block mt-0.5">Tốc độ cao nguy cơ lật</span>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-amber-700">
                          Hành động can thiệp tự động
                        </span>
                        <p className="font-medium text-[11px]">
                          {selectedEvidenceVehicle.recentEvidence.actionTaken}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a
                        href={selectedEvidenceVehicle.recentEvidence.image}
                        download={`BangChung_${selectedEvidenceVehicle.plate}_${selectedEvidenceVehicle.recentEvidence.time}.jpg`}
                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        Tải ảnh bằng chứng
                      </a>
                      <a
                        href={`tel:${selectedEvidenceVehicle.driverPhone}`}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Gọi ngay
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PHẦN 2: XEM LẠI CÁC HÌNH ẢNH TRONG THỜI GIAN TRƯỚC (HISTORY GALLERY)
                  ------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <History className="w-4 h-4 text-sky-600" />
                      Lịch sử ảnh chụp sự cố các lần trước đó
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {modalFilteredHistory.length} hình ảnh
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Xem lại kho dữ liệu ảnh AI đã chụp tự động khi phát hiện tài xế có dấu hiệu mệt mỏi trong các khung giờ trước
                    </p>
                  </div>

                  {/* Bộ lọc loại sự cố lịch sử */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setEvidenceFilter('ALL')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        evidenceFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setEvidenceFilter('DROWSY')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        evidenceFilter === 'DROWSY' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ngủ gật
                    </button>
                    <button
                      onClick={() => setEvidenceFilter('YAWN')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        evidenceFilter === 'YAWN' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ngáp sâu
                    </button>
                    <button
                      onClick={() => setEvidenceFilter('HEAD_DROP')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        evidenceFilter === 'HEAD_DROP' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gục đầu
                    </button>
                  </div>
                </div>

                {/* Grid các ảnh chụp trước đó */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {modalFilteredHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxImage(item.image)}
                      className="bg-slate-50 rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="relative h-40 bg-slate-900 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.typeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                        {/* Tag nhãn thời gian & loại vi phạm */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow ${
                              item.severity === 'HIGH'
                                ? 'bg-rose-600 text-white'
                                : item.severity === 'MEDIUM'
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-600 text-white'
                            }`}
                          >
                            {item.typeName}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-mono flex justify-between items-center">
                          <span>🕒 {item.time} ({item.date})</span>
                          <span>⚡ {item.speed}</span>
                        </div>
                      </div>

                      <div className="p-3 text-xs flex flex-col justify-between flex-1">
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] mb-1 line-clamp-1">
                            {item.typeName} ({item.duration || '2.0s'})
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            📍 {item.location}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-400">
                          <span>{item.actionTaken}</span>
                          <span className="text-sky-600 font-bold hover:underline">Xem ảnh &gt;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {modalFilteredHistory.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Không có hình ảnh vi phạm nào trong bộ lọc này.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500">
                Hệ thống lưu trữ ảnh chứng cứ tự động tại Edge Box AI trên xe và đồng bộ đám mây DriveLinker.
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvidenceVehicle(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. LIGHTBOX: PHÓNG TO ẢNH CHỤP BẰNG CHỨNG FULL HD
          ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
            <div className="mt-4 flex items-center gap-3">
              <a
                href={lightboxImage}
                download="BangChung_LiveDMS_Full.jpg"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải ảnh gốc về máy
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng phóng to
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
