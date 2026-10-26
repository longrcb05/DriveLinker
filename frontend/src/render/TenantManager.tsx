import { useState } from 'react';
import { Building, ArrowRight, ShieldCheck, Database, Search, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const addSystemLog = (action: string, target: string, status: string = 'Success') => {
    const currentLogs = JSON.parse(localStorage.getItem('system_logs') || '[]');
    const newLog = {
        id: `LOG-${Date.now()}`, time: new Date().toLocaleString('vi-VN'),
        user: 'admin', role: 'SYS_ADMIN', action, target, status, ip: '192.168.1.45'
    };
    localStorage.setItem('system_logs', JSON.stringify([newLog, ...currentLogs]));
};

const INITIAL_TENANTS = [
    { id: 'COMPANY_A', name: 'Demo Công ty A', code: 'CTA2026', users: 12, status: 'Active' },
    { id: 'COMPANY_B', name: 'Demo Công ty B', code: 'CTB2026', users: 3, status: 'Active' },
    { id: 'COMPANY_C', name: 'Demo Công ty C', code: 'CTC2026', users: 5, status: 'Active' }
];

export default function TenantManager() {
    const [tenants, setTenants] = useState(INITIAL_TENANTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', status: 'Active' });

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleImpersonate = (tenant: any) => {
        localStorage.setItem('tenantId', tenant.id);
        localStorage.setItem('tenantName', tenant.name);
        localStorage.setItem('tenantCode', tenant.code);
        localStorage.setItem('userRole', 'TENANT_ADMIN');

        // Ép tải lại trang thay vì dùng navigate để làm mới Sidebar
        window.location.href = '/overview';
    };

    const openAddModal = () => {
        setEditingTenantId(null);
        setFormData({ name: '', code: '', status: 'Active' });
        setIsModalOpen(true);
    };

    const openEditModal = (tenant: any) => {
        setEditingTenantId(tenant.id);
        setFormData({ name: tenant.name, code: tenant.code, status: tenant.status });
        setIsModalOpen(true);
    };

    const saveTenant = () => {
        if (!formData.name || !formData.code) return alert("Vui lòng điền đủ Tên và Mã công ty");
        if (editingTenantId) {
            setTenants(tenants.map(t => t.id === editingTenantId ? { ...t, ...formData } : t));
            addSystemLog('UPDATE_TENANT', formData.name);
        } else {
            const newTenant = { id: `TENANT_${Date.now()}`, name: formData.name, code: formData.code.toUpperCase(), users: 0, status: formData.status };
            setTenants([newTenant, ...tenants]);
            addSystemLog('CREATE_TENANT', formData.name);
        }
        setIsModalOpen(false);
    };

    const deleteTenant = (id: string, name: string) => {
        if (window.confirm(`Xác nhận xóa vĩnh viễn doanh nghiệp "${name}"?`)) {
            setTenants(tenants.filter(t => t.id !== id));
            addSystemLog('DELETE_TENANT', name);
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white h-full flex flex-col relative">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-rose-500 flex items-center gap-2"><Database className="w-6 h-6" /> Quản lý Doanh nghiệp</h1>
                    <p className="text-slate-400 mt-2">Giám sát tài nguyên, cấu hình module và hỗ trợ kỹ thuật khách hàng.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-72">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Tìm tên công ty, mã KH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-rose-500" />
                        </div>
                        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm">Tìm kiếm</button>
                    </div>
                    <div className="w-px h-8 bg-slate-800 mx-2"></div>
                    <button onClick={openAddModal} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Thêm doanh nghiệp</button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTenants.map(tenant => (
                        <div key={tenant.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800"><Building className="w-5 h-5 text-slate-400" /></div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">{tenant.name}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{tenant.code}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEditModal(tenant)} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deleteTenant(tenant.id, tenant.name)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded"><Trash2 className="w-4 h-4" /></button>
                                    <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tenant.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}><ShieldCheck className="w-3 h-3" /> {tenant.status}</span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 mb-6">Active Users: <strong className="text-slate-200">{tenant.users}</strong></div>
                            <button onClick={() => handleImpersonate(tenant)} className="mt-auto w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                                Truy cập hệ thống <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                            <h2 className="font-bold text-white text-lg">{editingTenantId ? 'Sửa thông tin doanh nghiệp' : 'Thêm doanh nghiệp mới'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tên công ty</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500" placeholder="Vd: Công ty Vận tải A" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mã định danh (Code)</label>
                                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500 font-mono uppercase" placeholder="Vd: CTA" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 cursor-pointer">
                                    <option value="Active">Hoạt động</option>
                                    <option value="Expired">Hết hạn</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Hủy</button>
                            <button onClick={saveTenant} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Save className="w-4 h-4" /> Lưu thông tin</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}