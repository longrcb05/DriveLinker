/**
 * @file Overview.tsx
 * @description Trang Tổng quan hệ thống.
 * Cung cấp cái nhìn toàn cảnh về đội xe thông qua các thẻ thống kê KPI.
 * Áp dụng cơ chế tương tác trực tiếp (Interactive Panel): Khi click vào thẻ,
 * hệ thống mở Khung chi tiết (Right Drawer) để hiển thị danh sách phương tiện hoặc
 * cảnh báo AI mà không cần chuyển hướng sang trang khác.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { vehicleService } from '../services/vehicleService';
import {
  ChevronRight, Truck, AlertTriangle,
  MapPin, CheckCircle2, RefreshCw,
  Clock, Wallet, TrendingUp, ShieldAlert, BellRing, Wrench, X, Search, Lock,
  ArrowUpRight, Sparkles, Navigation, Radio
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Sửa lỗi mất icon mặc định của thư viện Leaflet trong môi trường React
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Component tự động cập nhật tâm bản đồ.
 */
function MapUpdater({ center, count }: { center: [number, number]; count: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
    const triggerResize = () => {
      map.invalidateSize();
    };
    triggerResize();
    const t1 = setTimeout(triggerResize, 100);
    const t2 = setTimeout(triggerResize, 300);
    const t3 = setTimeout(triggerResize, 600);
    const t4 = setTimeout(triggerResize, 1200);
    window.addEventListener('resize', triggerResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', triggerResize);
    };
  }, [center, count, map]);
  return null;
}

// === BỘ DỮ LIỆU DEMO ĐA DOANH NGHIỆP ===
const MOCK_DATA_BY_TENANT: Record<string, any> = {
  'COMPANY_A': {
    center: [16.0544, 108.2022], // Đà Nẵng
    revenue: { amount: '128.5', growth: 'Tăng 12%', utilization: '71%', collection: '85%' },
    vehicles: [],
    alerts: [
      { id: 1, time: '23:45', vehicle: '43A-999.88', type: 'Ngủ gật (YOLO AI)', message: 'Phát hiện mắt nhắm > 1.5s (Độ tin cậy 92%). Đã hú còi cabin.', severity: 'high' },
      { id: 2, time: '21:10', vehicle: '43C-678.90', type: 'Quá tốc độ', message: 'Vượt tốc độ 75/60 km/h tại cung đường đèo Hải Vân.', severity: 'medium' },
      { id: 3, time: '16:15', vehicle: '92A-345.67', type: 'Gục đầu (YOLO AI)', message: 'Tư thế gục đầu mất tập trung lái xe > 3.2s.', severity: 'high' },
      { id: 4, time: '14:20', vehicle: '43B-888.99', type: 'Ngáp sâu liên tục', message: 'Tần suất ngáp 5 lần trong 10 phút, nguy cơ mệt mỏi cao.', severity: 'medium' },
    ]
  },
  'COMPANY_B': {
    center: [10.762622, 106.660172], // TP. Hồ Chí Minh
    revenue: { amount: '450.2', growth: 'Tăng 25%', utilization: '85%', collection: '92%' },
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
    revenue: { amount: '15.8', growth: 'Giảm 2%', utilization: '60%', collection: '98%' },
    vehicles: [
      { id: '29A-111.11', lat: 21.028511, lng: 105.804817, status: 'RENTING', type: 'Xe Bán Tải', driver: 'Vũ Thị H', speed: '35 km/h' }
    ],
    alerts: []
  }
};

const DEFAULT_DATA = MOCK_DATA_BY_TENANT['COMPANY_A'];

