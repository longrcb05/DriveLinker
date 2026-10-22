import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Search, Plus, LayoutDashboard, Truck, Map as MapIcon,
  BarChart3, AlertTriangle, Settings, Navigation, Handshake
} from 'lucide-react';

export default function DashboardLayout() {
  // Lấy thông tin phân quyền và tên công ty từ LocalStorage (Đã lưu lúc đăng nhập)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'Manager');
  const [tenantName, setTenantName] = useState(localStorage.getItem('tenantName') || 'DriveLinker');

  // ==========================================
  // 1. CẤU HÌNH MENU SIDEBAR (CÓ PHÂN QUYỀN)
  // ==========================================
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/overview' },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck, path: '/vehicles' },
    { id: 'tracking', label: 'Live Tracking', icon: MapIcon, path: '/tracking' },
    { id: 'partners', label: 'Partners & Leases', icon: Handshake, path: '/partners', pill: '0' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, path: '/alerts', badge: 0 },
    // Thuộc tính role: 'Admin' giúp hệ thống biết chỉ có Admin mới được xem menu này
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', role: 'Admin' },
  ];

  // BỘ LỌC THÔNG MINH: Chỉ giữ lại các menu không yêu cầu quyền, hoặc quyền khớp với user hiện tại
  const filteredMenu = menuItems.filter(item => !item.role || item.role === userRole);

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">

      {/* ==========================================
          2. SIDEBAR BÊN TRÁI (NAV GIAO DIỆN ĐIỀU HƯỚNG)
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
              {/* Sử dụng filteredMenu thay vì menuItems gốc */}
              {filteredMenu.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-3 py-3 font-medium transition-all duration-200 border-l-4 ${isActive
                        ? 'border-[#0EA5E9] text-[#0EA5E9] bg-slate-800/30'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {item.pill !== undefined && item.pill !== '0' && (
                      <span className="bg-slate-800 text-sky-400 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                        {item.pill}
                      </span>
                    )}
                  </NavLink>
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
                  <Navigation className="w-3 h-3" /> Đang chờ kết nối...
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
            <button className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Thêm mới
            </button>

            <div className="w-px h-8 bg-slate-200 mx-2"></div>

            {/* Profile User */}
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold">
                NL
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-none">Nguyễn Nhật Long</p>
                {/* HIỂN THỊ ĐỘNG: Tên công ty và Vai trò lấy từ LocalStorage */}
                <p className="text-[10px] text-slate-500 mt-1 font-medium tracking-wide">
                  {tenantName} • <span className={userRole === 'Admin' ? 'text-sky-600 font-bold' : ''}>{userRole}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* NƠI ĐỔ NỘI DUNG CÁC TRANG CON */}
        <Outlet />

      </main>
    </div>
  );
}