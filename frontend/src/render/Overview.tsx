/**
 * @file Overview.tsx
 * @description Trang Tổng quan hệ thống.
 * Cung cấp cái nhìn toàn cảnh về đội xe thông qua các thẻ thống kê KPI.
 * Tích hợp bản đồ Google Maps thời gian thực và phân tích chi tiết hiệu suất doanh thu.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronRight, Truck, AlertTriangle,
  MapPin, CheckCircle2, RefreshCw,
  Clock, Wallet, TrendingUp, ShieldAlert, BellRing, Wrench, X, Search, Lock,
  ArrowUpRight, Navigation, Radio, Calendar
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tạo biểu tượng xe Google Maps phong cách Telematics chuyên nghiệp
const createVehicleIcon = (status: string, plate: string) => {
  const isRenting = status === 'RENTING' || status === 'RENTED';
  const color = isRenting ? '#10B981' : '#0EA5E9';
  const shadow = isRenting ? 'rgba(16, 185, 129, 0.45)' : 'rgba(14, 165, 233, 0.45)';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: white; border: 1.5px solid ${color}; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; font-family: monospace; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.18); white-space: nowrap; margin-bottom: 2px;">
          ${plate}
        </div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 8px ${shadow}; border: 2px solid white;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -48]
  });
};

/**
 * Component tự động cập nhật tâm bản đồ và làm mới kích thước Leaflet.
 */
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

// === BỘ DỮ LIỆU DEMO ĐA DOANH NGHIỆP CHI TIẾT ===
const MOCK_DATA_BY_TENANT: Record<string, any> = {
  'COMPANY_A': {
    center: [16.047079, 108.206230], // Đà Nẵng
    revenue: {
      amount: '128.5',
      growth: 'Tăng 12%',
      growthPercent: '+12.4%',
      rentalRevenue: '96.4 Tr',
      serviceRevenue: '32.1 Tr',
      utilization: '66%',
      collection: '85%'
    },
    vehicles: [
      { id: '29C-123.45', lat: 16.047079, lng: 108.206230, status: 'RENTING', type: 'Xe Tải 5T', driver: 'Nguyễn Văn A', speed: '65 km/h' },
      { id: '51D-987.65', lat: 16.055000, lng: 108.215000, status: 'AVAILABLE', type: 'Xe Tải 8T', driver: 'Chưa xếp tài', speed: '0 km/h' },
      { id: '15C-456.78', lat: 16.035000, lng: 108.225000, status: 'MAINTENANCE', type: 'Xe Tải 2T', driver: 'Đang sửa chữa', speed: '0 km/h' },
    ],
    alerts: [
      { id: 1, time: '10:30', vehicle: '29C-123.45', type: 'Ngủ gật', message: 'Mắt nhắm > 3s. Đã hú còi cabin.', severity: 'high' },
      { id: 2, time: '09:15', vehicle: '43A-112.22', type: 'Quá tốc độ', message: 'Vượt tốc độ 85/60 km/h tại QL1A.', severity: 'medium' },
      { id: 3, time: '08:00', vehicle: '92C-555.33', type: 'Lệch làn', message: 'Lệch làn đường liên tục.', severity: 'low' },
    ]
  },
  'COMPANY_B': {
    center: [10.762622, 106.660172], // TP. Hồ Chí Minh
    revenue: {
      amount: '450.2',
      growth: 'Tăng 25%',
      growthPercent: '+25.0%',
      rentalRevenue: '360.0 Tr',
      serviceRevenue: '90.2 Tr',
      utilization: '85%',
      collection: '92%'
    },
    vehicles: [
      { id: '51F-888.11', lat: 10.762622, lng: 106.660172, status: 'RENTING', type: 'Xe Tải 15T', driver: 'Phạm Văn D', speed: '50 km/h' },
      { id: '51G-999.22', lat: 10.775000, lng: 106.700000, status: 'AVAILABLE', type: 'Xe Khách', driver: 'Hoàng Thị E', speed: '0 km/h' },
    ],
    alerts: [
      { id: 4, time: '14:20', vehicle: '51G-999.22', type: 'Vượt đèn đỏ', message: 'Vượt đèn đỏ tại ngã tư.', severity: 'high' },
    ]
  },
  'COMPANY_C': {
    center: [21.028511, 105.804817], // Hà Nội
    revenue: {
      amount: '15.8',
      growth: 'Giảm 2%',
      growthPercent: '-2.1%',
      rentalRevenue: '12.6 Tr',
      serviceRevenue: '3.2 Tr',
      utilization: '60%',
      collection: '98%'
    },
    vehicles: [
      { id: '29A-111.11', lat: 21.028511, lng: 105.804817, status: 'RENTING', type: 'Xe Bán Tải', driver: 'Vũ Thị H', speed: '35 km/h' }
    ],
    alerts: []
  }
};

