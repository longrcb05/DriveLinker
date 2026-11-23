import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, LayoutDashboard, Users, Camera, LogOut, ShieldCheck } from 'lucide-react';
import { recordAdminAction } from '../render/admin/adminAudit';

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    recordAdminAction('ĐĂNG XUẤT', 'Kết thúc phiên làm việc');
    ['sys_core_role', 'sys_core_admin_name', 'sys_core_username', 'sys_core_token'].forEach(key => sessionStorage.removeItem(key));
    navigate('/overview/admin/login');
  };
  const items = [
    { path: '/overview/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { path: '/overview/admin/accounts', label: 'Quản lý tài khoản', icon: Users },
    { path: '/overview/admin/devices', label: 'Camera & Định vị', icon: Camera },
  ];
  return <div className="flex h-screen overflow-hidden bg-[#fff8f8] text-slate-900 font-sans">
    <aside className="h-screen w-20 md:w-[260px] bg-[#e90035] text-white flex flex-col shrink-0">
      <div className="flex items-center gap-3 border-b border-white/20 px-4 md:px-7 py-5"><span className="rounded-xl bg-[#ff003b] p-2.5 text-white ring-1 ring-white/50 shadow-lg shadow-red-950/30"><Truck className="h-6 w-6" /></span><div className="hidden md:block"><div className="font-extrabold text-xl text-white">DriveLinker</div><div className="text-[10px] tracking-wider text-white/90">Drive Safe - Arrive Alive</div></div></div>
      <div className="flex-1 overflow-y-auto px-3 py-7"><p className="hidden md:block px-4 mb-4 text-xs font-bold tracking-wider text-white/70">HỆ THỐNG QUẢN LÝ</p><nav aria-label="Menu quản trị" className="space-y-2">{items.map(({path,label,icon: Icon,end}) => <NavLink key={path} to={path} end={end} title={label} className={({isActive}) => `flex items-center gap-4 rounded-xl px-4 py-4 text-sm font-bold transition-colors ${isActive ? 'bg-white text-[#d80031] shadow-sm' : 'text-white/90 hover:bg-white/15 hover:text-white'}`}><Icon className="h-5 w-5 shrink-0" /><span className="hidden md:inline">{label}</span></NavLink>)}</nav></div>
      <button onClick={logout} className="flex items-center gap-4 border-t border-white/20 px-7 py-7 text-sm font-bold text-white/90 hover:bg-white/15 hover:text-white" title="Đăng xuất"><LogOut className="h-5 w-5 shrink-0"/><span className="hidden md:inline">Đăng xuất</span></button>
    </aside>
    <div className="min-w-0 flex-1 overflow-y-auto"><header className="flex h-20 items-center justify-end border-b border-slate-200 bg-white px-6"><div className="flex items-center gap-3"><div className="rounded-full bg-red-100 p-2.5 text-red-600"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-bold">{sessionStorage.getItem('sys_core_admin_name') || 'Quản trị viên'}</p><p className="text-xs font-semibold text-red-600">{sessionStorage.getItem('sys_core_role')}</p></div></div></header><Outlet /></div>
  </div>;
}
