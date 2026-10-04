import React from 'react';
import { 
  Search, FileUp, FileDown, RefreshCw, 
  LayoutGrid, List, MapPin, AlertTriangle, CheckCircle2,
  Activity, Bell, MoreVertical
} from 'lucide-react';

/**
 * Component: FleetVehicles (Quản lý đội xe)
 * Purpose: Hiển thị danh sách phương tiện, theo dõi trạng thái vận hành, 
 *          tín hiệu GPS và cảnh báo AI. (Phiên bản có dữ liệu giả lập)
 * 
 * TODO cho team dev:
 * - Thay thế mảng `tableData` và `statsData` bằng dữ liệu fetch từ API.
 * - Xử lý logic cho thanh Search và Filter.
 * - Xử lý logic phân trang (Pagination) ở cuối bảng.
 */
export default function FleetVehicles() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/50">
      
      {/* ==========================================
          1. HEADER & ACTIONS
          ========================================== */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Quản lý đội xe (Vehicle Management)
            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold tracking-wider uppercase border border-emerald-200 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Kết nối Telematics trực tiếp
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Theo dõi danh sách phương tiện, trạng thái vận hành, tín hiệu GPS và cảnh báo AI.</p>
        </div>
        <div className="flex gap-2">
          {/* TODO: Gắn hàm refetch data vào nút Làm mới */}
          <button className="bg-white border text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition shadow-sm active:scale-95">
            <RefreshCw size={16} /> Làm mới
          </button>
          <button className="bg-white border text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition shadow-sm active:scale-95">
            <FileUp size={16} /> Nhập liệu
          </button>
          <button className="bg-white border text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition shadow-sm active:scale-95">
            <FileDown size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ==========================================
          2. STATS SUMMARY CARDS (Thẻ thống kê)
          ========================================== */}
      <div className="grid grid-cols-7 gap-4">
        {statsData.map((stat, idx) => (
          <div key={idx} className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer ${stat.highlight ? 'border-red-200 bg-red-50/50' : ''}`}>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
              {stat.icon && <span>{stat.icon}</span>}
            </div>
            <div className="mt-3">
              <h3 className={`text-2xl font-bold ${stat.highlight ? 'text-red-600' : 'text-slate-800'}`}>{stat.value}</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ==========================================
          3. TABLE SECTION (Bảng dữ liệu chính)
          ========================================== */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Bộ lọc bảng */}
        <div className="p-4 border-b bg-slate-50/50 flex gap-4 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Lọc theo biển số, tài xế..." className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#0ea5e9] transition" />
            </div>
            <select className="border rounded-lg px-4 py-2 text-sm text-slate-600 outline-none font-medium">
              <option>Tất cả cụm xe (1,248)</option>
            </select>
            <div className="flex bg-slate-200/50 rounded-lg p-1 border">
                <button className="p-1.5 bg-white shadow-sm rounded text-[#0ea5e9]"><List size={16}/></button>
                <button className="p-1.5 text-slate-500 hover:text-slate-700"><LayoutGrid size={16}/></button>
            </div>
        </div>

        {/* Nội dung bảng */}
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
              <th className="px-4 py-3">Biển số & Mã VIN</th>
              <th className="px-4 py-3">Loại phương tiện</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Định vị GPS RTK</th>
              <th className="px-4 py-3">Camera AI DMS</th>
              <th className="px-4 py-3">Tài xế</th>
              <th className="px-4 py-3 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-4 text-center">
                  <input type="checkbox" className="rounded border-slate-300" defaultChecked={index === 1} />
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-800 text-sm bg-slate-100 w-max px-2 py-0.5 rounded border">{row.plate}</div>
                  <div className="text-[10px] text-slate-500 mt-1.5 uppercase font-mono">VIN: {row.vin}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-700">{row.type}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{row.payload}</div>
                </td>
                <td className="px-4 py-4">{renderStatus(row.status)}</td>
                <td className="px-4 py-4">
                  <div className={`font-bold text-xs ${row.gpsOnline ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1`}>
                     <MapPin size={14}/> {row.gpsOnline ? 'GPS RTK - Online' : 'Mất tín hiệu'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1.5 leading-tight">{row.location}</div>
                </td>
                <td className="px-4 py-4">{renderDMS(row.dms)}</td>
                <td className="px-4 py-4">
                  {row.driver !== 'Chưa gắn tài xế' ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {row.driver.split(' ').map(n => n[0]).join('').slice(-2)}
                        </div>
                        <div>
                        <div className="font-semibold text-slate-700 text-xs">{row.driver}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{row.phone}</div>
                        </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic bg-slate-100 w-max px-2 py-1 rounded">Chưa bàn giao</div>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <button className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ==========================================
            4. PAGINATION (Phân trang)
            ========================================== */}
        <div className="px-6 py-4 border-t flex justify-between items-center text-sm text-slate-500 bg-white">
          <div>Hiển thị <span className="font-semibold">1-10</span> trên tổng số <span className="font-semibold text-slate-800">1,248</span> xe</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded hover:bg-slate-50 text-slate-400 transition-colors">Trước</button>
            <button className="px-3 py-1 border rounded bg-sky-50 text-sky-600 font-bold border-sky-200 shadow-sm transition-colors">1</button>
            <button className="px-3 py-1 border rounded hover:bg-slate-50 font-medium transition-colors">2</button>
            <button className="px-3 py-1 border rounded hover:bg-slate-50 font-medium transition-colors">3</button>
            <span className="px-2 py-1">...</span>
            <button className="px-3 py-1 border rounded hover:bg-slate-50 font-medium transition-colors">125</button>
            <button className="px-3 py-1 border rounded hover:bg-slate-50 text-slate-700 transition-colors">Sau</button>
          </div>
        </div>
      </div>

      {/* ==========================================
          5. FOOTER AI STATUS (Tình trạng hệ thống)
          ========================================== */}
      <div className="grid grid-cols-3 gap-6 pb-6 mt-6">
        {/* GPS Status */}
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Activity size={18}/></div>
              Độ phủ vệ tinh GPS RTK
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Kết nối <span className="font-semibold text-slate-700">1,244</span> xe (Mất tín hiệu 4). Sai số định vị trung bình 2cm, độ trễ 0.5s cho toàn bộ hệ thống vệ tinh định vị toàn cầu.
            </p>
          </div>
          <div className="flex justify-between items-center text-sm border-t pt-3">
             <span className="text-slate-500 font-medium">Sai số hiện tại: 2cm</span>
             <span className="text-emerald-600 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 99.8% Online</span>
          </div>
        </div>
        
        {/* Camera AI DMS Status */}
        <div className="col-span-2 bg-white rounded-xl border p-5 border-red-200 shadow-sm shadow-red-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={18}/></div>
                 Camera AI DMS Cabin - Cố định diện mạo tài xế
               </h3>
               <p className="text-xs text-slate-500 mt-1">Trạng thái cấu hình cảnh báo bất thường từ Camera AI DMS trên các phương tiện.</p>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded font-bold tracking-wider flex items-center gap-1.5 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ĐANG HOẠT ĐỘNG
            </span>
          </div>
          
          <div className="flex gap-5">
             <div className="w-1/2 bg-slate-900 rounded-lg overflow-hidden flex flex-col relative h-32 border border-slate-800 shadow-inner">
                <div className="absolute top-2 left-2 text-[10px] text-emerald-400 font-mono tracking-wider font-bold">FACE: 3D_UNLOCK</div>
                <div className="absolute top-2 right-2 text-[10px] text-red-400 font-mono flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div> REC
                </div>
                <div className="flex-1 flex items-center justify-center text-center px-4">
                   <p className="text-emerald-400 font-mono text-xs opacity-70 border border-emerald-900 bg-emerald-950/30 px-3 py-1.5 rounded">
                     [ HỆ THỐNG PHÁT HIỆN DIỆN MẠO ĐANG TRỰC TIẾP ]
                   </p>
                </div>
                <div className="bg-slate-800 text-[10px] font-mono text-slate-300 p-1.5 px-3 flex justify-between border-t border-slate-700">
                   <span>FPS: 30</span><span>LATENCY: 12ms</span>
                </div>
             </div>
             <div className="w-1/2 space-y-3 text-sm py-1">
                <div className="flex items-start gap-2.5">
                   <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/>
                   <span className="text-slate-600 leading-tight">Quy chuẩn giám sát:<br/><span className="font-bold text-slate-800">CHÍNH DIỆN MẶT + KHÔNG ĐEO KÍNH RÂM</span></span>
                </div>
                <div className="flex items-start gap-2.5">
                   <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0"/>
                   <span className="text-slate-600 leading-tight">Ngưỡng kích hoạt:<br/><span className="font-bold text-slate-800 text-red-600">EAR &lt; 0.25 (Nhắm mắt hoàn toàn &gt; 3s)</span></span>
                </div>
                <div className="flex items-start gap-2.5">
                   <Bell size={16} className="text-blue-500 mt-0.5 shrink-0"/>
                   <span className="text-slate-600 leading-tight">Phản ứng vi phạm:<br/><span className="font-bold text-slate-800">Hú còi Cabin + Báo động Web Dashboard</span></span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   CÁC HÀM TIỆN ÍCH HIỂN THỊ (Helpers)
======================================================================== */
/** Render badge trạng thái xe */
function renderStatus(status: string) {
  switch(status) {
    case 'RUNNING': 
      return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 w-max tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ĐANG CHẠY</span>;
    case 'WARNING': 
      return <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 w-max tracking-wide animate-pulse"><AlertTriangle size={10}/> CẢNH BÁO AI</span>;
    case 'AVAILABLE': 
      return <span className="bg-sky-50 text-sky-600 border border-sky-200 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 w-max tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]"></div> SẴN SÀNG</span>;
    default: 
      return null;
  }
}

/** Render kết quả Camera DMS */
function renderDMS(dms: any) {
  if (!dms) return <div className="text-[11px] text-slate-400 italic">Không có dữ liệu</div>;
  
  if (dms.type === 'normal') {
    return (
      <div className="text-xs">
         <div className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> {dms.title}</div>
         <div className="text-slate-500 mt-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded w-max">{dms.desc}</div>
      </div>
    );
  }
  
  if (dms.type === 'warning') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs shadow-sm">
         <div className="font-bold text-red-700 flex items-center gap-1"><AlertTriangle size={12}/> {dms.title}</div>
         <div className="text-slate-700 font-medium mt-1 text-[10px]">{dms.desc}</div>
         <div className="flex gap-2 mt-2">
            <button className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded transition">Kích hoạt còi</button>
         </div>
      </div>
    );
  }
}

/* ========================================================================
   MOCK DATA (Dữ liệu giả lập - Xóa khi nối API)
======================================================================== */
const statsData = [
  { title: "Tổng số xe", value: "1,248", desc: "100% Telematics", icon: <div className="bg-sky-100 text-sky-600 p-1 rounded"><LayoutGrid size={14}/></div> },
  { title: "Sẵn sàng", value: "126", desc: "Bãi Cảng & Gara", icon: <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] block shadow-sm"></span> },
  { title: "Đang cho thuê", value: "358", desc: "28.7% hợp đồng active", icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 block shadow-sm"></span> },
  { title: "Đang chạy", value: "524", desc: "42.0% trên lộ trình", icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-sm"></span> },
  { title: "Đang dừng / Đỗ", value: "172", desc: "13.8% tạm nghỉ, kho", icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block shadow-sm"></span> },
  { title: "Cảnh báo AI", value: "3", desc: "Tài xế ngủ gật", highlight: true, icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shadow-sm animate-pulse"></span> },
  { title: "Bảo dưỡng", value: "30", desc: "Xưởng dịch vụ", icon: <span className="w-2.5 h-2.5 rounded-full bg-orange-400 block shadow-sm"></span> },
];

const tableData = [
  {
    plate: '29C-882.14', vin: 'FVH1G12D456H7JG3324',
    type: 'Volvo VNL 760', payload: 'Đầu kéo / Cont 40 feet',
    status: 'RUNNING',
    gpsOnline: true, location: 'Quốc lộ 1A - KM 1024, Ninh Thuận',
    dms: { type: 'normal', title: 'Tỉnh táo', desc: 'EAR: 0.31 | MAR: 0.12' },
    driver: 'Nguyễn Văn Long', phone: '0912.345.342'
  },
  {
    plate: '51D-934.22', vin: 'USG56NBV3A248B321',
    type: 'Freightliner Cascadia', payload: 'Đầu kéo / Rơ moóc',
    status: 'WARNING',
    gpsOnline: true, location: 'QL 1A, Tuy Phong, Bình Thuận',
    dms: { type: 'warning', title: 'Ngủ gật (Mắt nhắm)', desc: 'Nguy hiểm: EAR < 0.25 (3s)' },
    driver: 'Trần Quốc Dũng', phone: '0988.132.185'
  },
  {
    plate: '15C-743.50', vin: 'NMB57J4A9R94X329',
    type: 'Hyundai Mighty EX8', payload: 'Xe tải thùng 7.5 Tấn',
    status: 'AVAILABLE',
    gpsOnline: true, location: 'Bãi đỗ trung tâm CTy, Hải Phòng',
    dms: null,
    driver: 'Chưa gắn tài xế', phone: ''
  }
];