const DEFAULT_DATA = MOCK_DATA_BY_TENANT['COMPANY_A'];

export default function Overview() {
  const { language, t } = useLanguage();
  const [userRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantId] = useState(localStorage.getItem('tenantId') || 'COMPANY_A');

  // Kiểm tra quyền để hiển thị dữ liệu Doanh thu
  const isManager = userRole === 'TENANT_ADMIN' || userRole === 'SYS_ADMIN' || userRole === 'SUPER_ADMIN_VIEW';

  const [activePanel, setActivePanel] = useState<'ALL' | 'RENTING' | 'AVAILABLE' | 'MAINTENANCE' | 'ALERTS' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_DATA.center);
  const [mapType, setMapType] = useState<'m' | 'y'>('m'); // 'm': Roadmap (Đường phố), 'y': Satellite/Hybrid (Vệ tinh)
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(DEFAULT_DATA.revenue);

  const kpiStats = {
    totalVehicles: vehicles.length,
    renting: vehicles.filter(v => v.status === 'RENTING' || v.status === 'RENTED').length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'PENDING_INSPECTION').length,
    aiAlerts: alerts.length
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const currentData = MOCK_DATA_BY_TENANT[tenantId] || DEFAULT_DATA;

      setMapCenter(currentData.center);
      setVehicles(currentData.vehicles);
      setAlerts(currentData.alerts);
      setRevenueData(currentData.revenue);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId]);

  const getPanelData = () => {
    let data = vehicles;
    if (activePanel === 'RENTING') data = vehicles.filter(v => v.status === 'RENTING');
    if (activePanel === 'AVAILABLE') data = vehicles.filter(v => v.status === 'AVAILABLE');
    if (activePanel === 'MAINTENANCE') data = vehicles.filter(v => v.status === 'MAINTENANCE');

    if (searchTerm) {
      data = data.filter(v =>
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return data;
  };

  // --- LUỒNG HIỂN THỊ DÀNH CHO SYS_ADMIN ---
  if (userRole === 'SYS_ADMIN') {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-xl max-w-lg w-full">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-rose-200">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2.5">{t('common.warning')}</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Trang Tổng quan chỉ chứa dữ liệu vận hành riêng của từng Doanh nghiệp. Vui lòng chuyển sang trang <b>Quản lý Doanh nghiệp</b> để phân quyền hoặc giám sát toàn hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* CSS làm sạch viền trắng mặc định của Leaflet divIcon */}
      <style>{`
        .custom-vehicle-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: #e5e7eb;
        }
      `}</style>

      {/* ================= KHU VỰC CHÍNH ================= */}
      <div className="flex-1 overflow-auto p-6 space-y-6 relative">

        {/* HEADER BREADCRUMB & LIVE CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              <span className="hover:text-slate-800 cursor-pointer transition-colors">{t('overview.breadcrumbHome')}</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-sky-600 font-extrabold">{t('overview.breadcrumbOverview')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">{t('overview.title')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('overview.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer group"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span>{isLoading ? t('overview.loading') : t('overview.refreshBtn')}</span>
            </button>
          </div>
        </div>

        {/* HÀNG 1: THẺ THỐNG KÊ KPI TƯƠNG TÁC (MICRO-ANIMATION ICONS) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <StatCard
            title={t('overview.kpiTotal')}
            value={isLoading ? '...' : kpiStats.totalVehicles}
            icon={Truck}
            color="sky"
            onClick={() => setActivePanel('ALL')}
            active={activePanel === 'ALL'}
            desc={t('overview.kpiTotalSub')}
            badge="100%"
          />
          <StatCard
            title={t('overview.kpiRenting')}
            value={isLoading ? '...' : kpiStats.renting}
            icon={CheckCircle2}
            color="emerald"
            onClick={() => setActivePanel('RENTING')}
            active={activePanel === 'RENTING'}
            desc={t('overview.kpiRentingSub')}
            badge={t('overview.badgeActive')}
          />
          <StatCard
            title={t('overview.kpiAvailable')}
            value={isLoading ? '...' : kpiStats.available}
            icon={Clock}
            color="indigo"
            onClick={() => setActivePanel('AVAILABLE')}
            active={activePanel === 'AVAILABLE'}
            desc={t('overview.kpiAvailableSub')}
            badge={t('overview.badgeAvailable')}
          />
          <StatCard
            title={t('overview.kpiMaintenance')}
            value={isLoading ? '...' : kpiStats.maintenance}
            icon={Wrench}
            color="amber"
            onClick={() => setActivePanel('MAINTENANCE')}
            active={activePanel === 'MAINTENANCE'}
            desc={t('overview.kpiMaintenanceSub')}
            badge={t('overview.badgePaused')}
          />

          {/* Thẻ Cảnh Báo AI Nguy Hiểm */}
          <div
            onClick={() => setActivePanel('ALERTS')}
            className={`group p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              activePanel === 'ALERTS'
                ? 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-300 shadow-md scale-[1.02]'
                : 'border-rose-100 bg-white hover:border-rose-300 hover:shadow-xs hover:-translate-y-0.5'
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t('overview.kpiAlerts')}</span>
              <div className="p-2 bg-rose-100/80 text-rose-600 rounded-xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 shadow-xs">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">
                {isLoading ? '...' : kpiStats.aiAlerts}
              </h3>
              <p className="text-[11px] font-semibold text-rose-500/90 mt-1 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-ping text-rose-500" /> {t('overview.kpiAlertsSub')}
              </p>
            </div>
          </div>
        </div>

        {/* HÀNG 2: BẢN ĐỒ GOOGLE MAPS LIVE TRACKING & HIỆU SUẤT DOANH THU GỌN GÀNG */}
        <div className="flex flex-col lg:flex-row gap-6 h-[430px]">

          {/* Bản đồ Live Tracking Tích Hợp Google Maps API */}
          <div className="flex-[2] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative z-0">
            
            {/* Header của Bản Đồ */}
            <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('overview.mapTitle')}</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200/80 font-mono">
                      Google Maps
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t('overview.mapSubtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Bộ chuyển chế độ Bản đồ Google Maps */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMapType('m')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      mapType === 'm'
                        ? 'bg-white text-sky-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'vi' ? 'Bản đồ' : 'Roadmap'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('y')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      mapType === 'y'
                        ? 'bg-white text-sky-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'vi' ? 'Vệ tinh' : 'Satellite'}
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs font-medium pl-2 border-l border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {t('overview.mapRenting')} ({kpiStats.renting})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> {t('overview.mapAvailable')} ({kpiStats.available})
                  </span>
                </div>
              </div>
            </div>

            {/* Khung Bản đồ Google Maps phủ toàn bộ không gian còn lại */}
            <div className="flex-1 w-full h-full relative z-0">
              {!isLoading && (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  scrollWheelZoom={true}
                  className="w-full h-full z-0"
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapUpdater center={mapCenter} />
                  <TileLayer
                    attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
                    url={`https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    maxZoom={20}
                  />
                  {vehicles.filter(v => v.status !== 'MAINTENANCE').map((vehicle, index) => (
                    <Marker
                      key={index}
                      position={[vehicle.lat, vehicle.lng]}
                      icon={createVehicleIcon(vehicle.status, vehicle.id)}
                    >
                      <Popup>
                        <div className="font-sans p-1 min-w-[170px]">
                          <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                            <span className="font-black text-slate-900 text-sm font-mono">{vehicle.id}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${vehicle.status === 'RENTING' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                              {vehicle.status === 'RENTING' ? t('overview.mapRenting') : t('overview.mapAvailable')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">👤 {t('overview.driverLabel')} <strong>{vehicle.driver}</strong></p>
                          <p className="text-xs text-slate-600">⚡ {t('overview.speedLabel')} <strong>{vehicle.speed}</strong></p>
                          <p className="text-xs text-slate-500 mt-1">{t('overview.typeLabel')} {vehicle.type}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Module Phân quyền: Hiệu suất Doanh thu (Thiết kế Tinh tế & Cao cấp) */}
          <div className="flex-[1] bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
            {/* Header Doanh Thu */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t('overview.revPerformance')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {language === 'vi' ? 'Chỉ số tài chính đội xe' : 'Fleet Financial Metrics'}
                  </p>
                </div>
              </div>
              {!isManager ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3" /> {t('overview.restricted')}
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 rounded-lg shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'vi' ? 'Tháng 11/2026' : 'Nov 2026'}</span>
                </div>
              )}
            </div>

            {/* Nội dung Doanh thu đẹp mắt, cân xứng & hiện đại */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
              {/* Khối 1: Doanh thu tổng & Tăng trưởng */}
              <div className="bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 rounded-xl p-3.5 border border-slate-100 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('overview.revTotalEstimated')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {language === 'vi' ? 'Chỉ tiêu: 150 Tr' : 'Target: 150M'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline">
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      {isManager ? (isLoading ? '...' : revenueData.amount) : '***'}
                    </h3>
                    <span className="text-sm font-bold text-slate-400 ml-1.5">{t('overview.revMillion')}</span>
                  </div>
                  {isManager && (
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-2xs ${
                        revenueData.growth?.includes('Tăng')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      }`}>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        {revenueData.growthPercent || revenueData.growth}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                        {language === 'vi' ? 'so với kỳ trước' : 'vs last period'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Khối 2: 2 Thẻ chi tiết nguồn thu với Gradient, Dot phát sáng và Mini Progress Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 border border-sky-100/90 hover:border-sky-200 transition-all shadow-2xs group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
                      {language === 'vi' ? 'Thuê xe HĐ' : 'Contract'}
                    </span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded-md font-mono">
                      75%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 tracking-tight font-sans">
                    {isManager ? (revenueData.rentalRevenue || '96.4 Tr') : '***'}
                  </div>
                  <div className="w-full bg-sky-100/70 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-700" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 border border-emerald-100/90 hover:border-emerald-200 transition-all shadow-2xs group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                      {language === 'vi' ? 'Dịch vụ phụ' : 'Services'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md font-mono">
                      25%
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900 tracking-tight font-sans">
                    {isManager ? (revenueData.serviceRevenue || '32.1 Tr') : '***'}
                  </div>
                  <div className="w-full bg-emerald-100/70 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>

              {/* Khối 3: 2 Thanh chỉ số vận hành với nhãn giá trị Badge rõ ràng */}
              <div className="space-y-3 pt-3.5 border-t border-slate-100">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-500" />
                      {t('overview.revUtilization')}
                    </span>
                    <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded-md font-mono text-[11px] shadow-2xs">
                      {isManager ? revenueData.utilization : '***'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/40">
                    <div
                      className="bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 h-full rounded-full transition-all duration-1000 shadow-xs"
                      style={{ width: isLoading ? '0%' : (isManager ? revenueData.utilization : '0%') }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {t('overview.revCollection')}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md font-mono text-[11px] shadow-2xs">
                      {isManager ? revenueData.collection : '***'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5 border border-slate-200/40">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 h-full rounded-full transition-all duration-1000 shadow-xs"
                      style={{ width: isLoading ? '0%' : (isManager ? revenueData.collection : '0%') }}
                    />
                  </div>
                </div>
              </div>

              {!isManager && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                  <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    {t('overview.revLocked')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

{/* ================= KHU VỰC CHI TIẾT (RIGHT DRAWER) ================= */}
      {activePanel && (
        <div className="w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-300">

          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {activePanel === 'ALERTS' ? (
                <>
                  <BellRing className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>{t('overview.drawerAlertList')}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-sky-500" />
                  <span>{t('overview.drawerVehicleList')} ({getPanelData().length})</span>
                </>
              )}
            </h3>
            <button
              onClick={() => { setActivePanel(null); setSearchTerm(''); }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Search Box */}
          <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={activePanel === 'ALERTS' ? t('overview.drawerSearchAlert') : t('overview.drawerSearchVehicle')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium text-slate-700"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body List */}
          <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#F8FAFC]">
            {activePanel === 'ALERTS' ? (
              alerts.filter(a => a.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) || a.type.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                <div key={a.id} className="p-4 border border-rose-100 bg-white rounded-xl shadow-xs hover:border-rose-300 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {a.type}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mb-1">{t('overview.vehicleLabel')} <span className="font-bold font-mono">{a.vehicle}</span></p>
                  <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded border border-slate-100">{a.message}</p>
                  <button className="text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 py-1.5 rounded-lg transition-colors w-full cursor-pointer flex items-center justify-center gap-1">
                    <span>{t('overview.verifyNowBtn')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              getPanelData().map(v => (
                <div key={v.id} className="p-4 border border-slate-200/80 rounded-xl bg-white hover:border-sky-300 hover:shadow-xs transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-slate-800 text-base group-hover:text-sky-600 transition-colors">{v.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === 'RENTING' ? 'bg-emerald-100 text-emerald-700' :
                      v.status === 'AVAILABLE' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {v.status === 'RENTING' ? t('overview.kpiRenting') : v.status === 'AVAILABLE' ? t('overview.kpiAvailable') : t('overview.kpiMaintenance')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-xs text-slate-500">
                    <div>
                      <p className="font-medium text-slate-700">{v.type}</p>
                      <p className="mt-0.5">{t('overview.driverLabel')} <span className="text-slate-800 font-semibold">{v.driver}</span></p>
                    </div>
                    {v.status !== 'MAINTENANCE' && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {v.speed}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Empty State */}
            {((activePanel === 'ALERTS' && alerts.length === 0) || (activePanel !== 'ALERTS' && getPanelData().length === 0)) && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-slate-600">{t('overview.noMatchingData')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('overview.adjustFilterPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component Tái sử dụng: Thẻ Thống Kê KPI với Icon chuyển động tinh tế khi Hover
 */
const StatCard = ({ title, value, icon: Icon, color, onClick, active, desc, badge }: any) => {
  const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string; activeRing: string }> = {
    sky: { border: 'border-sky-500', bg: 'bg-sky-50/80', text: 'text-sky-700', iconBg: 'bg-sky-100 text-sky-600', activeRing: 'ring-sky-200' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50/80', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-600', activeRing: 'ring-emerald-200' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50/80', text: 'text-indigo-700', iconBg: 'bg-indigo-100 text-indigo-600', activeRing: 'ring-indigo-200' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-50/80', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', activeRing: 'ring-amber-200' },
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div
      onClick={onClick}
      className={`group p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between select-none relative overflow-hidden ${
        active
          ? `${scheme.border} ${scheme.bg} shadow-md ring-2 ${scheme.activeRing} scale-[1.02]`
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-120 group-hover:rotate-6 ${scheme.iconBg}`}>
          <Icon className="w-4 h-4 transition-transform duration-300" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
          {badge && (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
};
