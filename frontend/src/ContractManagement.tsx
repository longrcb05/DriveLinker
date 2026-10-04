import { 
  Search, Download, RefreshCw, ChevronRight, Truck,
  Building2, Filter, FileText, ShieldCheck, User,
  CreditCard, List, Users
} from 'lucide-react';

/**
 * Component: ContractManagement (Quản lý Đối tác & Hợp đồng Vận chuyển)
 * Purpose: Quản lý danh sách khách hàng doanh nghiệp, theo dõi hợp đồng thuê xe,
 *          và kiểm soát hạn mức tín dụng/công nợ.
 * Note: Hiện tại UI đang ở trạng thái Empty State (chưa có dữ liệu).
 * 
 * TODO cho team dev: 
 * - Viết API fetch danh sách khách hàng (có phân trang và tìm kiếm).
 * - Viết API lấy chi tiết hợp đồng khi click vào một khách hàng trong danh sách.
 * - Khai báo state lưu trữ (vd: const [selectedPartner, setSelectedPartner] = useState(null)) 
 *   để đổ dữ liệu vào cột bên phải.
 */
export default function ContractManagement() {
  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      
      {/* ==========================================
          1. HEADER KHU VỰC
          Chứa Breadcrumb, Tiêu đề và Các nút chức năng chính
          ========================================== */}
      <div className="px-6 pt-5 pb-3">
        {/* Breadcrumb điều hướng */}
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">Operations</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-sky-600 cursor-pointer">Partners & Fleet Leases</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          {/* Badge trạng thái dữ liệu */}
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 normal-case tracking-normal shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Đang chờ dữ liệu
          </span>
        </div>
        
        {/* Tiêu đề & Cụm nút hành động */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">Quản lý Đối tác & Hợp đồng Vận chuyển</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">Hệ sinh thái điều phối đối tác doanh nghiệp, khách hàng thuê xe viễn thông, kiểm soát hạn mức tín dụng và lịch sử hợp đồng.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* TODO: Gọi lại hàm fetch data (refetch) khi bấm làm mới */}
            <button className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
            {/* TODO: Mở modal thêm khách hàng */}
            <button className="bg-[#0EA5E9] border border-[#0EA5E9] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600 transition-all shadow-sm active:scale-95">
              <User className="w-4 h-4" /> Thêm khách hàng
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          2. SUMMARY CARDS (Thẻ Thống kê)
          Hiển thị số liệu tổng quan về đối tác và doanh thu
          TODO: Truyền dữ liệu thật từ API vào các thẻ này
          ========================================== */}
      <div className="px-6 grid grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Tổng khách hàng */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng khách hàng</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">0</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Building2 className="w-4 h-4" /></div>
          </div>
          {/* Progress bar giả lập tỷ lệ các loại đối tác (Logistics/Cá nhân/...) */}
          <div className="w-full flex h-2 rounded-full mb-2 bg-slate-100"></div>
        </div>

        {/* Card 2: Hợp đồng xe đang thuê */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hợp đồng xe đang thuê</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">0</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Truck className="w-4 h-4" /></div>
          </div>
          <div className="text-slate-400 font-bold text-xs mt-auto">-- xe</div>
        </div>

        {/* Card 3: Doanh thu */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doanh thu thuê xe tháng</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">0</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><CreditCard className="w-4 h-4" /></div>
          </div>
          <div className="text-slate-400 font-bold text-xs mt-auto">-- MoM</div>
        </div>

        {/* Card 4: Tín nhiệm */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tín nhiệm & Đúng hạn</p>
              <h3 className="text-3xl font-bold text-slate-300 leading-none">--%</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck className="w-4 h-4" /></div>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. MAIN LAYOUT SPLIT (Chia làm 2 cột: Danh sách và Chi tiết)
          ========================================== */}
      <div className="px-6 flex gap-6 pb-6 h-[500px]">
        
        {/* CỘT TRÁI: Bảng danh sách Khách hàng */}
        <div className="w-[60%] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          {/* Box tìm kiếm */}
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1 opacity-50 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {/* TODO: Gắn onChange handler để implement tính năng search */}
              <input disabled type="text" placeholder="Tìm tên công ty, mã KH..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none" />
            </div>
          </div>
          
          {/* Vùng hiển thị trống (Empty State) - TODO: Thay thế bằng vòng lặp .map() khi có data */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Users className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium text-sm">Chưa có dữ liệu khách hàng</p>
          </div>
        </div>

        {/* CỘT PHẢI: Khung Chi tiết Đối tác / Hợp đồng */}
        <div className="w-[40%] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center p-8">
          {/* Trạng thái chưa chọn đối tác */}
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <FileText className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-sm">Chưa chọn đối tác</p>
          {/* TODO: Dùng toán tử ba ngôi (selectedPartner ? <DetailComponent/> : <EmptyState/>) 
              để hiển thị chi tiết khi click vào một hàng bên danh sách */}
        </div>
        
      </div>
    </div>
  );
}