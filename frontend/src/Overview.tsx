import { Calendar, RefreshCw, Car, Key, Clock, ShieldAlert } from 'lucide-react';

export default function Overview() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bảng điều khiển vận hành đội xe</h1>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              Trực tuyến 0/0 phương tiện
            </span>
            <span className="text-sm text-slate-400">Hệ thống chưa ghi nhận dữ liệu</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" /> Lọc thời gian
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng số xe</p>
              <h2 className="text-3xl font-bold text-slate-300">0</h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Car className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">-- %</span>
            <span className="text-slate-400">Chưa có kết nối ECU</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Xe đang cho thuê</p>
              <h2 className="text-3xl font-bold text-slate-300">0</h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Key className="w-5 h-5" /></div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
            <div className="bg-slate-300 h-1.5 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">--</span>
            <span className="text-slate-400">0 Xe tự do</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Xe đang chạy</p>
              <h2 className="text-3xl font-bold text-slate-300">0</h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Vận tốc TB</p><p className="text-sm font-bold text-slate-400">-- km/h</p></div>
            <div className="text-right"><p className="text-[10px] text-slate-400 uppercase font-bold">Tiêu hao</p><p className="text-sm font-bold text-slate-400">-- L/100km</p></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cảnh báo hệ thống</p>
              <h2 className="text-3xl font-bold text-slate-300">0</h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ShieldAlert className="w-5 h-5" /></div>
          </div>
          <div className="text-xs text-slate-400 p-2 rounded-lg border border-slate-100 text-center mt-auto">Không có sự cố nào</div>
        </div>
      </div>

      <div className="h-[400px] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
         <p className="text-slate-400 font-medium">Khu vực hiển thị bản đồ trực tiếp (Đang chờ dữ liệu GPS)</p>
      </div>
    </div>
  );
}