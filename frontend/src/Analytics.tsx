import { 
  Calendar, Download, RefreshCw, ChevronRight, Truck,
  AlertTriangle, ShieldCheck, Activity, Search, List, 
  BarChart3, PieChart, FileText, Clock, Settings, ArrowUpRight
} from 'lucide-react';

/**
 * Component: Analytics (Báo cáo & Phân tích An toàn Đội xe)
 * Tác dụng: Hiển thị Dashboard thống kê các chỉ số vận hành, cảnh báo an toàn DMS và hiệu suất xử lý.
 * Trạng thái hiện tại: Đang hiển thị giao diện mẫu (Empty State) chờ tích hợp API.
 * 
 * Các thư viện đề xuất tích hợp sau này:
 * - Biểu đồ: Recharts hoặc Chart.js
 * - Xử lý ngày tháng: date-fns hoặc dayjs
 */
export default function Analytics() {
  // TODO: Khai báo state ở đây khi có API (ví dụ: const [dateRange, setDateRange] = useState(...))
  // const [analyticsData, setAnalyticsData] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      
      {/* ==========================================
          1. HEADER & GLOBAL ACTIONS
          Chứa tiêu đề, breadcrumb và các nút xuất báo cáo
          ========================================== */}
      <div className="px-6 pt-5 pb-3">
        {/* Breadcrumb điều hướng */}
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Báo cáo & Thống kê</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-sky-600 cursor-pointer">Phân tích An toàn Đội xe</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          {/* Badge trạng thái dữ liệu */}
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 normal-case tracking-normal">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Đang chờ dữ liệu
          </span>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Báo cáo Vận hành & Cảnh báo An toàn Đội xe</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">Tổng hợp số liệu toàn diện về tổng số chuyến hành trình, tần suất cảnh báo buồng lái DMS, tỷ lệ giải quyết sự cố và xu hướng rủi ro theo thời gian thực.</p>
          </div>
          
          {/* Cụm công cụ lọc & Hành động */}
          <div className="flex flex-col items-end gap-3">
            {/* TODO: Chuyển các button filter này thành Component riêng hoặc dùng state để active */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-500 shadow-sm">
              <button className="px-3 py-1.5 rounded hover:text-slate-800 transition-colors">Hôm nay</button>
              <button className="px-3 py-1.5 rounded hover:text-slate-800 transition-colors">7 ngày qua</button>
              <button className="px-3 py-1.5 rounded bg-[#0EA5E9] text-white shadow-sm font-bold">Tháng này (10/2026)</button>
              <button className="px-3 py-1.5 rounded hover:text-slate-800 transition-colors">Quý 4/2026</button>
              <button className="px-3 py-1.5 rounded flex items-center gap-1 border-l border-slate-100 ml-1 pl-3 hover:text-slate-800">
                <Calendar className="w-3 h-3"/> Tùy chỉnh
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="bg-white border border-slate-200 text-slate-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed">
                <Truck className="w-4 h-4" /> Tất cả đội xe (0 xe)
              </button>
              {/* TODO: Gắn API xuất file Excel/PDF tại đây */}
              <button className="bg-white border border-slate-200 text-slate-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-not-allowed">
                <Download className="w-4 h-4" /> Xuất báo cáo
              </button>
              <button className="bg-[#0EA5E9] border border-[#0EA5E9] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600 transition-all shadow-sm active:scale-95">
                <Settings className="w-4 h-4" /> Lập lịch tự động
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          2. SUMMARY CARDS (Chỉ số tổng quan)
          TODO: Render động các con số này dựa trên response từ API
          ========================================== */}
      <div className="px-6 grid grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Tổng chuyến xe */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hành trình vận chuyển</p>
              <p className="text-xs font-bold text-slate-600 mb-1">Tổng số chuyến xe</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">0 <span className="text-xs font-medium text-slate-400 normal-case">chuyến</span></h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Truck className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            <span>0 đúng giờ (0%)</span>
            <span>0 trễ hạn</span>
          </div>
        </div>

        {/* Card 2: Cảnh báo vi phạm */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tần suất vi phạm an toàn</p>
              <p className="text-xs font-bold text-slate-600 mb-1">Tổng số cảnh báo</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">0 <span className="text-xs font-medium text-slate-400 normal-case">sự kiện</span></h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="flex gap-3 text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 0 Cấp 1</span>
             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 0 Cấp 2</span>
             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> 0 Cấp 3</span>
          </div>
        </div>

        {/* Card 3: Hiệu suất kiểm soát */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hiệu suất trung tâm kiểm soát</p>
              <p className="text-xs font-bold text-slate-600 mb-1">Xử lý & Giải quyết</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">--% <span className="text-[10px] font-medium text-slate-400 normal-case">(0/0)</span></h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> 0 Đã phản hồi</span>
            <span className="flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3"/> 0 Chờ can thiệp</span>
          </div>
        </div>

        {/* Card 4: Chỉ số an toàn */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chỉ số cabin AI</p>
              <p className="text-xs font-bold text-slate-600 mb-1">Chỉ số an toàn DMS</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">-- <span className="text-xs font-medium text-slate-400 normal-case">/ 100</span></h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            Hệ thống đang thu thập dữ liệu phân tích
          </div>
        </div>
      </div>

      {/* ==========================================
          3. KHU VỰC BIỂU ĐỒ (CHARTS)
          TODO: Nhúng thư viện biểu đồ (vd: <ResponsiveContainer> của Recharts) vào các placeholder này
          ========================================== */}
      <div className="px-6 flex gap-4 mb-6">
        
        {/* Biểu đồ xu hướng (Trend Chart) */}
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-500"/> Thống kê Chuyến xe & Cảnh báo</h3>
              <p className="text-[10px] text-slate-500 mt-1">Phân tích tương quan giữa lưu lượng vận tải và số lần kích hoạt thuật toán DMS</p>
            </div>
            {/* Toggle view: Ngày/Tháng */}
            <div className="flex bg-slate-50 border border-slate-200 rounded p-0.5 text-[10px] font-bold text-slate-500">
              <button className="px-2 py-1 bg-white shadow-sm rounded text-slate-700 transition-colors">Theo ngày</button>
              <button className="px-2 py-1 hover:text-slate-700 transition-colors">Theo tháng</button>
            </div>
          </div>

          {/* Placeholder cho Chart */}
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 min-h-[250px]">
            <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">Chưa có dữ liệu biểu đồ</p>
            <p className="text-slate-400 text-[10px] mt-1">Đồ thị sẽ tự động hiển thị khi có dữ liệu chuyến xe đầu tiên</p>
          </div>
        </div>

        {/* Biểu đồ phân loại (Breakdown/Pie Chart) */}
        <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><PieChart className="w-4 h-4 text-rose-500"/> Phân loại Cảnh báo DMS</h3>
              <p className="text-[10px] text-slate-500 mt-1">Phân tích hành vi bất thường của tài xế</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">0 phân loại</span>
          </div>

          {/* Danh sách Progress bars hiển thị tỷ lệ */}
          <div className="flex-1 space-y-4 mt-2">
            {[
              { label: 'Nhắm mắt kéo dài (> 2s)', color: 'bg-slate-300' },
              { label: 'Phát hiện ngáp liên tục', color: 'bg-slate-300' },
              { label: 'Ngủ gục / Gục đầu', color: 'bg-slate-300' },
              { label: 'Chớp mắt chậm & Mất tập trung', color: 'bg-slate-300' },
              { label: 'Lệch góc cam DMS / Che camera', color: 'bg-slate-300' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div> 
                    {item.label}
                  </span>
                  <span className="text-slate-400">0 vụ <span className="font-normal opacity-70 ml-1">0%</span></span>
                </div>
                {/* Thanh tiến trình giả lập */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"></div>
              </div>
            ))}
          </div>

          {/* Hộp Khuyến nghị AI (Insights) */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-3">
             <h4 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3 h-3"/> Khuyến nghị & Huấn luyện:</h4>
             <p className="text-[10px] text-slate-400 leading-relaxed italic">Hệ thống AI chưa có đủ dữ liệu hành vi để đưa ra đề xuất tối ưu hóa lịch trình và cảnh báo rủi ro.</p>
          </div>
        </div>
      </div>

      {/* ==========================================
          4. BẢNG DỮ LIỆU TỔNG HỢP (DATA TABLE)
          Hiển thị lịch sử/log chi tiết của các sự kiện
          ========================================== */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          
          {/* Table Header & Controls */}
          <div className="p-4 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Danh sách Tổng hợp Sự kiện & Tình trạng Xử lý</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Tra cứu log camera AI, trích xuất đoạn video bằng chứng và xác minh biên bản xử lý an toàn giao thông</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">0 bản ghi</span>
            </div>
            
            {/* Thanh tìm kiếm & lọc trong bảng */}
            <div className="flex gap-4">
              <div className="relative flex-1 opacity-50 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input disabled type="text" placeholder="Tìm biển số, mã chuyến, tài xế..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none" />
              </div>
              <div className="flex gap-2 text-[11px] font-bold opacity-50 pointer-events-none">
                <button className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200">Tất cả (0)</button>
                <button className="bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-full flex items-center gap-1.5">Chưa xử lý (0)</button>
                <button className="bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-full flex items-center gap-1.5">Đã xử lý (0)</button>
              </div>
            </div>
          </div>

          {/* Khung Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 whitespace-nowrap">MÃ SỰ KIỆN & THỜI GIAN</th>
                  <th className="p-4 whitespace-nowrap">PHƯƠNG TIỆN & TUYẾN ĐƯỜNG</th>
                  <th className="p-4 whitespace-nowrap">TÀI XẾ PHỤ TRÁCH</th>
                  <th className="p-4 whitespace-nowrap">LOẠI VI PHẠM DMS</th>
                  <th className="p-4 whitespace-nowrap">CHỈ SỐ VI SAI AI</th>
                  <th className="p-4 whitespace-nowrap">TÌNH TRẠNG CAN THIỆP</th>
                  <th className="p-4 text-center whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {/* Trạng thái trống (Empty State) - TODO: Sẽ được thay thế bằng row.map() khi có API */}
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="text-slate-500 font-medium text-sm">Chưa có sự kiện cảnh báo nào</p>
                      <p className="text-slate-400 text-xs mt-1">Danh sách vi phạm và log video AI sẽ xuất hiện tại đây khi có dữ liệu.</p>
                    </div>
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