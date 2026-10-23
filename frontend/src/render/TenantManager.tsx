import { Building, ArrowRight, ShieldCheck, Database, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_TENANTS_DB = [
    { id: 'TENANT_CTYA', name: 'Công ty A', code: 'CTA', users: 12, status: 'Active' },
    { id: 'TENANT_HKDB', name: 'Hộ kinh doanh B', code: 'HKDB', users: 3, status: 'Active' }
];

export default function TenantManager() {
    const navigate = useNavigate();

    // Hàm xử lý logic "Đóng giả" (Impersonation)
    const handleImpersonate = (tenant: any) => {
        localStorage.setItem('tenantId', tenant.id);
        localStorage.setItem('tenantName', tenant.name);
        // Tự động cấp quyền Chủ doanh nghiệp khi hỗ trợ
        localStorage.setItem('userRole', 'TENANT_ADMIN');

        // Đẩy sang Dashboard của khách hàng
        navigate('/dashboard');
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-rose-500 flex items-center gap-2">
                        <Database className="w-6 h-6" /> Quản lý Doanh nghiệp
                    </h1>
                    <p className="text-slate-400 mt-2">Giám sát tài nguyên, cấu hình module và hỗ trợ kỹ thuật khách hàng.</p>
                </div>
                <div className="relative w-72">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Tìm tên công ty, mã KH..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-rose-500" />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {MOCK_TENANTS_DB.map(tenant => (
                        <div key={tenant.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                        <Building className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">{tenant.name}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{tenant.code}</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> {tenant.status}
                                </span>
                            </div>

                            <div className="text-xs text-slate-400 mb-6">
                                Active Users: <strong className="text-slate-200">{tenant.users}</strong>
                            </div>

                            <button
                                onClick={() => handleImpersonate(tenant)}
                                className="mt-auto w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-2"
                            >
                                Truy cập hệ thống <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}