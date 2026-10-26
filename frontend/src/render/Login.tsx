import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, User, Lock, Building2, ArrowRight, AlertCircle } from 'lucide-react';

// === CƠ SỞ DỮ LIỆU GIẢ LẬP (MOCK DATABASE FRONTEND) ===
const DEMO_DB = {
  tenants: [
    { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTA2026' },
    { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTB2026' },
    { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTC2026' },
    { id: 'CORE', name: 'Admin chuẩn bị bảo vệ đồ án', code: 'ADMIN' } // Dành cho System Admin
  ],
  users: [
    { username: 'owner.an', password: '123456', access: { 'COMPANY_A': 'TENANT_ADMIN', 'COMPANY_B': 'TENANT_ADMIN' } },
    { username: 'staff.a', password: '123456', access: { 'COMPANY_A': 'TENANT_STAFF' } },
    { username: 'staff.b', password: '123456', access: { 'COMPANY_B': 'TENANT_STAFF' } },
    { username: 'owner.minh', password: '123456', access: { 'COMPANY_C': 'TENANT_ADMIN' } },
    { username: 'staff.c', password: '123456', access: { 'COMPANY_C': 'TENANT_STAFF' } },
    { username: 'admin', password: '123456', access: { 'CORE': 'SYS_ADMIN' } }
  ]
};
// ======================================================

export default function Login() {
  // khi khởi động lên, dữ liệu sẽ tự mặc định điền vào - demo 
  const [tenantCode, setTenantCode] = useState('CTA2026');
  const [username, setUsername] = useState('owner.an');
  const [password, setPassword] = useState('123456');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Bắt đầu luồng kiểm tra logic Multi-tenant
    setTimeout(() => {
      const codeInput = tenantCode.trim().toUpperCase();
      const userInput = username.trim().toLowerCase();

      // 1. Tìm Doanh nghiệp theo Mã đăng nhập
      const tenant = DEMO_DB.tenants.find(t => t.code === codeInput);
      if (!tenant) {
        setError('Mã đăng nhập doanh nghiệp không tồn tại.');
        setIsLoading(false); return;
      }

      // 2. Tìm Người dùng theo Username
      const user = DEMO_DB.users.find(u => u.username === userInput);
      if (!user) {
        setError('Tài khoản đăng nhập không tồn tại.');
        setIsLoading(false); return;
      }

      // 3. Kiểm tra Mật khẩu
      if (user.password !== password) {
        setError('Sai mật khẩu đăng nhập.');
        setIsLoading(false); return;
      }

      // 4. Kiểm tra Phân quyền (Quyền truy cập của User vào Tenant này)
      const userRoleForTenant = user.access[tenant.id as keyof typeof user.access];
      if (!userRoleForTenant) {
        setError(`Tài khoản "${userInput}" không được phân quyền truy cập vào doanh nghiệp này.`);
        setIsLoading(false); return;
      }

      // 5. Thành công -> Lưu phiên làm việc và Điều hướng
      localStorage.setItem('tenantId', tenant.id);
      localStorage.setItem('tenantCode', tenant.code);
      localStorage.setItem('tenantName', tenant.name);
      localStorage.setItem('username', userInput);
      localStorage.setItem('userRole', userRoleForTenant);

      navigate('/overview');
    }, 600); // Giả lập ping mạng 600ms
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-[#0EA5E9] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 mb-4">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">DriveLinker</h2>
        <p className="mt-2 text-sm text-slate-500 uppercase tracking-widest font-bold">Fleet Intelligence Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mã doanh nghiệp (Company Code)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text" required value={tenantCode} onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] focus:bg-white outline-none transition-all text-sm font-mono uppercase placeholder-slate-400"
                  placeholder="VD: DLA2026"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] focus:bg-white outline-none transition-all text-sm placeholder-slate-400"
                  placeholder="VD: owner.an"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] focus:bg-white outline-none transition-all text-sm placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 mt-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#0EA5E9] hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9] transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Hướng dẫn Test Dữ liệu Ảo */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 font-bold mb-3 uppercase tracking-wider">Dữ liệu Test (Mật khẩu: 123456):</p>
            <div className="space-y-2 text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p>• Mã: <strong className="text-slate-900">CTA2026</strong> | User: <span className="text-emerald-600">owner.an</span> (CTY A)</p>
              <p>• Mã: <strong className="text-slate-900">CTB2026</strong> | User: <span className="text-emerald-600">owner.an</span> (CTY B)</p>
              <p>• Mã: <strong className="text-slate-900">CTC2026</strong> | User: <span className="text-sky-600">staff.c</span> (NV CTY C)</p>
              <p>• Mã: <strong className="text-slate-900">ADMIN</strong> | User: <span className="text-rose-600">admin</span> (Lõi)</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">*Đây là tài khoản demo, dữ liệu thực sẽ được được lên DB</p>
          </div>
        </div>
      </div>
    </div>
  );
}