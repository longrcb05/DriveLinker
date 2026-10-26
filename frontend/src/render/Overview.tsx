import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Truck, AlertTriangle,
  MapPin, CheckCircle2, RefreshCw,
  Clock, Wallet, TrendingUp, ShieldAlert, BellRing
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix lỗi mất icon mặc định của Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component tự động cập nhật tâm bản đồ khi đổi công ty
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
    stats: { totalVehicles: 42, renting: 28, available: 12, aiAlerts: 7 },
    revenue: { amount: '128.5', growth: 'Tăng 12%', utilization: '66%', collection: '85%' },
    vehicles: [
      { id: '29C-123.45', lat: 16.047079, lng: 108.206230, status: 'RUNNING', driver: 'Nguyễn Văn A', speed: '65 km/h' },
      { id: '51D-987.65', lat: 16.055000, lng: 108.215000, status: 'WARNING', driver: 'Trần Thị B', speed: '72 km/h' },
      { id: '15C-456.78', lat: 16.035000, lng: 108.225000, status: 'STOPPED', driver: 'Lê Văn C', speed: '0 km/h' },
    ],
    alerts: [
      { id: 1, time: 'Vừa xong', vehicle: '51D-987.65', type: 'Ngủ gật', message: 'Mắt nhắm > 3s. Đã hú còi cabin.', severity: 'high' },
      { id: 2, time: '5 phút trước', vehicle: '43A-112.22', type: 'Quá tốc độ', message: 'Vượt tốc độ 85/60 km/h tại QL1A.', severity: 'medium' },
      { id: 3, time: '12 phút trước', vehicle: '92C-555.33', type: 'Lệch làn', message: 'Lệch làn đường liên tục.', severity: 'low' },
    ]
  },
  'COMPANY_B': {
    center: [10.762622, 106.660172], // TP. Hồ Chí Minh
    stats: { totalVehicles: 120, renting: 95, available: 20, aiAlerts: 18 },
    revenue: { amount: '450.2', growth: 'Tăng 25%', utilization: '85%', collection: '92%' },
    vehicles: [
      { id: '51F-888.11', lat: 10.762622, lng: 106.660172, status: 'RUNNING', driver: 'Phạm Văn D', speed: '50 km/h' },
      { id: '51G-999.22', lat: 10.775000, lng: 106.700000, status: 'WARNING', driver: 'Hoàng Thị E', speed: '85 km/h' },
      { id: '51C-777.33', lat: 10.750000, lng: 106.640000, status: 'STOPPED', driver: 'Lý Quốc F', speed: '0 km/h' },
    ],
    alerts: [
      { id: 4, time: '2 phút trước', vehicle: '51G-999.22', type: 'Vượt đèn đỏ', message: 'Vượt đèn đỏ tại ngã tư.', severity: 'high' },
      { id: 5, time: '30 phút trước', vehicle: '51H-555.55', type: 'Phanh gấp', message: 'Cảm biến gia tốc phát hiện phanh gấp.', severity: 'low' }
    ]
  },
  'COMPANY_C': {
    center: [21.028511, 105.804817], // Hà Nội
    stats: { totalVehicles: 5, renting: 3, available: 2, aiAlerts: 0 },
    revenue: { amount: '15.8', growth: 'Giảm 2%', utilization: '60%', collection: '98%' },
    vehicles: [
      { id: '29A-111.11', lat: 21.028511, lng: 105.804817, status: 'RUNNING', driver: 'Vũ Thị H', speed: '35 km/h' }
    ],
    alerts: [] // Công ty C quy mô nhỏ, hiện không có cảnh báo
  }
};

const DEFAULT_DATA = MOCK_DATA_BY_TENANT['COMPANY_A'];

