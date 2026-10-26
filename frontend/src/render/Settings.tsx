import React, { useState } from 'react';
import {
  Building, Save, MapPin, Video, Key, Loader2, CheckCircle2,
  Users, UserCheck, Shield, Trash2, Plus, Check, Edit2, X, Lock, ShieldAlert
} from 'lucide-react';

// Giả lập gửi Log hệ thống
const addSystemLog = (action: string, target: string, status: string = 'Success') => {
  const currentLogs = JSON.parse(localStorage.getItem('system_logs') || '[]');
  const newLog = {
    id: `LOG-${Date.now()}`, time: new Date().toLocaleString('vi-VN'),
    user: localStorage.getItem('userRole') || 'Unknown', role: localStorage.getItem('userRole') || 'GUEST',
    action, target, status, ip: '192.168.1.45'
  };
  localStorage.setItem('system_logs', JSON.stringify([newLog, ...currentLogs]));
};

// Dữ liệu dùng chung
const MOCK_TENANTS = [
  { id: 'TENANT_CTYA', name: 'Công ty A', code: 'CTA', features: { gps: true, aiCamera: false, maxUsers: 15, requireApproval: true }, users: [{ id: 'u1', name: 'Nguyễn Văn A', email: 'admin@congtya.vn', role: 'TENANT_ADMIN', status: 'Active' }, { id: 'u2', name: 'Trần Thị B', email: 'nhanvien@congtya.vn', role: 'TENANT_STAFF', status: 'Pending' }] },
  { id: 'TENANT_HKDB', name: 'Hộ kinh doanh B', code: 'HKDB', features: { gps: true, aiCamera: true, maxUsers: 2, requireApproval: false }, users: [{ id: 'u3', name: 'Lê Văn C', email: 'chu@hkdb.vn', role: 'TENANT_ADMIN', status: 'Active' }] }
];

