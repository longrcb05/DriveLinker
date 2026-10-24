import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Database, Settings, Activity, LogOut, ShieldAlert } from 'lucide-react';

export default function SystemAdminLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa toàn bộ dữ liệu phiên làm việc và đẩy về trang đăng nhập hệ thống
        localStorage.clear();
        navigate('/sysadmin/login');
    };

    const navItems = [
        { id: 'tenants', label: 'Quản lý Doanh nghiệp', icon: Database, path: '/sysadmin/tenants' },
        { id: 'config', label: 'Cấu hình Dịch vụ', icon: Settings, path: '/sysadmin/config' },
        { id: 'logs', label: 'Nhật ký Hệ thống', icon: Activity, path: '/sysadmin/logs' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-[260px] bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center shadow-lg">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg leading-tight">Core Admin</h1>
                                <p className="text-[10px] text-rose-500 font-semibold tracking-widest uppercase">DriveLinker</p>
                            </div>
                        </div>
                    </div>

                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
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

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B1120]">
                <header className="h-16 border-b border-slate-800 flex items-center px-6 shrink-0 bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Hệ thống quản lý và cấu hình DriveLinker
                    </span>
                </header>
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}