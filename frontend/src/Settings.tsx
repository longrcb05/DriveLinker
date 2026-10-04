import React from 'react';
import { 
  ChevronRight, History, RotateCcw, Save, Camera, Radio, 
  FileText, PhoneCall, Users, Webhook, Server, Cpu, 
  ToggleLeft, Volume2, ShieldAlert, Cloud, HardDrive, CheckCircle2, AlertTriangle, MonitorSmartphone
} from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      
      {/* BANNER HỆ THỐNG */}
      <div className="bg-sky-50 border-b border-sky-100 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-sky-700 font-medium">
          <Server className="w-4 h-4" />
          <span>Kênh truyền vệ tinh trực tiếp Cụm máy chủ API: <span className="font-bold bg-sky-200/50 px-1.5 rounded">API-VN-192.164.0.1</span></span>
        </div>
        <div className="flex items-center gap-4 font-bold text-slate-500 text-[10px] uppercase">
          <span className="flex items-center gap-1.5 text-emerald-600"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ECU ONLINE: 0 / 0</span>
          <span>Dữ liệu lưu trữ trống</span>
        </div>
      </div>

      {/* HEADER KHU VỰC */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer">Operations Deck</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-sky-600 cursor-pointer">Cài đặt Hệ thống (System Settings)</span>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Cấu hình Thiết bị & Viễn thông Hạm đội</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">Quản lý giao thức an toàn AI DMS Cabin, đồng bộ Cục Đường Bộ GTVT 24/7 và tần suất định vị RTK GNSS.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
              <History className="w-4 h-4" /> Nhật ký cấu hình
            </button>
            <button className="bg-white border border-slate-200 text-rose-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-rose-50 transition shadow-sm">
              <RotateCcw className="w-4 h-4" /> Khôi phục mặc định
            </button>
            <button className="bg-[#0EA5E9] border border-[#0EA5E9] text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600 transition shadow-sm">
              <Save className="w-4 h-4" /> Lưu cấu hình
            </button>
          </div>
        </div>
      </div>

      {/* CHIA 2 CỘT */}
      <div className="px-6 flex gap-6 pb-6">
        
        {/* Cột trái: Menu Tabs & System Info */}
        <div className="w-[300px] flex flex-col gap-4 shrink-0">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">Danh mục cấu hình</p>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-left transition-colors">
               <Camera className="w-5 h-5 shrink-0" />
               <div>
                 <p className="text-xs font-bold leading-tight flex items-center gap-2">1. AI DMS Cabin & Cảnh báo <span className="bg-sky-500 text-white text-[8px] px-1.5 py-0.5 rounded">PRO</span></p>
                 <p className="text-[9px] font-medium opacity-70 mt-0.5">Face tracking & PERCLOS</p>
               </div>
            </button>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 text-left transition-colors">
               <Radio className="w-5 h-5 shrink-0 text-slate-400" />
               <div>
                 <p className="text-xs font-bold leading-tight">2. Viễn thông RTK & Tần suất</p>
                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">Dual-Band GNSS & 4G Cat-M1</p>
               </div>
            </button>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 text-left transition-colors">
               <FileText className="w-5 h-5 shrink-0 text-slate-400" />
               <div>
                 <p className="text-xs font-bold leading-tight">3. Cục Đường Bộ & NĐ 10/2020</p>
                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">QCVN 31:2014/BGTVT</p>
               </div>
            </button>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 text-left transition-colors">
               <PhoneCall className="w-5 h-5 shrink-0 text-slate-400" />
               <div>
                 <p className="text-xs font-bold leading-tight flex items-center gap-2">4. Can thiệp Khẩn cấp (SOS) <span className="bg-rose-100 text-rose-600 text-[8px] px-1.5 py-0.5 rounded">Cấp 1</span></p>
                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">Còi cabin & Hotline người thân</p>
               </div>
            </button>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 text-left transition-colors">
               <Users className="w-5 h-5 shrink-0 text-slate-400" />
               <div>
                 <p className="text-xs font-bold leading-tight">5. Phân quyền Vận hành (RBAC)</p>
                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">Role based access control</p>
               </div>
            </button>

            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-slate-600 text-left transition-colors">
               <Webhook className="w-5 h-5 shrink-0 text-slate-400" />
               <div>
                 <p className="text-xs font-bold leading-tight">6. API & Webhook Real-time</p>
                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">Cấp quyền đối tác kho bãi</p>
               </div>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
             <div className="flex justify-between items-center mb-3">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mã Cụm Kiểm Soát API</p>
               <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded">Hoạt động</span>
             </div>
             <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Độ trễ Ping</p>
                 <p className="text-sm font-bold text-slate-700">-- <span className="text-[10px] font-normal">ms</span></p>
               </div>
               <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Áp lực CPU API</p>
                 <p className="text-sm font-bold text-emerald-600">0% <span className="text-[10px] font-normal">Tải</span></p>
               </div>
             </div>
             <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg text-slate-300">
               <Cpu className="w-6 h-6 text-sky-400" />
               <div>
                 <p className="text-[11px] font-bold text-white leading-tight">DriveLinker Edge API V2</p>
                 <p className="text-[9px]">Firmware: v4.26.0-stable</p>
               </div>
             </div>
          </div>
        </div>

        {/* Cột phải: Nội dung cấu hình (Trạng thái Empty) */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Box 1: Cấu hình AI Camera */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
             {/* Header */}
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><Camera className="w-5 h-5"/></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">Cấu hình AI Camera DMS Cabin & Nhận diện Buồn ngủ</h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md">Thuật toán PERCLOS (Percentage of Eyelid Closure) và giám sát trực tiếp góc mặt, đầu theo thời gian thực.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">FACE TRACKING: OFF</span>
                  <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">MỨC ĐỘ: CHƯA CÀI ĐẶT</span>
                </div>
             </div>

             {/* Toggles */}
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex justify-between items-center">
               <div>
                 <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MonitorSmartphone className="w-4 h-4 text-slate-400"/> Cố định khóa điện họa tài xế (Face tracking Only)</h4>
                 <p className="text-[10px] text-rose-500 mt-0.5">Nghiêm cấm: Cảnh báo còi xe liên tục nếu camera bị che khuất hoặc xoay lệch góc.</p>
               </div>
               {/* Toggle Tắt */}
               <ToggleLeft className="w-10 h-10 text-slate-300 cursor-pointer" />
             </div>

             <div className="flex gap-4 mb-6">
                <div className="w-40 h-28 bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8 mb-2 opacity-50"/>
                  <span className="text-[9px] font-bold">LIVE PREVIEW</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-800 mb-1">Ngưỡng sai lệch góc quay mặt cho phép</h4>
                  <p className="text-[10px] text-slate-500 mb-4">Hệ thống kích hoạt tính thanh cảnh báo nếu tài xế quay mặt khỏi khung hình quá độ lệch cho phép liên tục 3 giây.</p>
                  <div className="flex items-center gap-4">
                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full w-[0%] bg-sky-500"></div>
                     </div>
                     <span className="font-bold text-slate-700 text-lg">0&deg;</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
                    <span>0&deg; (Khóa cứng)</span>
                    <span className="text-slate-700">15&deg; (Khuyến nghị)</span>
                    <span>45&deg; (Quá lỏng)</span>
                  </div>
                </div>
             </div>

             {/* Các thông số */}
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Thông số thuật toán chuẩn bnb (PERCLOS Standard)</p>
             <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">Nhắm mắt Cấp 1 <div className="w-2 h-2 rounded-full bg-amber-400"></div></p>
                  <p className="text-lg font-bold text-slate-300 mb-1">0.0 <span className="text-xs font-normal">Giây</span></p>
                  <p className="text-[9px] text-slate-400">Chưa cấu hình ngưỡng nhắc nhở nhẹ.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">Nhắm mắt Cấp 2 <div className="w-2 h-2 rounded-full bg-rose-500"></div></p>
                  <p className="text-lg font-bold text-slate-300 mb-1">0.0 <span className="text-xs font-normal">Giây</span></p>
                  <p className="text-[9px] text-slate-400">Chưa cấu hình ngưỡng báo động nguy cấp.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">Chỉ số PERCLOS Nguy hiểm <FileText className="w-3 h-3 text-slate-300"/></p>
                  <p className="text-lg font-bold text-slate-300 mb-1">0% <span className="text-xs font-normal">Tỷ lệ</span></p>
                  <p className="text-[9px] text-slate-400">Chưa cấu hình tỷ lệ nhắm mắt.</p>
                </div>
             </div>

             {/* Checkboxes trống */}
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Hành động Phản hồi/Báo động tự động</p>
             <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg opacity-60">
                   <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5"></div>
                   <div>
                     <p className="text-xs font-bold text-slate-700">Hú còi cảnh báo tại cabin (85dB SPL High-Pitch)</p>
                     <p className="text-[10px] text-slate-500">Chưa kích hoạt hú còi báo động trực tiếp trong cabin.</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg opacity-60">
                   <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5"></div>
                   <div>
                     <p className="text-xs font-bold text-slate-700 flex items-center gap-2">Nhắc nhở bằng giọng nói AI Tiếng Việt chuẩn tự nhiên <span className="bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded">Tùy chọn</span></p>
                     <p className="text-[10px] text-slate-500">Chưa kích hoạt: "Tài xế chú ý quan sát và chuẩn bị tạm nghỉ giải lao".</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg opacity-60">
                   <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5"></div>
                   <div>
                     <p className="text-xs font-bold text-slate-700">Gọi SMS / Hotline Khẩn cấp tới người thân & Trung tâm Điều hành</p>
                     <p className="text-[10px] text-slate-500">Chưa cấu hình tự động gọi điện.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Box 2: Đồng bộ Dữ liệu GPS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><Radio className="w-5 h-5"/></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">Đồng bộ Dữ liệu Viễn thông GPS RTK & Quy chuẩn Nhà nước</h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md">Tần suất định vị vệ tinh vi phân RTK và luồng truyền dữ liệu giám sát hành trình lên cổng thông tin vận tải.</p>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-700">Khi đang chạy (Vehicle Running)</p>
                    <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300">-- giây / lần</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">Tần suất truyền quét vị trí, vận tốc chưa cấu hình.</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-700">Khi dừng / tắt máy (Engine Idle / Stop)</p>
                    <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300">-- phút / lần</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">Tần suất chế độ ngủ chưa cấu hình.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 opacity-70">
                  <Webhook className="w-6 h-6 text-slate-400 shrink-0"/>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700">Công nghệ Định vị RTK GNSS Dual-Band</p>
                    <p className="text-[9px] text-slate-500 mt-1">Hỗ trợ nhận tín hiệu L1/L5 với trạm Base CORS.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 opacity-70">
                  <Volume2 className="w-6 h-6 text-slate-400 shrink-0"/>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700">Mạng 4G/LTE Cat-M1 & Bộ nhớ dự phòng</p>
                    <p className="text-[9px] text-slate-500 mt-1">Chưa kích hoạt tính năng lưu offline.</p>
                  </div>
                </div>
             </div>

             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 border-l-4 border-l-slate-300">
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-2">
                     <FileText className="w-4 h-4 text-slate-500" />
                     <p className="text-xs font-bold text-slate-800">Cổng Kết nối Cục Đường Bộ Việt Nam (TCVN)</p>
                   </div>
                   <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">Chưa cấu hình API (TCVN 31:2014)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white border border-slate-200 rounded-lg p-3">
                     <p className="text-[10px] font-bold text-slate-700 mb-1">Vượt quá giới hạn tốc độ</p>
                     <p className="text-[9px] text-slate-500">Chưa cấu hình cảnh báo tốc độ.</p>
                   </div>
                   <div className="bg-white border border-slate-200 rounded-lg p-3">
                     <p className="text-[10px] font-bold text-slate-700 mb-1">Báo cáo vi phạm thời gian lái xe</p>
                     <p className="text-[9px] text-slate-500">Chưa cấu hình cảnh báo quá 4h liên tục.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Box 3: Lưu trữ Video */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><Cloud className="w-5 h-5"/></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">Thời gian Lưu trữ Video Sự kiện AI Cabin</h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md">Lưu trữ ảnh và logs vi phạm, luồng video bằng chứng trên Cloud và thẻ SD gốc.</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded uppercase">AWS Data Residency: VN (Viettel)</span>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-center items-center text-center">
                   <p className="text-3xl font-bold text-slate-300 mb-1 flex items-center gap-2">0 <span className="text-sm font-medium">Ngày</span></p>
                   <p className="text-[10px] font-bold text-slate-600 mb-1">Trên Máy chủ Lưu trữ Cloud DriveLinker</p>
                   <p className="text-[9px] text-slate-400">Chưa mua gói lưu trữ Video trên Cloud.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-center items-center text-center">
                   <p className="text-3xl font-bold text-slate-300 mb-1 flex items-center gap-2">0 <span className="text-sm font-medium">Ngày</span></p>
                   <p className="text-[10px] font-bold text-slate-600 mb-1">Tại Bộ nhớ Local SD Card 256GB</p>
                   <p className="text-[9px] text-slate-400">Chưa format định dạng thẻ nhớ SD.</p>
                </div>
             </div>
             
             <div className="flex items-center justify-between border-t border-slate-100 pt-4">
               <div className="flex items-center gap-2 text-[10px] text-slate-500">
                 <ShieldAlert className="w-4 h-4 text-amber-500"/> Data chưa được mã hóa end-to-end (AES-256).
               </div>
               <div className="flex gap-2">
                 <button className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-4 py-2">Hủy bỏ</button>
                 <button className="bg-[#0EA5E9] text-white text-[11px] font-bold px-6 py-2 rounded-lg hover:bg-sky-600 flex items-center gap-2 shadow-sm">
                   <CheckCircle2 className="w-4 h-4" /> Áp dụng cấu hình
                 </button>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}