export default function Overview() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantId] = useState(localStorage.getItem('tenantId') || 'COMPANY_A');

  // Kiểm tra quyền để hiển thị dữ liệu Doanh thu
  const isManager = userRole === 'TENANT_ADMIN' || userRole === 'SYS_ADMIN' || userRole === 'SUPER_ADMIN_VIEW';

  const [activePanel, setActivePanel] = useState<'ALL' | 'RENTING' | 'AVAILABLE' | 'MAINTENANCE' | 'ALERTS' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_DATA.center);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState({ amount: '0', growth: '', utilization: '0%', collection: '0%' });

  const kpiStats = {
    totalVehicles: vehicles.length,
    renting: vehicles.filter(v => v.status === 'RENTING' || v.status === 'RENTED').length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    reserved: vehicles.filter(v => v.status === 'RESERVED').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'PENDING_INSPECTION').length,
    aiAlerts: 14 // Đồng bộ với 14 ảnh vi phạm AI thực tế của hệ thống
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const vList = await vehicleService.getVehicles(tenantId);
      const currentData = MOCK_DATA_BY_TENANT[tenantId] || DEFAULT_DATA;

      setMapCenter(currentData.center);
      setVehicles(vList);
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
    let debounceTimer: any = null;
    const handleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchDashboardData();
      }, 500);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('dl_vehicles_updated', handleUpdate);
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('dl_vehicles_updated', handleUpdate);
    };
  }, [tenantId]);

  const getPanelData = () => {
    let data = vehicles;
    if (activePanel === 'RENTING') data = vehicles.filter(v => v.status === 'RENTED' || v.status === 'RENTING');
    if (activePanel === 'AVAILABLE') data = vehicles.filter(v => v.status === 'AVAILABLE');
    if (activePanel === 'MAINTENANCE') data = vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'PENDING_INSPECTION');

    if (searchTerm) {
      data = data.filter(v =>
        (v.plate || v.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.driver && v.driver.toLowerCase().includes(searchTerm.toLowerCase()))
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
      {/* ================= KHU VỰC CHÍNH ================= */}
      <div className="flex-1 overflow-auto p-6 space-y-6 relative">

        {/* HEADER BREADCRUMB & LIVE CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              <span className="hover:text-slate-800 cursor-pointer transition-colors">{t('overview.breadcrumbHome')}</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-sky-600 font-extrabold flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('overview.breadcrumbOverview')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">{t('overview.title')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('overview.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('overview.wsConnected')}</span>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer group"
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
            onClick={() => setActivePanel(activePanel === 'ALL' ? null : 'ALL')}
            active={activePanel === 'ALL'}
            desc={t('overview.kpiTotalSub')}
            badge="100%"
          />
          <StatCard
            title={t('overview.kpiRenting')}
            value={isLoading ? '...' : kpiStats.renting}
            icon={CheckCircle2}
            color="emerald"
            onClick={() => setActivePanel(activePanel === 'RENTING' ? null : 'RENTING')}
            active={activePanel === 'RENTING'}
            desc={t('overview.kpiRentingSub')}
            badge={t('overview.badgeActive')}
          />
          <StatCard
            title={t('overview.kpiAvailable')}
            value={isLoading ? '...' : kpiStats.available}
            icon={Clock}
            color="indigo"
            onClick={() => setActivePanel(activePanel === 'AVAILABLE' ? null : 'AVAILABLE')}
            active={activePanel === 'AVAILABLE'}
            desc={t('overview.kpiAvailableSub')}
            badge={t('overview.badgeAvailable')}
          />
          <StatCard
            title={t('overview.kpiMaintenance')}
            value={isLoading ? '...' : kpiStats.maintenance}
            icon={Wrench}
            color="amber"
            onClick={() => setActivePanel(activePanel === 'MAINTENANCE' ? null : 'MAINTENANCE')}
            active={activePanel === 'MAINTENANCE'}
            desc={t('overview.kpiMaintenanceSub')}
            badge={t('overview.badgePaused')}
          />

          {/* Thẻ Cảnh Báo AI Nguy Hiểm */}
          <div
            onClick={() => setActivePanel(activePanel === 'ALERTS' ? null : 'ALERTS')}
            className={`group p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              activePanel === 'ALERTS'
                ? 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-300 shadow-lg scale-[1.02]'
                : 'border-rose-100 bg-white hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t('overview.kpiAlerts')}</span>
              <div className="p-2 bg-rose-100/80 text-rose-600 rounded-xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 shadow-sm">
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

        {/* HÀNG 2: BẢN ĐỒ LIVE TRACKING & {t('overview.revPerformance')} */}
        <div className="flex flex-col lg:flex-row gap-6 h-[480px]">

          {/* Bản đồ Live Tracking */}
          <div className="flex-[2] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col relative z-0 group">
            {/* Header Của Bản Đồ */}
            <div className="p-3.5 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('overview.mapTitle')}</h3>
                  <p className="text-[10px] text-slate-500">{t('overview.mapSubtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {t('overview.mapRenting')} ({kpiStats.renting})
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> {t('overview.mapAvailable')} ({kpiStats.available})
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> {t('fleet.kpiReserved')} ({kpiStats.reserved})
                </span>
              </div>
            </div>

            {/* Khung Leaflet */}
            <div className="flex-1 w-full relative min-h-0">
              {!isLoading && (
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <MapUpdater center={mapCenter} count={vehicles.length} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />
                  {vehicles.filter(v => v.status === 'RENTED' || v.status === 'RENTING' || v.status === 'AVAILABLE' || v.status === 'RESERVED').map((vehicle) => (
                    <Marker key={vehicle.id || vehicle.plate} position={[vehicle.lat || 16.0544, vehicle.lng || 108.2022]} icon={defaultIcon}>
                      <Popup>
                        <div className="font-sans p-1 min-w-[160px]">
                          <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                            <span className="font-black text-slate-900 text-sm font-mono">{vehicle.plate || vehicle.id}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              vehicle.status === 'RENTED' || vehicle.status === 'RENTING'
                                ? 'bg-emerald-100 text-emerald-700'
                                : vehicle.status === 'RESERVED'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}>
                              {vehicle.status === 'RENTED' || vehicle.status === 'RENTING'
                                ? t('overview.mapRenting')
                                : vehicle.status === 'RESERVED'
                                ? t('fleet.kpiReserved')
                                : t('overview.mapAvailable')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">👤 {t('overview.driverLabel')} <strong>{vehicle.driver || 'Chưa xếp tài'}</strong></p>
                          <p className="text-xs text-slate-600">⚡ {t('overview.speedLabel')} <strong>{vehicle.speed || '0 km/h'}</strong></p>
                          <p className="text-xs text-slate-500 mt-1">{t('overview.typeLabel')} {vehicle.payload || (vehicle.brand + ' ' + vehicle.model)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Module Phân quyền: Hiệu suất Kinh doanh */}
          <div className="flex-[1] bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" /> {t('overview.revPerformance')}
              </h3>
              {!isManager ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <Lock className="w-3 h-3" /> {t('overview.restricted')}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 font-mono">{t('overview.revCurrentMonth')}</span>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="text-center py-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('overview.revTotalEstimated')}
                </span>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {isManager ? (isLoading ? '...' : revenueData.amount) : '***'}
                  <span className="text-lg font-bold text-slate-400 ml-1.5">{t('overview.revMillion')}</span>
                </h3>

                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full mt-3 ${
                  revenueData.growth.includes('Tăng') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {isManager ? revenueData.growth : '***'} {t('overview.vsPrevious')}
                </span>
              </div>

              {/* Progress Bar Tỷ Lệ */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">{t('overview.revUtilization')}</span>
                    <span className="text-sky-600 font-mono">{isManager ? revenueData.utilization : '***'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-400 to-sky-600 h-2.5 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: isLoading ? '0%' : (isManager ? revenueData.utilization : '0%') }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">{t('overview.revCollection')}</span>
                    <span className="text-emerald-600 font-mono">{isManager ? revenueData.collection : '***'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: isLoading ? '0%' : (isManager ? revenueData.collection : '0%') }}
                    />
                  </div>
                </div>
              </div>

              {!isManager && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                  <p className="text-[11px] text-slate-500 font-medium">{t('overview.revLocked')}</p>
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
                <div key={a.id} className="p-4 border border-rose-100 bg-white rounded-xl shadow-sm hover:border-rose-300 hover:shadow-md transition-all">
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
                  <button
                    onClick={() => navigate('/tracking', { state: { plateNumber: a.vehicle } })}
                    className="text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 py-1.5 rounded-lg transition-colors w-full cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>{t('overview.verifyNowBtn')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              getPanelData().map(v => (
                <div key={v.id} className="p-4 border border-slate-200/80 rounded-xl bg-white hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-slate-800 text-base group-hover:text-sky-600 transition-colors">{v.plate || v.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === 'RENTING' ? 'bg-emerald-100 text-emerald-700' :
                      v.status === 'AVAILABLE' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {v.status === 'RENTING' ? t('overview.kpiRenting') : v.status === 'AVAILABLE' ? t('overview.kpiAvailable') : t('overview.kpiMaintenance')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-xs text-slate-500">
                    <div>
                      <p className="font-medium text-slate-700">{v.payload || (v.brand + ' ' + v.model)}</p>
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
          ? `${scheme.border} ${scheme.bg} shadow-lg ring-2 ${scheme.activeRing} scale-[1.02]`
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
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
