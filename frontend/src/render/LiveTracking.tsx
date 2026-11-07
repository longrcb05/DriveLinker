/**
 * @file LiveTracking.tsx
 * @description Phân hệ Giám sát Trí tuệ Nhân tạo AI DMS (Driver Monitoring System).
 * - Cột trái: Danh sách đội xe trực quan kèm bộ lọc và tìm kiếm nhanh.
 * - Ô trung tâm:
 *   1. Khung hình ảnh bằng chứng AI DMS thời gian thực & các thông tin cần thiết, dễ nhìn
 *      dành riêng cho nhân viên giám sát (Loại vi phạm, EAR, Vận tốc, Hành động cabin, Gọi tài xế, Báo động cabin).
 *   2. BỘ ĐIỀU KHIỂN & CHỌN THỜI GIAN ĐỂ TUA LẠI BẰNG CHỨNG (Rewind Timeline Scrubber / Playback Controls).
 *   3. Thư viện ảnh chụp sự cố các lần trước đó (History Evidence Gallery) kèm Lightbox phóng to.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronRight, Activity, Search, Camera,
  AlertTriangle, CheckCircle2, Clock, X,
  ZoomIn, Download, Truck, User,
  History, MapPin, Eye, Phone, BellRing,
  Flame, ShieldCheck, Play, Pause, RotateCcw,
  SkipBack, SkipForward, Volume2, Siren,
  ExternalLink, Calendar, Check, Sliders
} from 'lucide-react';

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
      date: 'Hôm nay (01/11)',
      type: 'DROWSY',
      typeName: 'Ngủ gật nguy hiểm / Mắt nhắm > 1.5s',
      severity: 'HIGH',
      ear: 0.14,
      mar: 0.22,
      speed: '68 km/h',
      location: 'Đường Nguyễn Văn Linh, Đà Nẵng',
      duration: '1.5s',
      actionTaken: 'Đã kích hoạt còi cabin 10s • Rung ghế lái • Báo động điều hành'
    },
    historyEvidences: [
      {
        id: 'EV-01-H1',
        image: '/bang_chung/NGU_GAT_1.5s_20261101_133323.jpg',
        time: '09:12:05',
        date: 'Hôm nay (01/11)',
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
        date: 'Hôm nay (01/11)',
        type: 'YAWN',
        typeName: 'Ngáp sâu liên tục (> 3.0s)',
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
      date: 'Hôm nay (01/11)',
      type: 'YAWN',
      typeName: 'Ngáp sâu liên tục (> 3.0s)',
      severity: 'MEDIUM',
      mar: 0.74,
      ear: 0.24,
      speed: '52 km/h',
      location: 'QL1A Hòa Phước, Đà Nẵng',
      duration: '3.0s',
      actionTaken: 'Cảnh báo âm thanh nhắc nhở lái xe tập trung'
    },
    historyEvidences: [
      {
        id: 'EV-02-H1',
        image: '/bang_chung/NGAP_SAU_3.0s_20261029_100645.jpg',
        time: '08:50:12',
        date: 'Hôm nay (01/11)',
        type: 'YAWN',
        typeName: 'Ngáp sâu phát hiện lần 2',
        severity: 'MEDIUM',
        mar: 0.70,
        speed: '50 km/h',
        location: 'Trạm thu phí Hòa Phước',
        duration: '3.0s',
        actionTaken: 'Nhắc nhở qua loa cabin'
      },
      {
        id: 'EV-02-H2',
        image: '/bang_chung/CHOP_MAT_CHAM_(0.60s)_20261024_201530.jpg',
        time: '11:05:40',
        date: '28/10/2026',
        type: 'SLOW_BLINK',
        typeName: 'Chớp mắt chậm liên hồi',
        severity: 'LOW',
        ear: 0.17,
        speed: '48 km/h',
        location: 'Đường CMT8, Đà Nẵng',
        duration: '0.6s',
        actionTaken: 'Ghi nhật ký hệ thống'
      },
      {
        id: 'EV-02-H3',
        image: '/bang_chung/NGU_GAT_1.5s_20261101_133333.jpg',
        time: '16:40:22',
        date: '26/10/2026',
        type: 'DROWSY',
        typeName: 'Mắt nhắm 1.5s khi dừng đèn đỏ',
        severity: 'HIGH',
        ear: 0.14,
        speed: '0 km/h',
        location: 'Ngã tư cầu Tuyên Sơn',
        duration: '1.5s',
        actionTaken: 'Báo động cabin'
      }
    ]
  },
  {
    id: 'V03',
    plate: '51D-987.65',
    model: 'Hino 500 Series FL 8T',
    driver: 'Trần Thị B',
    driverPhone: '0988.777.666',
    speed: 40,
    status: 'ALERT_DISTRACTED',
    statusLabel: 'Cúi đầu / Mất tập trung',
    lat: 16.038000,
    lng: 108.212000,
    currentEar: 0.20,
    currentMar: 0.25,
    lastSeen: 'Vừa xong',
    recentEvidence: {
      id: 'EV-03',
      image: '/bang_chung/GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220943.jpg',
      time: '09:05:00',
      date: 'Hôm nay (01/11)',
      type: 'HEAD_DROP',
      typeName: 'Cúi đầu xem điện thoại',
      severity: 'MEDIUM',
      pitch: -32,
      speed: '40 km/h',
      location: 'Đường 2/9, Hải Châu, Đà Nẵng',
      duration: '3.2s',
      actionTaken: 'Cảnh báo âm thanh: Hãy chú ý quan sát đường phía trước'
    },
    historyEvidences: [
      {
        id: 'EV-03-H1',
        image: '/bang_chung/GUC_DAU_(NHAM_MAT)_(3.2s)_20261022_220953.jpg',
        time: '08:30:10',
        date: 'Hôm nay (01/11)',
        type: 'HEAD_DROP',
        typeName: 'Gục đầu trong cabin',
        severity: 'HIGH',
        pitch: -35,
        speed: '38 km/h',
        location: 'Đường Duy Tân',
        duration: '3.2s',
        actionTaken: 'Hú còi cabin cấp 2'
      },
      {
        id: 'EV-03-H2',
        image: '/bang_chung/NGAP_SAU_3.0s_20261029_100655.jpg',
        time: '15:20:00',
        date: '28/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp mệt mỏi ca chiều',
        severity: 'MEDIUM',
        mar: 0.71,
        speed: '42 km/h',
        location: 'Cầu Trần Thị Lý',
        duration: '3.0s',
        actionTaken: 'Gợi ý đổi tài xế'
      }
    ]
  },
  {
    id: 'V04',
    plate: '15C-456.78',
    model: 'Hyundai Mighty EX8 GTL 7T',
    driver: 'Lê Văn C',
    driverPhone: '0935.456.789',
    speed: 58,
    status: 'NORMAL',
    statusLabel: 'Lái xe an toàn / Tập trung',
    lat: 16.035000,
    lng: 108.225000,
    currentEar: 0.29,
    currentMar: 0.18,
    lastSeen: '15 giây trước',
    recentEvidence: {
      id: 'EV-04',
      image: '/bang_chung/CANH_BAO_VANG_3_LAN_CAM_10P_-_NGAP_LIEN_TUC_20261029_100705.jpg',
      time: '07:45:00',
      date: 'Hôm nay (01/11)',
      type: 'YAWN',
      typeName: 'Kiểm tra DMS an toàn ban đầu',
      severity: 'LOW',
      ear: 0.29,
      mar: 0.18,
      speed: '58 km/h',
      location: 'Đường Võ Nguyên Giáp, Đà Nẵng',
      duration: '0s',
      actionTaken: 'Chỉ số bình thường, hệ thống duy trì giám sát định kỳ'
    },
    historyEvidences: [
      {
        id: 'EV-04-H1',
        image: '/bang_chung/CHOP_MAT_CHAM_(0.60s)_20261024_201535.jpg',
        time: '14:10:00',
        date: '27/10/2026',
        type: 'SLOW_BLINK',
        typeName: 'Chớp mắt bình thường',
        severity: 'LOW',
        ear: 0.21,
        speed: '55 km/h',
        location: 'Bán đảo Sơn Trà',
        duration: '0.6s',
        actionTaken: 'Ghi nhận an toàn'
      }
    ]
  },
  {
    id: 'V05',
    plate: '29A-111.11',
    model: 'Ford Transit Limousine 10 Chỗ',
    driver: 'Hoàng Văn D',
    driverPhone: '0977.111.222',
    speed: 60,
    status: 'NORMAL',
    statusLabel: 'An toàn / Tỉnh táo hoàn toàn',
    lat: 16.062000,
    lng: 108.218000,
    currentEar: 0.32,
    currentMar: 0.15,
    lastSeen: '2 giây trước',
    recentEvidence: {
      id: 'EV-05',
      image: '/bang_chung/CHOP_MAT_CHAM_(0.60s)_20261024_201540.jpg',
      time: '08:00:15',
      date: 'Hôm nay (01/11)',
      type: 'SLOW_BLINK',
      typeName: 'Trạng thái lái xe tỉnh táo',
      severity: 'LOW',
      ear: 0.32,
      mar: 0.15,
      speed: '60 km/h',
      location: 'Cảng Tiên Sa, Đà Nẵng',
      duration: '0s',
      actionTaken: 'Lái xe an toàn tiêu chuẩn'
    },
    historyEvidences: [
      {
        id: 'EV-05-H1',
        image: '/bang_chung/NGAP_LIEN_TUC_20261022_214436.jpg',
        time: '16:00:00',
        date: '25/10/2026',
        type: 'YAWN',
        typeName: 'Ngáp nhẹ trước giờ giao ca',
        severity: 'MEDIUM',
        mar: 0.65,
        speed: '45 km/h',
        location: 'Đường Bạch Đằng',
        duration: '2.0s',
        actionTaken: 'Nhắc nhở nghỉ ngơi'
      }
    ]
  }
];

export default function LiveTracking() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const plateParam = searchParams.get('plate');

  const [vehicles] = useState<LiveVehicle[]>(MOCK_LIVE_FLEET);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V01');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ALERT' | 'NORMAL'>('ALL');

  // Lọc lịch sử ảnh theo loại vi phạm
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'DROWSY' | 'YAWN' | 'HEAD_DROP'>('ALL');

  // Xem ảnh phóng to Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Trạng thái báo động còi cabin khẩn cấp
  const [cabinAlarmAlert, setCabinAlarmAlert] = useState<string | null>(null);

  // Vị trí mốc bằng chứng đang chọn trên thanh tua thời gian (0 = Gần nhất)
  const [currentEvidenceIndex, setCurrentEvidenceIndex] = useState<number>(0);

  // Chế độ phát lại tự động (Slideshow / Auto Replay)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Tự động chọn xe khi có query param từ trang Tổng quan
  useEffect(() => {
    if (plateParam) {
      const found = vehicles.find(
        v => v.plate.toLowerCase() === plateParam.toLowerCase() || v.id.toLowerCase() === plateParam.toLowerCase()
      );
      if (found) {
        setSelectedVehicleId(found.id);
      }
    }
  }, [plateParam, vehicles]);

  // Xe đang được chọn
  const activeVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Reset về mốc gần nhất và dừng phát khi đổi xe
  useEffect(() => {
    setCurrentEvidenceIndex(0);
    setIsPlaying(false);
  }, [selectedVehicleId]);

  // Danh sách toàn bộ bằng chứng của xe hiện tại (Mốc 0 là mới nhất)
  const timelineEvidences = useMemo(() => {
    return [activeVehicle.recentEvidence, ...activeVehicle.historyEvidences];
  }, [activeVehicle]);

  // Bằng chứng đang được chọn xem (theo thanh tua thời gian)
  const currentEvidence = useMemo(() => {
    return timelineEvidences[currentEvidenceIndex] || timelineEvidences[0];
  }, [timelineEvidences, currentEvidenceIndex]);

  // Hiệu ứng tự động tua lại qua các mốc bằng chứng
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentEvidenceIndex(prev => {
          if (prev >= timelineEvidences.length - 1) {
            setIsPlaying(false);
            return 0; // Quay về mốc mới nhất
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timelineEvidences.length]);

  // Lọc danh sách xe theo từ khóa và trạng thái
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

  // Thống kê đếm trạng thái
  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      drowsyAlerts: vehicles.filter(v => v.status === 'ALERT_DROWSY').length,
      warnings: vehicles.filter(v => v.status === 'WARNING_YAWN' || v.status === 'ALERT_DISTRACTED').length,
      normal: vehicles.filter(v => v.status === 'NORMAL').length
    };
  }, [vehicles]);

  // Danh sách ảnh bằng chứng lịch sử lọc theo tab
  const filteredHistory = useMemo(() => {
    if (evidenceFilter === 'ALL') return activeVehicle.historyEvidences;
    return activeVehicle.historyEvidences.filter(e => e.type === evidenceFilter);
  }, [activeVehicle, evidenceFilter]);

  // Hàm kích hoạt còi cabin khẩn cấp
  const handleTriggerCabinAlarm = () => {
    setCabinAlarmAlert(`Đã kích hoạt còi báo động khẩn cấp (105dB) đến Cabin xe ${activeVehicle.plate}!`);
    setTimeout(() => {
      setCabinAlarmAlert(null);
    }, 4500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] font-sans">

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

      {/* Thông báo còi báo động cabin */}
      {cabinAlarmAlert && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 animate-bounce" />
            <span>{cabinAlarmAlert}</span>
          </div>
          <button onClick={() => setCabinAlarmAlert(null)} className="p-1 hover:bg-rose-700 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          2. KHÔNG GIAN LÀM VIỆC CHÍNH: CỘT TRÁI (LIST XE) + CỘT PHẢI (FULL Ô AI DMS & TUA THỜI GIAN)
          ========================================================================= */}
      <div className="flex-1 flex gap-4 p-5 overflow-hidden min-h-0">

        {/* -------------------------------------------------------------
            CỘT BÊN TRÁI: DANH SÁCH XE & NÚT CHI TIẾT
            ------------------------------------------------------------- */}
        <div className="w-80 lg:w-[340px] bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col shrink-0 overflow-hidden">
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

          {/* Danh sách thẻ phương tiện */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/40">
            {filteredVehicles.map(v => {
              const isSelected = v.id === selectedVehicleId;
              const isAlert = v.status === 'ALERT_DROWSY';
              const isWarning = v.status === 'WARNING_YAWN' || v.status === 'ALERT_DISTRACTED';

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative select-none ${
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

                  {/* Hàng 3: Nút Xem Chi Tiết */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-slate-400" />
                      {v.historyEvidences.length + 1} ảnh chụp AI
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicleId(v.id);
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
            CỘT BÊN PHẢI: KHUNG CHỨA ẢNH & THÔNG TIN AI DMS (FORMAT GỌN GÀNG + TUA THỜI GIAN)
            ------------------------------------------------------------- */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden min-h-0">

          {/* 1. Thanh Tiêu Đề Xe (Header Thông Tin) */}
          <div className="px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="font-mono font-black text-base bg-slate-900 text-white px-3 py-1 rounded-xl shadow-xs">
                {activeVehicle.plate}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{activeVehicle.driver}</span>
                  <span className="text-xs font-normal text-slate-500">({activeVehicle.model})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>📞 {activeVehicle.driverPhone}</span>
                  <span>•</span>
                  <span>⚡ {activeVehicle.speed} km/h</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-500" />
                    {activeVehicle.recentEvidence.location}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badge Trạng thái hiện tại của xe */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl shadow-2xs ${
                  activeVehicle.status === 'ALERT_DROWSY'
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : activeVehicle.status === 'WARNING_YAWN' || activeVehicle.status === 'ALERT_DISTRACTED'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {activeVehicle.status === 'ALERT_DROWSY' ? (
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                ) : activeVehicle.status === 'WARNING_YAWN' || activeVehicle.status === 'ALERT_DISTRACTED' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{activeVehicle.statusLabel}</span>
              </span>

              {/* Phím tắt thao tác nhanh */}
              <a
                href={`tel:${activeVehicle.driverPhone}`}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Gọi tài xế</span>
              </a>

              <a
                href={currentEvidence.image}
                download={`Evidence_${activeVehicle.plate}_${currentEvidence.time}.jpg`}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Tải ảnh</span>
              </a>
            </div>
          </div>

          {/* 2. Thân Khung Cuộn (Nội dung bằng chứng + Thanh tua thời gian) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">

            {/* =============================================================
                CARD CHÍNH: KHUNG HÌNH ẢNH RÕ RÀNG & THÔNG TIN DỄ THẤY CHO GIÁM SÁT
                ============================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">

              {/* Header của Khung Bằng Chứng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <span>Bằng chứng hình ảnh AI DMS</span>
                      {currentEvidenceIndex === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                          Sự cố mới nhất
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                          Đang tua lại: Mốc {currentEvidenceIndex + 1}/{timelineEvidences.length}
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Thời điểm ghi nhận: <strong>{currentEvidence.time}</strong> • {currentEvidence.date}</span>
                  </span>
                </div>
              </div>

              {/* Bố cục 2 Cột: Hình ảnh sạch sẽ bên trái + Bảng thông số dễ thấy bên phải */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

                {/* CỘT TRÁI: HÌNH ẢNH BẰNG CHỨNG THỰC TẾ (SẮC NÉT, KHÔNG BỊ CSS GIẢ CHE MẶT) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group flex-1 min-h-[300px] flex items-center justify-center">
                    <img
                      src={currentEvidence.image}
                      alt={currentEvidence.typeName}
                      className="w-full h-full max-h-[360px] object-contain bg-black group-hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                      onClick={() => setLightboxImage(currentEvidence.image)}
                    />

                    {/* Huy hiệu loại vi phạm tinh tế ở góc trên */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 ${
                          currentEvidence.severity === 'HIGH'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : currentEvidence.severity === 'MEDIUM'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{currentEvidence.typeName}</span>
                      </span>
                    </div>

                    {/* Nhãn địa điểm và vận tốc nhẹ nhàng ở góc dưới */}
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono flex justify-between items-center">
                      <span className="flex items-center gap-1 text-slate-300 truncate max-w-[280px]">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{currentEvidence.location}</span>
                      </span>
                      <span className="text-sky-400 font-bold shrink-0">{currentEvidence.speed}</span>
                    </div>

                    {/* Nút phóng to Lightbox */}
                    <button
                      onClick={() => setLightboxImage(currentEvidence.image)}
                      className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer shadow"
                      title="Phóng to ảnh"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CỘT PHẢI: CÁC THÔNG TIN CẦN THIẾT & DỄ THẤY CHO NHÂN VIÊN GIÁM SÁT */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-3 text-xs">

                    {/* 1. Tên hành vi vi phạm (To & Đập vào mắt) */}
                    <div
                      className={`p-3.5 rounded-xl border ${
                        currentEvidence.severity === 'HIGH'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : currentEvidence.severity === 'MEDIUM'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Hành vi phát hiện
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            currentEvidence.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : currentEvidence.severity === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {currentEvidence.severity === 'HIGH' ? '🚨 CỰC KỲ NGUY HIỂM' : currentEvidence.severity === 'MEDIUM' ? '⚠️ CẢNH BÁO MỨC 2' : '✅ AN TOÀN'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base leading-tight mt-0.5">
                        {currentEvidence.typeName}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Thời lượng duy trì: <strong className="text-slate-900">{currentEvidence.duration || '1.5s'}</strong>
                      </p>
                    </div>

                    {/* 2. Lưới 3 Chỉ số Sinh trắc học & Vận tốc */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Thẻ EAR Chỉ số Mở Mắt */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Chỉ số mở mắt (EAR)
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span
                            className={`text-2xl font-black font-mono ${
                              (currentEvidence.ear ?? 0.20) < 0.20
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {currentEvidence.ear ?? 0.14}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">/ 0.35</span>
                        </div>
                        {/* Thanh đo trực quan EAR */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (currentEvidence.ear ?? 0.20) < 0.20 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, ((currentEvidence.ear ?? 0.14) / 0.35) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {(currentEvidence.ear ?? 0.20) < 0.20 ? '⚠️ Dưới ngưỡng 0.20 (Nhắm mắt)' : 'Mở mắt bình thường'}
                        </span>
                      </div>

                      {/* Thẻ Vận tốc Xe */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Vận tốc xe
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black font-mono text-sky-700">
                            {currentEvidence.speed}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (parseInt(currentEvidence.speed) / 100) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          Đang di chuyển trên tuyến
                        </span>
                      </div>
                    </div>

                    {/* 3. Hành động can thiệp đã kích hoạt */}
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-500 flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-amber-500" />
                        Hành động can thiệp cabin đã kích hoạt
                      </span>
                      <p className="font-semibold text-[11px] text-slate-800 leading-relaxed">
                        {currentEvidence.actionTaken}
                      </p>
                    </div>
                  </div>

                  {/* 4. Cụm nút xử lý khẩn cấp dành cho Nhân viên giám sát */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTriggerCabinAlarm}
                      className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Siren className="w-4 h-4 animate-pulse" />
                      <span>Phát còi cabin khẩn cấp (Nhắc nhở lái xe)</span>
                    </button>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${activeVehicle.driverPhone}`}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi tài xế ({activeVehicle.driverPhone})</span>
                      </a>
                      <a
                        href={currentEvidence.image}
                        download={`BangChung_${activeVehicle.plate}_${currentEvidence.time}.jpg`}
                        className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Tải ảnh bằng chứng"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* =============================================================
                  BỘ ĐIỀU KHIỂN & CHỌN THỜI GIAN ĐỂ TUA LẠI BẰNG CHỨNG (TIME SCRUBBER)
                  ============================================================= */}
              <div className="pt-4 mt-2 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Thanh tua thời gian & Xem lại bằng chứng
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {timelineEvidences.length} mốc ghi nhận
                    </span>
                  </div>

                  {/* Nút điều khiển phát lại tua tự động */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentEvidenceIndex(prev => Math.min(timelineEvidences.length - 1, prev + 1));
                      }}
                      disabled={currentEvidenceIndex >= timelineEvidences.length - 1}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      title="Mốc trước đó (cũ hơn)"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Tạm dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Tự động tua</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentEvidenceIndex(prev => Math.max(0, prev - 1));
                      }}
                      disabled={currentEvidenceIndex <= 0}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                      title="Mốc tiếp theo (mới hơn)"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentEvidenceIndex(0);
                      }}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        currentEvidenceIndex === 0
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Về sự cố mới nhất"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Mới nhất</span>
                    </button>
                  </div>
                </div>

                {/* Thanh Slider Tua Thời Gian */}
                <div className="relative pt-1 pb-2">
                  <input
                    type="range"
                    min="0"
                    max={timelineEvidences.length - 1}
                    value={currentEvidenceIndex}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentEvidenceIndex(parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>🔴 Mới nhất: {timelineEvidences[0].time}</span>
                    <span className="font-bold text-sky-600">Đang xem: {currentEvidence.time} ({currentEvidence.date})</span>
                    <span>Cũ nhất: {timelineEvidences[timelineEvidences.length - 1].time}</span>
                  </div>
                </div>

                {/* Dải Chọn Nhanh Các Mốc Thời Gian (Chips / Pills) */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                  {timelineEvidences.map((ev, idx) => {
                    const isSelected = idx === currentEvidenceIndex;
                    const isAlert = ev.severity === 'HIGH';
                    const isWarning = ev.severity === 'MEDIUM';

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentEvidenceIndex(idx);
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                            : isAlert
                            ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                            : isWarning
                            ? 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAlert ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{ev.time}</span>
                        <span className="text-[10px] font-normal opacity-75">({ev.date})</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* =============================================================
                CARD 2: THƯ VIỆN LỊCH SỬ CÁC HÌNH ẢNH TRƯỚC ĐÓ (HISTORY GALLERY)
                ============================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-600" />
                    Lịch sử toàn bộ ảnh chụp sự cố của xe
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {filteredHistory.length} hình ảnh
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nhấp vào bất kỳ ảnh nào để xem phóng to hoặc chọn xem trên khung phân tích chính
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

              {/* Lưới các ảnh chụp trước đó */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxImage(item.image)}
                    className="bg-slate-50 rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.typeName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                      {/* Tag nhãn loại vi phạm */}
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
                        <span className="truncate max-w-[180px]">{item.actionTaken}</span>
                        <span className="text-sky-600 font-bold group-hover:underline flex items-center gap-0.5">
                          Phóng to <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* =========================================================================
          3. LIGHTBOX: XEM TOÀN MÀN HÌNH KHI BẤM VÀO BẤT KỲ ẢNH NÀO
          ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center text-white">
              <span className="text-xs font-mono font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                Ảnh chụp bằng chứng gốc độ nét cao • {activeVehicle.plate}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage}
                  download="BangChung_ChiTiet.jpg"
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải ảnh
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center p-2 bg-slate-950">
              <img
                src={lightboxImage}
                alt="Bằng chứng toàn màn hình"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