// ==========================================
// 1. GIAO DIỆN DÀNH CHO ADMIN HỆ THỐNG (FULL QUYỀN)
// ==========================================
function SysAdminView() {
  const [selectedTenant, setSelectedTenant] = useState(MOCK_TENANTS[0]);
  const [config, setConfig] = useState({ ...selectedTenant.features, code: selectedTenant.code });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelect = (tenant: any) => {
    setSelectedTenant(tenant);
    setConfig({ ...tenant.features, code: tenant.code });
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setIsSaving(true); setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false); setSaveSuccess(true);
      addSystemLog('UPDATE_CONFIG', selectedTenant.name);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="flex gap-6 h-full p-6 bg-[#F8FAFC]">
      {/* CỘT TRÁI: Chọn Doanh nghiệp */}
      <div className="w-[300px] bg-white border border-slate-200 rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Chọn doanh nghiệp</h2>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {MOCK_TENANTS.map(tenant => (
            <button key={tenant.id} onClick={() => handleSelect(tenant)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${selectedTenant.id === tenant.id ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
              <Building className="w-5 h-5 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-sm truncate">{tenant.name}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Mã: {tenant.code}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: Cấu hình */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Cấu hình: {selectedTenant.name}</h2>
            <p className="text-sm text-slate-500">Quyền System Admin: Thay đổi module và giới hạn hệ thống.</p>
          </div>
          <button onClick={handleSave} disabled={isSaving} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu' : 'Lưu cấu hình'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl space-y-8 pb-10">
            {/* MODULE */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Module Hệ thống</h3>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex items-start gap-4">
                <div className="p-2 bg-white rounded-md border border-slate-200"><Key className="w-5 h-5 text-slate-600" /></div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mã đăng nhập (Tenant Code)</label>
                  <input type="text" value={config.code} onChange={(e) => setConfig({ ...config, code: e.target.value })} className="w-full max-w-md bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-800 outline-none focus:border-rose-500 uppercase font-mono text-sm shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md border border-slate-200"><MapPin className="w-5 h-5 text-sky-500" /></div>
                    <h3 className="text-sm font-bold text-slate-700">Định vị (GPS RTK)</h3>
                  </div>
                  <button onClick={() => setConfig({ ...config, gps: !config.gps })} className={`w-10 h-5 rounded-full transition-colors relative ${config.gps ? 'bg-rose-500' : 'bg-slate-300'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${config.gps ? 'left-[22px]' : 'left-[3px]'}`} />
                  </button>
                </div>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md border border-slate-200"><Video className="w-5 h-5 text-emerald-500" /></div>
                    <h3 className="text-sm font-bold text-slate-700">Camera AI (DMS)</h3>
                  </div>
                  <button onClick={() => setConfig({ ...config, aiCamera: !config.aiCamera })} className={`w-10 h-5 rounded-full transition-colors relative ${config.aiCamera ? 'bg-rose-500' : 'bg-slate-300'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${config.aiCamera ? 'left-[22px]' : 'left-[3px]'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* POLICY */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Chính sách Cấp phép</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md border border-slate-200"><Users className="w-5 h-5 text-indigo-500" /></div>
                    <h3 className="text-sm font-bold text-slate-700">Giới hạn tài khoản</h3>
                  </div>
                  <input type="number" min="1" value={config.maxUsers} onChange={(e) => setConfig({ ...config, maxUsers: parseInt(e.target.value) || 1 })} className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-slate-800 outline-none focus:border-rose-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. GIAO DIỆN DÀNH CHO CHỦ NHÀ XE (TENANT_ADMIN)
// ==========================================
function TenantAdminView() {
  const tenantId = localStorage.getItem('tenantId') || 'TENANT_CTYA';
  const currentTenant = MOCK_TENANTS.find(t => t.id === tenantId) || MOCK_TENANTS[0];

  const [users, setUsers] = useState(currentTenant.users);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '' });

  const handleAddUser = () => {
    if (users.length >= currentTenant.features.maxUsers) {
      alert(`Doanh nghiệp của bạn đã đạt giới hạn tối đa ${currentTenant.features.maxUsers} tài khoản.\nVui lòng liên hệ Admin hệ thống để nâng cấp gói dịch vụ.`);
      return;
    }
    const newUser = { id: `u${Date.now()}`, name: 'Nhân viên mới', email: `nv${Math.floor(Math.random() * 100)}@${currentTenant.code.toLowerCase()}.vn`, role: 'TENANT_STAFF', status: 'Active' };
    setUsers([...users, newUser]);
    addSystemLog('CREATE_USER', newUser.email);
  };

  const saveEditUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, name: editData.name, email: editData.email } : u));
    setEditingUserId(null);
  };

  return (
    <div className="h-full overflow-auto bg-[#F8FAFC] p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">

        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Cài đặt Hệ thống</h2>
          <p className="text-sm text-slate-500">Quản lý nhân sự và thông tin hợp đồng của doanh nghiệp bạn.</p>
        </div>

        {/* THÔNG TIN GÓI DỊCH VỤ (READ-ONLY) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-4 h-4" /> Dịch vụ đang sử dụng
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${currentTenant.features.gps ? 'bg-sky-50 border-sky-100 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <MapPin className="w-5 h-5 mb-2" />
              <p className="font-bold text-sm">Bản đồ GPS RTK</p>
              <p className="text-xs mt-1">{currentTenant.features.gps ? 'Đang hoạt động' : 'Chưa đăng ký'}</p>
            </div>
            <div className={`p-4 rounded-lg border ${currentTenant.features.aiCamera ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <Video className="w-5 h-5 mb-2" />
              <p className="font-bold text-sm">Camera AI (DMS)</p>
              <p className="text-xs mt-1">{currentTenant.features.aiCamera ? 'Đang hoạt động' : 'Chưa đăng ký'}</p>
            </div>
            <div className="p-4 rounded-lg border bg-indigo-50 border-indigo-100 text-indigo-700">
              <Users className="w-5 h-5 mb-2" />
              <p className="font-bold text-sm">Giới hạn nhân sự</p>
              <p className="text-xs mt-1">Tối đa {currentTenant.features.maxUsers} tài khoản</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">Để thay đổi gói dịch vụ, vui lòng liên hệ bộ phận hỗ trợ của DriveLinker.</p>
        </div>

        {/* QUẢN LÝ NHÂN SỰ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0EA5E9]" /> Quản lý Nhân viên & Phân quyền
              </h3>
              <p className="text-xs text-slate-500 mt-1">Đã dùng: {users.length} / {currentTenant.features.maxUsers} tài khoản</p>
            </div>
            <button onClick={handleAddUser} className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Thêm nhân viên
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Nhân sự</th>
                <th className="px-6 py-4">Quyền truy cập</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="border border-slate-300 rounded px-2 py-1 text-xs focus:border-[#0EA5E9] outline-none" />
                        <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="border border-slate-300 rounded px-2 py-1 text-xs focus:border-[#0EA5E9] outline-none" />
                      </div>
                    ) : (
                      <><div className="font-bold text-slate-800">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select value={user.role} onChange={e => setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value } : u))} disabled={editingUserId === user.id} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1.5 outline-none focus:border-[#0EA5E9]">
                      <option value="TENANT_ADMIN">Tenant Admin</option>
                      <option value="TENANT_STAFF">Tenant Staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'Active' ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Hoạt động</span> : <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Chờ duyệt</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUserId === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveEditUser(user.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Lưu"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingUserId(null)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded" title="Hủy"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingUserId(user.id); setEditData({ name: user.name, email: user.email }) }} className="p-1.5 text-slate-400 hover:text-[#0EA5E9] hover:bg-sky-50 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (window.confirm('Xóa nhân viên này?')) setUsers(users.filter(u => u.id !== user.id)) }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 3. ĐIỀU HƯỚNG QUYỀN (RBAC WRAPPER)
// ==========================================
export default function Settings() {
  const userRole = localStorage.getItem('userRole') || 'TENANT_STAFF';

  // 1. Quản trị hệ thống (System Admin)
  if (userRole === 'SYS_ADMIN') {
    return <SysAdminView />;
  }

  // 2. Chủ doanh nghiệp (Tenant Admin)
  if (userRole === 'TENANT_ADMIN') {
    return <TenantAdminView />;
  }

  // 3. Nhân viên bình thường (Tenant Staff) - Cấm truy cập
  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Khu vực Giới hạn</h2>
        <p className="text-sm text-slate-500">Tài khoản cấp nhân viên (Staff) không có thẩm quyền truy cập cấu hình hệ thống. Vui lòng liên hệ cấp quản lý nếu bạn cần hỗ trợ.</p>
      </div>
    </div>
  );
}