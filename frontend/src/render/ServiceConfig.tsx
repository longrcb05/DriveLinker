import { useState } from 'react';
import {
    Building, Save, MapPin, Video, Key, Loader2, CheckCircle2,
    Users, UserCheck, Shield, Trash2, Plus, Check, Edit2, X
} from 'lucide-react';

// Hàm gửi Log toàn cục
const addSystemLog = (action: string, target: string, status: string = 'Success') => {
    const currentLogs = JSON.parse(localStorage.getItem('system_logs') || '[]');
    const newLog = {
        id: `LOG-${Date.now()}`,
        time: new Date().toLocaleString('vi-VN'),
        user: 'admin',
        role: 'SYS_ADMIN',
        action,
        target,
        status,
        ip: '192.168.1.45'
    };
    localStorage.setItem('system_logs', JSON.stringify([newLog, ...currentLogs]));
};

const MOCK_TENANTS = [
    { id: 'TENANT_CTYA', name: 'Công ty A', code: 'CTA', features: { gps: true, aiCamera: false, maxUsers: 15, requireApproval: true }, users: [{ id: 'u1', name: 'Nguyễn Văn A', email: 'admin@congtya.vn', role: 'TENANT_ADMIN', status: 'Active' }, { id: 'u2', name: 'Trần Thị B', email: 'nhanvien@congtya.vn', role: 'TENANT_STAFF', status: 'Pending' }] },
    { id: 'TENANT_HKDB', name: 'Hộ kinh doanh B', code: 'HKDB', features: { gps: true, aiCamera: true, maxUsers: 2, requireApproval: false }, users: [{ id: 'u3', name: 'Lê Văn C', email: 'chu@hkdb.vn', role: 'TENANT_ADMIN', status: 'Active' }] }
];

