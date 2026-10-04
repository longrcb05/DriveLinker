import React from 'react';
import { ChevronRight, RefreshCw, Map as MapIcon } from 'lucide-react';

/**
 * Component: LiveTracking (Giám sát Hành trình RTK)
 * Purpose: Hiển thị bản đồ theo dõi xe theo thời gian thực (Real-time tracking),
 *          kết hợp luồng video stream từ camera AI và log sự kiện hệ thống.
 * Note: Hiện tại UI đang ở trạng thái Empty State (chưa có tín hiệu GPS/Video).
 * 
 * TODO cho team dev:
 * - Bản đồ: Tích hợp Mapbox GL JS, Google Maps API hoặc Leaflet (React-Leaflet).
 * - Video Stream: Tích hợp WebRTC hoặc HLS player để chạy luồng live camera.
 * - Real-time: Kết nối WebSocket/Socket.io để lắng nghe stream tọa độ xe liên tục.
 */
export default function LiveTracking() {
  // ==========================================
  // STATE MANAGEMENT (Dự kiến)
  // TODO: Khai báo các state để quản lý dữ liệu bản đồ và luồng video
  // const [vehiclesCoords, setVehiclesCoords] = useState([]);
  // const [selectedVehicle, setSelectedVehicle] = useState(null);
  // const [isConnected, setIsConnected] = useState(false);
  // ==========================================

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
      
      {/* ==========================================
          1. HEADER TỔNG KHU VỰC BẢN ĐỒ
          ========================================== */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-xs font-medium text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Fleet Operations</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-800 font-bold">Bản đồ RTK</span>
          </div>
        </div>
        
        {/* Tiêu đề & Nút trạng thái */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Giám sát Hành trình (Live)</h2>
          </div>
          {/* TODO: Đổi UI nút này thành màu xanh lá (Connected) khi WebSocket kết nối thành công */}
          <button className="bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed">
            <RefreshCw className="w-4 h-4" /> Đang chờ tín hiệu
          </button>
        </div>
      </div>

      {/* ==========================================
          2. THANH TRẠNG THÁI (KPI) CỦA ĐỘI XE MÀN HÌNH CHÍNH
          TODO: Cập nhật các biến số lượng dựa vào mảng dữ liệu realtime
          ========================================== */}
      <div className="px-6 grid grid-cols-5 gap-4 mb-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Tổng phương tiện</p>
          <h3 className="text-2xl font-bold text-slate-400">0</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Đang lăn bánh</p>
          <h3 className="text-2xl font-bold text-slate-400">0</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dừng / Đỗ</p>
          <h3 className="text-2xl font-bold text-slate-400">0</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cảnh báo</p>
          <h3 className="text-2xl font-bold text-slate-400">0</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Tín hiệu RTK</p>
          <h3 className="text-2xl font-bold text-slate-400">Mất kết nối</h3>
        </div>
      </div>

      {/* ==========================================
          3. KHU VỰC CHÍNH (BẢN ĐỒ & SIDEBAR BÊN PHẢI)
          ========================================== */}
      <div className="flex-1 flex gap-4 px-6 pb-6 overflow-hidden">
        
        {/* KHU VỰC BẢN ĐỒ (Map Container) */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
          {/* Lưới giả lập (Grid pattern) khi chưa load map */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          {/* TODO: Thay khối div này bằng thẻ <MapContainer /> (Leaflet) hoặc <ReactMapGL /> (Mapbox) */}
          <div className="text-center text-slate-400 z-10">
            <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-bold tracking-widest uppercase">No Signal Detected</p>
            <p className="text-xs mt-1">Chưa có phương tiện nào truyền tọa độ về hệ thống</p>
          </div>
        </div>

        {/* SIDEBAR BÊN PHẢI (Camera Stream & Logs) */}
        <div className="w-[380px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
          
          {/* Widget: Camera AI (Live Stream) */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                {/* TODO: Thay màu dot xanh khi camera online */}
                <div className="w-2 h-2 rounded-full bg-slate-600"></div> CAMERA AI (OFFLINE)
              </span>
            </div>
            {/* TODO: Lắp thẻ <video> hoặc thư viện player tại đây */}
            <div className="h-36 bg-black flex items-center justify-center text-slate-600 text-[10px] font-mono">
              [ NO VIDEO STREAM ]
            </div>
          </div>
          
          {/* Widget: Log Sự kiện Hệ thống */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[250px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-600 text-xs">Cập nhật hệ thống</h3>
            </div>
            {/* TODO: Map() danh sách mảng dữ liệu log (vd: "[12:30:45] Xe 29C-12345 mất tín hiệu") */}
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-xs text-slate-400 italic">Luồng theo dõi trống.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}