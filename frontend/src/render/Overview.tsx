import React, { useState } from 'react';
import { 
  ChevronRight, Activity, Truck, AlertTriangle, 
  MapPin, CheckCircle2, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Fix lỗi mất icon mặc định của Leaflet trong môi trường Vite/React
 */
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Dữ liệu giả lập vị trí các xe đang chạy
const mockVehicles = [
  { id: '29C-123.45', lat: 16.047079, lng: 108.206230, status: 'RUNNING', driver: 'Nguyễn Văn A', speed: '65 km/h' },
  { id: '51D-987.65', lat: 16.055000, lng: 108.215000, status: 'WARNING', driver: 'Trần Thị B', speed: '72 km/h' },
  { id: '15C-456.78', lat: 16.035000, lng: 108.225000, status: 'STOPPED', driver: 'Lê Văn C', speed: '0 km/h' },
];

export default function Overview() {
  // Tâm bản đồ đặt tại Đà Nẵng
  const [mapCenter] = useState<[number, number]>([16.047079, 108.206230]);

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Operations Deck</span>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-sky-600">Tổng quan (Overview)</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">Trung tâm Điều hành Toàn diện</h2>
        </div>
        <button className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Phương Tiện</p>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Truck className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">1,248</h3>
          <p className="text-[11px] font-medium text-emerald-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 1,200 Đang hoạt động
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tín hiệu GPS RTK</p>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">99.8%</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-2">4 xe đang mất kết nối</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cảnh báo AI DMS</p>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-red-600">3</h3>
          <p className="text-[11px] font-medium text-red-500 mt-2 animate-pulse">Cần xử lý ngay lập tức</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tải máy chủ (Server)</p>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Activity className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">24<span className="text-sm font-medium text-slate-400">ms</span></h3>
          <p className="text-[11px] font-medium text-slate-500 mt-2">Độ trễ API ổn định</p>
        </div>
      </div>

      {/* MAIN CONTENT: MAP & SIDEBAR */}
      <div className="flex gap-6 h-[500px]">
        
        {/* Bản đồ Live Tracking */}
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative z-0">
          <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center absolute top-0 left-0 right-0 z-[400] bg-white/80 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" /> Trạng thái Giao thông & Định vị (Real-time)
            </h3>
          </div>
          
          {/* Vùng chứa MapContainer */}
          <div className="flex-1 w-full h-full mt-11">
            <MapContainer 
              center={mapCenter} 
              zoom={13} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Đổ dữ liệu các xe lên bản đồ */}
              {mockVehicles.map((vehicle, index) => (
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
          </div>
        </div>

        {/* Danh sách sự kiện nhanh */}
        <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Sự kiện mới nhất</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            
            <div className="flex gap-3 items-start border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Xe 51D-987.65: Cảnh báo ngủ gật</p>
                <p className="text-[10px] text-slate-500 mt-1">Camera AI phát hiện mắt nhắm &gt; 2s. Hệ thống đã hú còi cabin.</p>
                <p className="text-[9px] text-slate-400 mt-1.5">Vừa xong</p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-b border-slate-50 pb-4">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Xe 15C-456.78: Bắt đầu hành trình</p>
                <p className="text-[10px] text-slate-500 mt-1">Khởi hành từ Cảng Hải Phòng đi Hà Nội.</p>
                <p className="text-[9px] text-slate-400 mt-1.5">15 phút trước</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Đồng bộ API hoàn tất</p>
                <p className="text-[10px] text-slate-500 mt-1">Hệ thống đã nhận đủ 1,248 tín hiệu định vị RTK.</p>
                <p className="text-[9px] text-slate-400 mt-1.5">1 giờ trước</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}