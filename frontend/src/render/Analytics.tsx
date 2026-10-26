import {
  Download, ChevronRight, Truck, AlertTriangle, ShieldCheck, Activity, BarChart3, PieChart, FileText
} from 'lucide-react';

export default function Analytics() {
  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">MENU</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-sky-600 cursor-pointer">Phân tích</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Báo cáo Vận hành</h2>
            <p className="text-xs text-slate-500 mt-1">Tổng hợp số liệu chuyến xe, cảnh báo và hiệu suất xử lý trong tháng.</p>
          </div>
          <button className="bg-[#0EA5E9] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="px-6 grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số chuyến</p>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">0</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cảnh báo vi phạm</p>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">0</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã xử lý</p>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">0%</h3>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ số an toàn</p>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">-- <span className="text-sm font-medium text-slate-500">/ 100</span></h3>
        </div>
      </div>

      <div className="px-6 flex gap-4 mb-6">
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-sky-500" /> Biểu đồ xu hướng
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">Chưa có dữ liệu</p>
          </div>
        </div>

        <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
            <PieChart className="w-4 h-4 text-rose-500" /> Phân loại vi phạm
          </h3>
          <div className="flex-1 space-y-5">
            {[
              'Nhắm mắt kéo dài', 'Ngáp liên tục', 'Ngủ gục', 'Mất tập trung', 'Lệch camera'
            ].map((label, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] font-bold mb-1.5 text-slate-600">
                  <span>{label}</span>
                  <span>0%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Lịch sử sự kiện</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Phương tiện</th>
                  <th className="p-4">Tài xế</th>
                  <th className="p-4">Loại vi phạm</th>
                  <th className="p-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Chưa có sự kiện nào</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}