import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Plus, LayoutDashboard, Truck, Map as MapIcon,
  BarChart3, AlertTriangle, Settings, Navigation, Handshake, LogOut, Database, Activity, ShieldAlert
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Lắng nghe sự thay đổi của URL

  // Bổ sung hàm set... để React có thể cập nhật lại State
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantName, setTenantName] = useState(localStorage.getItem('tenantName') || 'DriveLinker');

  // ĐÂY LÀ CHÌA KHÓA: Tự động đồng bộ lại dữ liệu mỗi khi URL thay đổi
  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'TENANT_STAFF');
    setTenantName(localStorage.getItem('tenantName') || 'DriveLinker');
  }, [location.pathname]);

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, path: '/overview', roles: ['TENANT_ADMIN', 'TENANT_STAFF'] },
    { id: 'vehicles', label: 'Phương tiện', icon: Truck, path: '/vehicles', roles: ['TENANT_ADMIN', 'TENANT_STAFF'] },
    { id: 'tracking', label: 'Theo dõi', icon: MapIcon, path: '/tracking', roles: ['TENANT_ADMIN', 'TENANT_STAFF'] },
    { id: 'partners', label: 'Đối tác', icon: Handshake, path: '/partners', roles: ['TENANT_ADMIN', 'TENANT_STAFF'] },
    { id: 'alerts', label: 'Cảnh báo', icon: AlertTriangle, path: '/alerts', roles: ['TENANT_ADMIN', 'TENANT_STAFF'] },
    { id: 'analytics', label: 'Phân tích', icon: BarChart3, path: '/analytics', roles: ['TENANT_ADMIN'] },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings', roles: ['TENANT_ADMIN', 'SYS_ADMIN'] },
  ];

  const sysAdminMenu = [
    { id: 'sys_tenants', label: 'Quản lý Doanh nghiệp', icon: Database, path: '/sysadmin/tenants' },
    { id: 'sys_logs', label: 'Nhật ký Hệ thống', icon: Activity, path: '/sysadmin/logs' },
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(userRole));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/portal/login');
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 z-50">
        <div className="flex-1 overflow-auto overflow-x-hidden">
          <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0EA5E9] rounded-lg flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">DriveLinker</h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Drive Safe - Arrive Alive</p>
              </div>
            </div>
          </div>

          {/* MENU KHÁCH HÀNG */}
          <div className="py-6 px-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
            <nav className="space-y-1">
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
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* KHOẢNG TRỜI RIÊNG CỦA ADMIN HỆ THỐNG */}
          {userRole === 'SYS_ADMIN' && (
            <div className="pb-6 px-4 border-t border-slate-800 pt-6 mt-2">
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />Only Admin
              </p>
              <nav className="space-y-1">
                {sysAdminMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-3 font-medium transition-all duration-200 rounded-lg ${isActive
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* TRẠNG THÁI & ĐĂNG XUẤT */}
        <div className="p-4 flex flex-col gap-3 shrink-0 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Tìm kiếm phương tiện, tài xế..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${userRole === 'SYS_ADMIN' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
                {userRole === 'SYS_ADMIN' ? 'A' : 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-none">Tài khoản</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium tracking-wide">
                  {tenantName} • <span className={userRole === 'SYS_ADMIN' ? 'text-rose-600 font-bold' : userRole === 'TENANT_ADMIN' ? 'text-emerald-600 font-bold' : 'text-sky-600 font-bold'}>{userRole}</span>
                </p>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}