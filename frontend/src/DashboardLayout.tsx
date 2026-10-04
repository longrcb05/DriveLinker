import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Plus, LayoutDashboard, Truck, Map as MapIcon, 
  BarChart3, AlertTriangle, Settings, Navigation, Handshake
} from 'lucide-react';

/**
 * Component: Dashboard (Layout chính của ứng dụng)
 * Purpose: Cung cấp bộ khung giao diện bao gồm Sidebar (thanh điều hướng bên trái), 
 *          Header (thanh tìm kiếm/profile phía trên) và vùng Main Content.
 * Note: Component này sử dụng <Outlet /> của react-router-dom để render các trang con 
 *       (Overview, Analytics, Alerts...) vào bên trong mà không phải load lại toàn bộ trang.
 */
export default function Dashboard() {
  // Hook điều hướng của React Router
  const navigate = useNavigate();
  // Hook lấy URL hiện tại để xử lý trạng thái "Active" của menu
  const location = useLocation();

  // ==========================================
  // 1. CẤU HÌNH MENU SIDEBAR
  // TODO: Tương lai có thể tách mảng này ra một file config riêng hoặc fetch từ API 
  // dựa theo quyền (Role) của người dùng đăng nhập.
  // ==========================================
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/overview' },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck, path: '/vehicles' },
    { id: 'tracking', label: 'Live Tracking', icon: MapIcon, path: '/tracking' },
    { id: 'partners', label: 'Partners & Leases', icon: Handshake, path: '/partners', pill: '0' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, path: '/alerts', badge: 0 },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">
      
      {/* ==========================================
          2. SIDEBAR BÊN TRÁI (NAV GIOA DIỆN ĐIỀU HƯỚNG)
          ========================================== */}
      <aside className="w-[260px] bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 z-50">
        <div>
          {/* Logo & Tên dự án */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9] rounded-lg flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">DriveLinker</h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Fleet Intelligence</p>
              </div>
            </div>
          </div>

          {/* Danh sách Menu */}
          <div className="py-6 px-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Operations Deck</p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Kiểm tra URL hiện tại có chứa path của item hay không để active màu xanh
                const isActive = location.pathname.includes(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-3 font-medium transition-all duration-200 border-l-4 ${
                      isActive 
                        ? 'border-[#0EA5E9] text-[#0EA5E9] bg-slate-800/30' 
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    
                    {/* Render badge cảnh báo đỏ (vd: Alerts) nếu có số lượng > 0 */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Render pill số lượng xanh (vd: Partners) */}
                    {item.pill !== undefined && item.pill !== '0' && (
                      <span className="bg-slate-800 text-sky-400 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                        {item.pill}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Footer Sidebar (Trạng thái kết nối trạm trung tâm) */}
        <div className="p-4">
          <div className="bg-slate-800/30 rounded-lg p-4 flex justify-between items-end border border-slate-800">
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Telemetry Hub</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5 animate-pulse">
                    <Navigation className="w-3 h-3"/> Đang chờ kết nối...
                  </span>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* ==========================================
          3. KHU VỰC CHÍNH (HEADER + MAIN CONTENT)
          ========================================== */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER TRÊN CÙNG */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
          <div className="flex-1 flex items-center gap-4">
            {/* Global Search */}
            <div className="relative w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {/* TODO: Implement chức năng tìm kiếm toàn cục (Global Search) */}
              <input 
                type="text" 
                placeholder="Tìm kiếm phương tiện, tài xế..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white transition-all"
              />
            </div>
            {/* Quick Status */}
            <div className="flex items-center gap-2">
              <span className="bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>0 Active
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* TODO: Modal thêm mới nhanh (Quick Add) */}
            <button className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            
            {/* Profile User */}
            {/* TODO: Fetch thông tin user thực tế từ Redux Store hoặc Context API thay vì hardcode */}
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold">
                NL
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-none">Nguyễn Nhật Long</p>
                <p className="text-[10px] text-slate-500 mt-1">System Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* NƠI ĐỔ NỘI DUNG CÁC TRANG CON */}
        {/* React Router sẽ render component tương ứng (Overview, Analytics, Alerts...) vào vị trí của <Outlet /> */}
        <Outlet />
        
      </main>
    </div>
  );
}