export default function Overview() {
  const [userRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');

  // 1. CHẶN HIỂN THỊ DỮ LIỆU ĐỐI VỚI HỆ THỐNG LÕI (SYS_ADMIN)
  if (userRole === 'SYS_ADMIN') {
    return (
      <div className="flex-1 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm max-w-lg w-full">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Không khả dụng cho Quản trị viên</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Trang Tổng quan chỉ chứa dữ liệu nghiệp vụ của khách hàng. Hãy dùng menu <b>Quản lý Doanh nghiệp</b> hoặc trang <b>Settings</b> để kiểm tra và cấu hình hệ thống.
          </p>
        </div>
      </div>
    );
  }

  // 2. LOGIC HIỂN THỊ CHO KHÁCH HÀNG (TENANT_ADMIN & TENANT_STAFF)
  const [tenantId] = useState(localStorage.getItem('tenantId') || 'COMPANY_A');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_DATA.center);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState({ totalVehicles: 0, renting: 0, available: 0, aiAlerts: 0 });
  const [revenueData, setRevenueData] = useState({ amount: '0', growth: '', utilization: '0%', collection: '0%' });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const currentData = MOCK_DATA_BY_TENANT[tenantId] || DEFAULT_DATA;

      setMapCenter(currentData.center);
      setVehicles(currentData.vehicles);
      setAlerts(currentData.alerts);
      setKpiStats(currentData.stats);
      setRevenueData(currentData.revenue);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId]); // Tự động refetch dữ liệu khi đổi tenantId

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6">

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

      {/* HÀNG 1: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đội Xe</p>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Truck className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{isLoading ? '...' : kpiStats.totalVehicles}</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-2">Tổng phương tiện</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang cho thuê</p>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{isLoading ? '...' : kpiStats.renting}</h3>
          <p className="text-[11px] font-medium text-emerald-600 mt-2 flex items-center gap-1">Sinh lời ngay lúc này</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trống lịch / Bảo dưỡng</p>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{isLoading ? '...' : kpiStats.available}</h3>
          <p className="text-[11px] font-medium text-amber-600 mt-2">Sẵn sàng nhận khách</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full"></div>
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
          <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center absolute top-0 left-0 right-0 z-[400] bg-white/80 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" /> Giám sát hành trình
            </h3>
          </div>
          <div className="flex-1 w-full h-full mt-11">
            {!isLoading && (
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <MapUpdater center={mapCenter} />
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {vehicles.map((vehicle, index) => (
                  <Marker key={index} position={[vehicle.lat, vehicle.lng]} icon={defaultIcon}>
                    <Popup>
                      <div className="font-sans">
                        <p className="font-bold text-slate-800">{vehicle.id}</p>
                        <p className="text-xs text-slate-600 mt-1">Tài xế: {vehicle.driver}</p>
                        <p className="text-xs text-slate-600">Vận tốc: {vehicle.speed}</p>
                        <p className={`text-xs font-bold mt-2 ${vehicle.status === 'WARNING' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {vehicle.status === 'WARNING' ? 'CẢNH BÁO AI' : 'BÌNH THƯỜNG'}
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
          {userRole === 'TENANT_ADMIN' ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Doanh thu trong tháng
                </h3>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-center">
                <div className="mb-6 text-center">
                  <h3 className="text-4xl font-bold text-slate-800">{isLoading ? '...' : revenueData.amount}<span className="text-xl text-slate-500 ml-1">Tr</span></h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mt-2 ${revenueData.growth.includes('Tăng') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <TrendingUp className="w-3 h-3" /> {revenueData.growth} so với tháng trước
                  </span>
                </div>
                <div className="space-y-4 w-full">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Tỷ lệ cho thuê xe</span>
                      <span className="text-sky-600">{revenueData.utilization}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#0EA5E9] h-2 rounded-full transition-all duration-1000" style={{ width: isLoading ? '0%' : revenueData.utilization }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Tỷ lệ thu hồi công nợ</span>
                      <span className="text-emerald-600">{revenueData.collection}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: isLoading ? '0%' : revenueData.collection }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">Khu vực Giới hạn</h3>
              <p className="text-xs text-slate-500">Chỉ quản lý doanh nghiệp mới có quyền xem thông tin doanh thu.</p>
            </div>
          )}
        </div>
      </div>

      {/* HÀNG 3: LIVE FEED CẢNH BÁO AI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-500" /> Cảnh báo Khẩn cấp từ Camera AI
          </h2>
          <button className="text-xs font-bold text-[#0EA5E9] hover:text-sky-700 transition-colors">Xem toàn bộ lịch sử</button>
        </div>
        <div className="p-4">
          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50/50">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.severity === 'high' ? 'bg-rose-500 animate-ping' :
                    alert.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-400'
                    }`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-800">{alert.vehicle}</p>
                      <span className="text-[10px] font-bold text-slate-400">{alert.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-rose-600 mb-1">{alert.type}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              Không có cảnh báo an toàn nào trong 24h qua.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}