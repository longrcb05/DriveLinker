import React from 'react';
import { 
  ChevronRight, RefreshCw, Download, Settings, 
  ShieldAlert, EyeOff, ShieldCheck, PhoneCall, AlertTriangle, 
  Search, Calendar, Filter, CheckCircle2, BarChart3, 
  Video, BellRing, Phone
} from 'lucide-react';

/**
 * Component: Alerts (Trung tâm Cảnh báo & Giám sát An toàn)
 * Purpose: Hiển thị giao diện giám sát các cảnh báo an toàn từ hệ thống DMS (Driver Monitoring System).
 * Note: Hiện tại toàn bộ dữ liệu đang được hardcode ở trạng thái "Empty State" (trống).
 * TODO cho người sau: 
 * - Tích hợp WebSocket/SSE để nhận cảnh báo realtime.
 * - Map dữ liệu từ API vào các thẻ KPI và danh sách vi phạm.
 */
export default function Alerts() {
  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      
      {/* ==========================================
          1. KHU VỰC HEADER TỔNG
          ========================================== */}
      <div className="px-6 pt-5 pb-3">
        {/* Breadcrumb & Trạng thái kết nối */}
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Hệ thống an toàn chủ động DMS</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          {/* Badge trạng thái API - Đang hardcode giả lập pulse */}
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 normal-case tracking-normal border border-emerald-200 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Kết nối API trực tiếp
          </span>
        </div>
        
        {/* Tiêu đề & Cụm nút hành động */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Trung tâm Cảnh báo & Giám sát An toàn</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">Giám sát trực tiếp sự kiện buồn ngủ, mất tập trung bằng AI DMS và giám sát tuân thủ góc camera bắt buộc hướng khuôn mặt tài xế trong khoang lái.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* TODO: Gắn hàm fetch lại dữ liệu vào nút Làm mới */}
            <button className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <RefreshCw className="w-4 h-4" /> Làm mới (Real-time)
            </button>
            <button disabled className="bg-white border border-slate-200 text-slate-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed opacity-70">
              <Download className="w-4 h-4" /> Xuất Báo Cáo Vi Phạm
            </button>
            {/* TODO: Mở modal cấu hình ngưỡng còi khi click */}
            <button className="bg-[#0EA5E9] border border-[#0EA5E9] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600 transition-all shadow-sm active:scale-95">
              <Settings className="w-4 h-4" /> Cấu hình ngưỡng còi Cabin
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          2. KHU VỰC THỐNG KÊ (KPI CARDS)
          Hiển thị tóm tắt các chỉ số quan trọng nhất
          ========================================== */}
      <div className="px-6 grid grid-cols-5 gap-4 mb-6">
        {/* KPI: Cảnh báo buồn ngủ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cảnh báo buồn ngủ (DMS)</p>
            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400"><ShieldAlert className="w-3 h-3" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 leading-none mb-2">0 <span className="text-[10px] font-medium text-slate-400 normal-case">Vụ cảnh báo</span></h3>
          <div className="text-[9px] font-bold text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>Nhắm mắt: 0</span>
            <span>Ngáp: 0</span>
          </div>
        </div>

        {/* KPI: Vi phạm góc cam */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vi phạm góc camera AI</p>
            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400"><EyeOff className="w-3 h-3" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 leading-none mb-2">0 <span className="text-[10px] font-medium text-slate-400 normal-case">Xe vi phạm</span></h3>
          <div className="text-[9px] font-bold text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>Lệch góc: 0</span>
            <span>Che khuất: 0</span>
          </div>
        </div>

        {/* KPI: Tuân thủ toàn đội */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tuân thủ DMS toàn đội</p>
            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck className="w-3 h-3" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 leading-none mb-2">--%</h3>
          <div className="text-[9px] font-bold text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>Đang thu thập dữ liệu</span>
          </div>
        </div>

        {/* KPI: Xử lý & Phản hồi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đã xử lý & Phản hồi</p>
            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400"><PhoneCall className="w-3 h-3" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 leading-none mb-2">0 <span className="text-[10px] font-medium text-slate-400 normal-case">Lượt tác động</span></h3>
          <div className="text-[9px] font-bold text-slate-400 flex gap-2 pt-2 border-t border-slate-100">
             <span className="bg-slate-100 px-1.5 py-0.5 rounded">0 Còi Cabin</span>
             <span className="bg-slate-100 px-1.5 py-0.5 rounded">0 Cuộc gọi</span>
          </div>
        </div>

        {/* KPI: Rủi ro cao */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tài xế rủi ro cao</p>
            <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400"><AlertTriangle className="w-3 h-3" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 leading-none mb-2">0 <span className="text-[10px] font-medium text-slate-400 normal-case">Cá nhân</span></h3>
          <div className="text-[9px] font-bold text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>Không có rủi ro</span>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. BỘ LỌC (FILTERS & SEARCH)
          ========================================== */}
      <div className="px-6 mb-6 flex items-center justify-between">
        {/* Bộ lọc loại cảnh báo - Disabled tạm thời khi chưa có data */}
        <div className="flex gap-2 text-[11px] font-bold opacity-50 pointer-events-none">
          <button className="bg-[#0EA5E9] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">Tất cả cảnh báo (0)</button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Cảnh báo buồn ngủ (0)
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Lệch / Che khuất Cam (0)
          </button>
        </div>
        
        {/* Thanh tìm kiếm & Lọc thời gian */}
        <div className="flex items-center gap-3 opacity-50 pointer-events-none">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input disabled type="text" placeholder="Tìm biển số, tài xế, mã..." className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
            <Calendar className="w-4 h-4" /> Hôm nay
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Mức độ: Tất cả
          </button>
        </div>
      </div>

      {/* ==========================================
          4. BANNER THÔNG BÁO TÌNH TRẠNG CHUNG
          ========================================== */}
      <div className="px-6 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 text-sm">Trạng thái an toàn</h3>
              <p className="text-emerald-600 text-xs mt-0.5">Hệ thống không ghi nhận cảnh báo nguy cấp nào trong 24 giờ qua.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          5. KHU VỰC NỘI DUNG CHÍNH (LAYOUT 2 CỘT)
          ========================================== */}
      <div className="px-6 flex gap-6 pb-6">
        
        {/* CỘT TRÁI: DANH SÁCH LOG CẢNH BÁO */}
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="text-sm font-bold text-slate-800">DANH SÁCH SỰ KIỆN AN TOÀN DMS & CAMERA CABIN</h3>
            <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">0 Cảnh báo Trực tiếp</span>
          </div>

          {/* Trạng thái Empty: Render khi mảng alerts.length === 0 */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-slate-500 font-bold text-lg">Không có sự kiện cảnh báo nào</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm text-center">Mọi phương tiện đều đang tuân thủ tiêu chuẩn an toàn. Danh sách vi phạm sẽ tự động cập nhật tại đây.</p>
          </div>
        </div>

        {/* CỘT PHẢI: WIDGETS BỔ TRỢ */}
        <div className="flex-[1] flex flex-col gap-6">
          
          {/* Widget: Quy chuẩn an toàn */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-sky-500"/> Quy chuẩn Camera AI DMS Cabin</h3>
            <p className="text-[10px] text-slate-500 mb-4">Áp dụng nghiêm ngặt theo tiêu chuẩn an toàn DriveLinker. Camera DMS bắt buộc phải khóa góc nhìn trực tiếp 100% vào khuôn mặt tài xế.</p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">Cảnh báo Mắt nhắm &gt; 2.0 giây</p>
                  <p className="text-[9px] text-slate-500">Hệ thống kích hoạt còi cabin 85dB tức thì và gửi cảnh báo mức đỏ về Deck điều hành.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Video className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">Lệch góc mặt &gt; 15 độ (Nghiêm cấm)</p>
                  <p className="text-[9px] text-slate-500">Camera bị xoay lệch sang kính phụ hoặc góc mù sẽ bị ghi nhận lỗi cố tình vô hiệu hóa DMS.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">Che khuất ống kính &gt; 30 giây</p>
                  <p className="text-[9px] text-slate-500">Tự động truyền dữ liệu báo cáo về Tổng công ty và trích xuất log vi phạm hành chính.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget: Biểu đồ thống kê thời gian */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-start mb-4">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-rose-500"/> Phân Bố Sự Kiện Buồn Ngủ Theo Giờ</h3>
            </div>
            {/* Vùng chứa biểu đồ - Đang hiển thị Empty */}
            <div className="h-40 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50 flex items-center justify-center flex-col">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2"/>
              <span className="text-[10px] font-medium text-slate-400">Chưa có dữ liệu</span>
            </div>
          </div>

          {/* Widget: Thông tin liên hệ điều hành */}
          <div className="bg-[#1E293B] rounded-xl shadow-sm p-5 text-slate-300">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><BellRing className="w-4 h-4 text-sky-400"/> Điều Hành Trực Ban 24/7</h3>
            <p className="text-[10px] text-slate-400 mb-4 line-clamp-2">Kết nối đường dây trực tiếp để báo cáo tình huống khẩn cấp theo tiêu chuẩn an toàn.</p>
            
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đường dây nóng điều phối viên</p>
                {/* Số điện thoại được cập nhật theo yêu cầu của hệ thống */}
                <p className="text-lg font-bold text-sky-400 leading-none">0886.557.205 <span className="text-[10px] text-slate-300 font-normal"></span></p>
              </div>
              <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center"><Phone className="w-4 h-4 text-sky-400"/></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}