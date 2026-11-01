/**
 * @file DashboardLayout.tsx
 * @description Layout chính của toàn bộ hệ thống sau khi người dùng đăng nhập.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, LayoutDashboard, Truck, Map as MapIcon,
  BarChart3, Settings, Handshake, LogOut, Settings2, RefreshCw, XCircle, X,
  ClipboardCheck // ĐÃ BỔ SUNG: Import icon cho menu Duyệt đơn giá
} from 'lucide-react';
import { vehicleService } from '../api/vehicleService';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantName, setTenantName] = useState(localStorage.getItem('tenantName') || 'DriveLinker');
  const isAdminImpersonating = localStorage.getItem('isAdminImpersonating') === 'true';
  const [syncState, setSyncState] = useState<'IDLE' | 'STAGED' | 'SYNCING'>('IDLE');

  // State quản lý hiển thị Modal Thêm Xe
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModelYear, setNewModelYear] = useState('');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'TENANT_STAFF');
    setTenantName(localStorage.getItem('tenantName') || 'DriveLinker');
  }, [location.pathname]);

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, path: '/overview', roles: ['TENANT_ADMIN', 'ADMIN', 'TENANT_STAFF', 'STAFF', 'SUPER_ADMIN_VIEW'] },
    { id: 'tracking', label: 'Theo dõi', icon: MapIcon, path: '/tracking', roles: ['TENANT_ADMIN', 'ADMIN', 'TENANT_STAFF', 'STAFF', 'SUPER_ADMIN_VIEW'] },
    { id: 'analytics', label: 'Phân tích', icon: BarChart3, path: '/analytics', roles: ['TENANT_ADMIN', 'ADMIN', 'TENANT_STAFF', 'STAFF', 'SUPER_ADMIN_VIEW'] },
    { id: 'partners', label: 'Đối tác & Hợp đồng', icon: Handshake, path: '/partners', roles: ['TENANT_ADMIN', 'ADMIN', 'TENANT_STAFF', 'STAFF', 'SUPER_ADMIN_VIEW'] },
    // ĐÃ BỔ SUNG: Menu Duyệt đơn giá (Dành cho Quản lý)
    { id: 'approvals', label: 'Duyệt đơn giá', icon: ClipboardCheck, path: '/approvals', roles: ['TENANT_ADMIN', 'ADMIN', 'SUPER_ADMIN_VIEW'] },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings', roles: ['TENANT_ADMIN', 'ADMIN', 'SUPER_ADMIN_VIEW'] },
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(userRole));

  const handleLogout = () => {
    if (isAdminImpersonating) {
      localStorage.removeItem('isAdminImpersonating');
      localStorage.removeItem('userRole');
      navigate('/overview/admin');
    } else {
      localStorage.clear();
      navigate('/portal/login');
    }
  };

  const handleFixSystem = () => {
    setSyncState('STAGED');
    alert('Đã thiết lập cấu hình vá lỗi cho doanh nghiệp này. Vui lòng bấm Đồng bộ để lưu thay đổi.');
  };

  const handleSync = () => {
    setSyncState('SYNCING');
    setTimeout(() => {
      setSyncState('IDLE');
      alert('Đồng bộ hoàn tất! Manager và Staff của doanh nghiệp đã nhận được bản cập nhật.');
    }, 2000);
  };

  const handleSaveVehicle = async () => {
    if (!newLicensePlate.trim()) {
      alert('Vui lòng nhập biển số xe.');
      return;
    }

    setIsAddingVehicle(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await vehicleService.addVehicle({
          licensePlate: newLicensePlate.trim().toUpperCase(),
          brand: newBrand.trim().toUpperCase() || 'VINFAST',
          vehicleType: 'TRUCK',
          model: newModelYear ? `Model ${newModelYear}` : 'VF8'
        });
        alert('Thêm phương tiện mới vào hệ thống thành công!');
        window.dispatchEvent(new Event('vehicle_updated'));
      } else {
        alert('Giả lập lưu dữ liệu thành công!');
      }
      setShowAddModal(false);
      setNewLicensePlate('');
      setNewBrand('');
      setNewModelYear('');
    } catch (err: any) {
      console.error('Lỗi khi thêm xe:', err);
      const errMsg = err?.response?.data?.message || err.message || 'Lỗi khi lưu phương tiện.';
      alert(`Không thể lưu phương tiện: ${errMsg}`);
    } finally {
      setIsAddingVehicle(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden relative print:bg-white">
      <style>{`
        @media print {
          aside, header, .core-toolbar, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; }
        }
      `}</style>

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
                      `w-full flex items-center justify-between px-3 py-3 font-medium transition-all duration-200 border-l-4 ${isActive || (item.path === '/overview' && location.pathname === '/overview')
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
        </div>

        <div className="p-4 flex flex-col gap-3 shrink-0 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-rose-500/20"
          >
            {isAdminImpersonating ? <XCircle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            {isAdminImpersonating ? 'Thoát chế độ Admin' : 'Đăng xuất'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Nút gọi Modal Thêm Mới */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isAdminImpersonating ? 'bg-rose-100 text-rose-600 border border-rose-200' : (userRole === 'TENANT_ADMIN' || userRole === 'ADMIN') ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-sky-100 text-sky-600 border border-sky-200'}`}>
                {isAdminImpersonating ? 'A' : (userRole === 'TENANT_ADMIN' || userRole === 'ADMIN') ? 'M' : 'S'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 leading-none">Tài khoản</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium tracking-wide">
                  {tenantName} •
                  <span className={isAdminImpersonating ? 'text-rose-600 font-bold ml-1' : (userRole === 'TENANT_ADMIN' || userRole === 'ADMIN') ? 'text-emerald-600 font-bold ml-1' : 'text-sky-600 font-bold ml-1'}>
                    {isAdminImpersonating ? 'ADMIN_HỆ_THỐNG' : (userRole === 'TENANT_ADMIN' || userRole === 'ADMIN') ? 'QUẢN LÝ' : 'NHÂN VIÊN'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <Outlet />

        {isAdminImpersonating && (
          <div className="core-toolbar absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-4">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-rose-500 rounded-full relative"></div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Core Mode</span>
            </div>
            <button onClick={handleFixSystem} className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
              <Settings2 className="w-4 h-4 text-sky-400" /> Cấu hình & Sửa lỗi
            </button>
            <button
              onClick={handleSync}
              disabled={syncState === 'IDLE' || syncState === 'SYNCING'}
              className={`ml-2 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${syncState === 'STAGED' ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <RefreshCw className={`w-4 h-4 ${syncState === 'SYNCING' ? 'animate-spin' : ''}`} />
              {syncState === 'SYNCING' ? 'Đang đẩy...' : 'Đồng bộ hệ thống'}
            </button>
          </div>
        )}
      </main>

      {/* ================= MODAL THÊM MỚI PHƯƠNG TIỆN ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Thêm phương tiện mới</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Biển số xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLicensePlate}
                  onChange={(e) => setNewLicensePlate(e.target.value)}
                  placeholder="VD: 43A-12345"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all uppercase placeholder:normal-case font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Thương hiệu xe
                </label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="VD: Hyundai, Toyota, Ford..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Đời xe (Năm sản xuất)
                </label>
                <input
                  type="number"
                  value={newModelYear}
                  onChange={(e) => setNewModelYear(e.target.value)}
                  placeholder="VD: 2023"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isAddingVehicle}
                onClick={handleSaveVehicle}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#0EA5E9] hover:bg-sky-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isAddingVehicle ? 'Đang lưu...' : 'Lưu phương tiện'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
