/**
 * @file Overview.tsx
 * @description Trang Tổng quan hệ thống.
 * Cung cấp cái nhìn toàn cảnh về đội xe thông qua các thẻ thống kê KPI.
 * Áp dụng cơ chế tương tác trực tiếp (Interactive Panel): Khi click vào thẻ,
 * hệ thống mở Khung chi tiết (Right Drawer) để hiển thị danh sách phương tiện hoặc
 * cảnh báo AI mà không cần chuyển hướng sang trang khác.
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Truck, AlertTriangle,
  MapPin, CheckCircle2, RefreshCw,
  Clock, Wallet, TrendingUp, ShieldAlert, BellRing, Wrench, X, Search, Lock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

// === BỘ DỮ LIỆU DEMO ĐA DOANH NGHIỆP ===
const MOCK_DATA_BY_TENANT: Record<string, any> = {
  'COMPANY_A': {
    center: [16.047079, 108.206230], // Đà Nẵng
    revenue: { amount: '128.5', growth: 'Tăng 12%', utilization: '66%', collection: '85%' },
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
  const [userRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantId] = useState(localStorage.getItem('tenantId') || 'COMPANY_A');

  // ĐÃ BỔ SUNG: Kiểm tra quyền để che Doanh thu
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
    renting: vehicles.filter(v => v.status === 'RENTING').length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    aiAlerts: alerts.length
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
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

  // --- LUỒNG HIỂN THỊ DÀNH CHO SYS_ADMIN (Chặn truy cập dữ liệu Doanh nghiệp) ---
  if (userRole === 'SYS_ADMIN') {
    return (
      <div className="flex-1 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Không khả dụng cho Quản trị viên</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Trang Tổng quan chỉ chứa dữ liệu nghiệp vụ của khách hàng. Hãy dùng menu <b>Quản lý Doanh nghiệp</b> để chuyển quyền hoặc cấu hình hệ thống.
          </p>
        </div>
      </div>
    );
  }

  // --- LUỒNG HIỂN THỊ CHÍNH ---
  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* KHU VỰC CHÍNH */}
      <div className="flex-1 overflow-auto p-6 space-y-6 relative">

        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span className="hover:text-slate-800 cursor-pointer transition-colors">MENU</span>
              <ChevronRight className="w-3 h-3 mx-2" />
              <span className="text-sky-600">Tổng quan</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Hệ thống Giám sát và Quản lý xe</h2>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}
          </button>
        </div>

        {/* HÀNG 1: THẺ THỐNG KÊ TƯƠNG TÁC (Tích hợp Drawer) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Tổng Đội Xe" value={isLoading ? '...' : kpiStats.totalVehicles} icon={Truck} color="sky" onClick={() => setActivePanel('ALL')} active={activePanel === 'ALL'} desc="Toàn bộ phương tiện" />
          <StatCard title="Đang cho thuê" value={isLoading ? '...' : kpiStats.renting} icon={CheckCircle2} color="emerald" onClick={() => setActivePanel('RENTING')} active={activePanel === 'RENTING'} desc="Sinh lời ngay lúc này" />
          <StatCard title="Trống lịch" value={isLoading ? '...' : kpiStats.available} icon={Clock} color="indigo" onClick={() => setActivePanel('AVAILABLE')} active={activePanel === 'AVAILABLE'} desc="Sẵn sàng nhận khách" />
          <StatCard title="Bảo dưỡng" value={isLoading ? '...' : kpiStats.maintenance} icon={Wrench} color="amber" onClick={() => setActivePanel('MAINTENANCE')} active={activePanel === 'MAINTENANCE'} desc="Đang sửa chữa" />

          <div onClick={() => setActivePanel('ALERTS')} className={`p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${activePanel === 'ALERTS' ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-200' : 'border-rose-100 bg-white hover:border-rose-300'}`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Cảnh báo AI (24h)</p>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg animate-pulse"><AlertTriangle className="w-4 h-4" /></div>
            </div>
            <h3 className="text-3xl font-bold text-rose-600">{isLoading ? '...' : kpiStats.aiAlerts}</h3>
            <p className="text-[11px] font-medium text-rose-500 mt-2">Sự cố cần kiểm tra</p>
          </div>
        </div>

        {/* HÀNG 2: BẢN ĐỒ & DOANH THU */}
        <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
          {/* Bản đồ Live Tracking */}
          <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative z-0">
            <div className="p-3 bg-white/90 backdrop-blur-sm border-b border-slate-100 flex justify-between items-center absolute top-0 left-0 right-0 z-[400]">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" /> Giám sát hành trình
              </h3>
            </div>
            <div className="flex-1 w-full h-full mt-11">
              {!isLoading && (
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <MapUpdater center={mapCenter} />
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {vehicles.filter(v => v.status !== 'MAINTENANCE').map((vehicle, index) => (
                    <Marker key={index} position={[vehicle.lat, vehicle.lng]} icon={defaultIcon}>
                      <Popup>
                        <div className="font-sans">
                          <p className="font-bold text-slate-800">{vehicle.id}</p>
                          <p className="text-xs text-slate-600 mt-1">Tài xế: {vehicle.driver}</p>
                          <p className="text-xs text-slate-600">Vận tốc: {vehicle.speed}</p>
                          <p className={`text-[10px] uppercase font-bold mt-2 ${vehicle.status === 'RENTING' ? 'text-emerald-500' : 'text-sky-500'}`}>
                            {vehicle.status}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Module Phân quyền: Hiệu suất Kinh doanh */}
          <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" /> Doanh thu trong tháng
              </h3>
              {/* Hiển thị Icon Ổ Khóa nếu là nhân viên */}
              {!isManager && <Lock className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="p-5 flex-1 flex flex-col justify-center">
              <div className="mb-6 text-center">
                <h3 className="text-4xl font-bold text-slate-800">
                  {/* CHE DỮ LIỆU BẰNG *** NẾU LÀ NHÂN VIÊN */}
                  {isManager ? (isLoading ? '...' : revenueData.amount) : '***'}
                  <span className="text-xl text-slate-500 ml-1">Tr</span>
                </h3>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mt-2 ${revenueData.growth.includes('Tăng') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <TrendingUp className="w-3 h-3" /> {isManager ? revenueData.growth : '***'} so với tháng trước
                </span>
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Tỷ lệ cho thuê xe</span>
                    <span className="text-sky-600">{isManager ? revenueData.utilization : '***'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-[#0EA5E9] h-2 rounded-full transition-all duration-1000" style={{ width: isLoading ? '0%' : (isManager ? revenueData.utilization : '0%') }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Tỷ lệ thu hồi công nợ</span>
                    <span className="text-emerald-600">{isManager ? revenueData.collection : '***'}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: isLoading ? '0%' : (isManager ? revenueData.collection : '0%') }}></div>
                  </div>
                </div>
              </div>

              {/* Lời nhắc nội bộ */}
              {!isManager && (
                <p className="text-[10px] text-rose-500 text-center font-bold mt-4">Thông tin được bảo mật nội bộ</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC CHI TIẾT (RIGHT DRAWER) */}
      {activePanel && (
        <div className="w-[400px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-300">

          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              {activePanel === 'ALERTS' ? <><BellRing className="w-4 h-4 text-rose-500" /> Cảnh báo AI (24h)</> : 'Danh sách Phương tiện'}
            </h3>
            <button onClick={() => { setActivePanel(null); setSearchTerm(''); }} className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={activePanel === 'ALERTS' ? "Tìm theo biển số, lỗi vi phạm..." : "Tìm biển số, tài xế..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {activePanel === 'ALERTS' ? (
              alerts.filter(a => a.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) || a.type.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                <div key={a.id} className="p-4 border border-rose-100 bg-rose-50/50 rounded-xl hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-rose-700">{a.type}</span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.time}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">Phương tiện: <span className="font-bold">{a.vehicle}</span></p>
                  <p className="text-xs text-slate-500 mb-3">{a.message}</p>
                  <button className="text-xs font-bold bg-white border border-rose-200 text-rose-600 px-4 py-1.5 rounded-lg shadow-sm hover:bg-rose-500 hover:text-white transition-colors w-full">Kiểm tra ngay</button>
                </div>
              ))
            ) : (
              getPanelData().map(v => (
                <div key={v.id} className="p-4 border border-slate-100 rounded-xl hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer group bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-base group-hover:text-sky-600 transition-colors">{v.id}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${v.status === 'RENTING' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'AVAILABLE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {v.status === 'RENTING' ? 'ĐANG THUÊ' : v.status === 'AVAILABLE' ? 'TRỐNG LỊCH' : 'BẢO DƯỠNG'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{v.type}</p>
                      <p className="text-xs text-slate-500 mt-1">Phụ trách: <span className="font-medium text-slate-700">{v.driver}</span></p>
                    </div>
                    {v.status !== 'MAINTENANCE' && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{v.speed}</span>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Hiển thị khi danh sách rỗng (Empty State) */}
            {((activePanel === 'ALERTS' && alerts.length === 0) || (activePanel !== 'ALERTS' && getPanelData().length === 0)) && (
              <div className="text-center p-8">
                <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Không có dữ liệu phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component Tái sử dụng (Reusable Component): Thẻ Thống kê.
 */
const StatCard = ({ title, value, icon: Icon, color, onClick, active, desc }: any) => (
  <div onClick={onClick} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${active ? `border-${color}-500 bg-${color}-50 shadow-md ring-1 ring-${color}-200 scale-[1.02]` : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <div className={`p-1.5 rounded-lg ${active ? `bg-${color}-100 text-${color}-600` : `bg-slate-50 text-${color}-500`}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <h3 className={`text-3xl font-bold ${active ? `text-${color}-700` : 'text-slate-800'}`}>{value}</h3>
      <p className={`text-[10px] font-medium mt-1 ${active ? `text-${color}-600` : 'text-slate-400'}`}>{desc}</p>
    </div>
  </div>
);