export default function ServiceConfig() {
    const [selectedTenant, setSelectedTenant] = useState(MOCK_TENANTS[0]);

    const [config, setConfig] = useState({
        code: selectedTenant.code,
        gps: selectedTenant.features.gps,
        aiCamera: selectedTenant.features.aiCamera,
        maxUsers: selectedTenant.features.maxUsers,
        requireApproval: selectedTenant.features.requireApproval
    });

    const [tenantUsers, setTenantUsers] = useState(selectedTenant.users);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editUserData, setEditUserData] = useState({ name: '', email: '' });

    const handleSelect = (tenant: any) => {
        setSelectedTenant(tenant);
        setConfig({ code: tenant.code, gps: tenant.features.gps, aiCamera: tenant.features.aiCamera, maxUsers: tenant.features.maxUsers, requireApproval: tenant.features.requireApproval });
        setTenantUsers(tenant.users);
        setSaveSuccess(false);
        setEditingUserId(null);
    };

    const handleSave = () => {
        setIsSaving(true);
        setSaveSuccess(false);
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            // Đẩy log cập nhật cấu hình
            addSystemLog('UPDATE_CONFIG', selectedTenant.name);
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 800);
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        setTenantUsers(tenantUsers.map(user => user.id === userId ? { ...user, role: newRole } : user));
    };

    const handleApproveUser = (userId: string, email: string) => {
        setTenantUsers(tenantUsers.map(user => user.id === userId ? { ...user, status: 'Active' } : user));
        addSystemLog('APPROVE_USER', `${email} (${selectedTenant.code})`);
    };

    const handleDeleteUser = (userId: string, userName: string, email: string) => {
        if (window.confirm(`Xóa tài khoản "${userName}"?`)) {
            setTenantUsers(tenantUsers.filter(user => user.id !== userId));
            addSystemLog('DELETE_USER', `${email} (${selectedTenant.code})`);
        }
    };

    const handleAddUser = () => {
        if (tenantUsers.length >= config.maxUsers) {
            alert(`Đã đạt giới hạn ${config.maxUsers} tài khoản!`);
            return;
        }
        const newEmail = `user${Math.floor(Math.random() * 1000)}@${config.code.toLowerCase()}.vn`;
        const newUser = {
            id: `u${Date.now()}`,
            name: 'Nhân sự mới',
            email: newEmail,
            role: 'TENANT_STAFF',
            status: config.requireApproval ? 'Pending' : 'Active'
        };
        setTenantUsers([...tenantUsers, newUser]);
        addSystemLog('CREATE_USER', `${newEmail} (${selectedTenant.code})`);
    };

    const startEditUser = (user: any) => {
        setEditingUserId(user.id);
        setEditUserData({ name: user.name, email: user.email });
    };

    const saveEditUser = (userId: string) => {
        setTenantUsers(tenantUsers.map(user => user.id === userId ? { ...user, name: editUserData.name, email: editUserData.email } : user));
        setEditingUserId(null);
    };

    return (
        <div className="flex gap-6 h-full">
            <div className="w-[300px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                    <h2 className="font-bold text-slate-200">Chọn doanh nghiệp</h2>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                    {MOCK_TENANTS.map(tenant => (
                        <button key={tenant.id} onClick={() => handleSelect(tenant)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${selectedTenant.id === tenant.id ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}>
                            <Building className="w-5 h-5 shrink-0" />
                            <div className="truncate">
                                <p className="font-medium text-sm text-slate-200 truncate">{tenant.name}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-70">Mã: {tenant.code}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CỘT PHẢI: Fix lỗi tràn layout bằng cách chia rõ Header và Body */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">

                {/* HEADER CỐ ĐỊNH */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 shrink-0 z-20 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Cấu hình: {selectedTenant.name}</h2>
                        <p className="text-sm text-slate-400">Điều chỉnh module hệ thống, định danh và tài khoản</p>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'} ${isSaving ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Đang cập nhật...' : saveSuccess ? 'Đã lưu cấu hình' : 'Lưu cấu hình'}
                    </button>
                </div>

                {/* PHẦN CUỘN NỘI DUNG */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl space-y-8 pb-10">

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Module Hệ thống</h3>
                            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex items-start gap-4">
                                <div className="p-2 bg-slate-800 rounded-md"><Key className="w-5 h-5 text-slate-300" /></div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-200 mb-1">Mã đăng nhập (Tenant Code)</label>
                                    <p className="text-xs text-slate-500 mb-3">Mã định danh duy nhất dùng để truy xuất dữ liệu công ty.</p>
                                    <input type="text" value={config.code} onChange={(e) => setConfig({ ...config, code: e.target.value })} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500 transition-colors uppercase font-mono text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-800 rounded-md"><MapPin className="w-5 h-5 text-sky-400" /></div>
                                        <div><h3 className="text-sm font-bold text-slate-200 mb-1">Định vị (GPS RTK)</h3></div>
                                    </div>
                                    <button onClick={() => setConfig({ ...config, gps: !config.gps })} className={`w-10 h-5 rounded-full transition-colors relative ${config.gps ? 'bg-rose-600' : 'bg-slate-700'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${config.gps ? 'left-[22px]' : 'left-[3px]'}`} />
                                    </button>
                                </div>
                                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-slate-800 rounded-md"><Video className="w-5 h-5 text-emerald-400" /></div>
                                        <div><h3 className="text-sm font-bold text-slate-200 mb-1">Camera AI (DMS)</h3></div>
                                    </div>
                                    <button onClick={() => setConfig({ ...config, aiCamera: !config.aiCamera })} className={`w-10 h-5 rounded-full transition-colors relative ${config.aiCamera ? 'bg-rose-600' : 'bg-slate-700'}`}>
                                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${config.aiCamera ? 'left-[22px]' : 'left-[3px]'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Chính sách Tài khoản</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 bg-slate-800 rounded-md"><Users className="w-5 h-5 text-indigo-400" /></div>
                                        <div><h3 className="text-sm font-bold text-slate-200 mb-1">Giới hạn số lượng tài khoản</h3><p className="text-[11px] text-slate-500">Giới hạn số lượng nhân viên.</p></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="number" min="1" value={config.maxUsers} onChange={(e) => setConfig({ ...config, maxUsers: parseInt(e.target.value) || 1 })} className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-rose-500 text-center font-bold" />
                                        <span className="text-sm text-slate-400">Tài khoản</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 bg-slate-800 rounded-md"><UserCheck className="w-5 h-5 text-amber-400" /></div>
                                        <div><h3 className="text-sm font-bold text-slate-200 mb-1">Kiểm duyệt đăng nhập</h3><p className="text-[11px] text-slate-500">Tài khoản mới cần phê duyệt.</p></div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={() => setConfig({ ...config, requireApproval: !config.requireApproval })} className={`w-12 h-6 rounded-full transition-colors relative ${config.requireApproval ? 'bg-rose-600' : 'bg-slate-700'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${config.requireApproval ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Shield className="w-4 h-4 text-rose-500" /> Quản lý & Phân quyền</h3>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tenantUsers.length >= config.maxUsers ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>Đã dùng: {tenantUsers.length} / {config.maxUsers}</span>
                                </div>
                                <button onClick={handleAddUser} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Thêm tài khoản</button>
                            </div>

                            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 w-[40%]">Nhân sự</th>
                                            <th className="px-5 py-3">Vai trò (Role)</th>
                                            <th className="px-5 py-3">Trạng thái</th>
                                            <th className="px-5 py-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {tenantUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    {editingUserId === user.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <input type="text" value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:border-rose-500 outline-none" placeholder="Tên nhân sự" />
                                                            <input type="email" value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:border-rose-500 outline-none" placeholder="Email/Username" />
                                                        </div>
                                                    ) : (
                                                        <><div className="font-bold text-slate-200">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={editingUserId === user.id} className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer disabled:opacity-50">
                                                        <option value="TENANT_ADMIN">Tenant Admin</option>
                                                        <option value="TENANT_STAFF">Tenant Staff</option>
                                                    </select>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {user.status === 'Active' ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">Đã Duyệt</span> : <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">Chờ Duyệt</span>}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {editingUserId === user.id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => saveEditUser(user.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors" title="Lưu"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => setEditingUserId(null)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors" title="Hủy"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            {user.status === 'Pending' && <button onClick={() => handleApproveUser(user.id, user.email)} className="text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">Duyệt</button>}
                                                            <button onClick={() => startEditUser(user)} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors" title="Sửa thông tin"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteUser(user.id, user.name, user.email)} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors" title="Xóa tài khoản"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {tenantUsers.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Doanh nghiệp này chưa có tài khoản nào.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}