import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Server,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { getAdminAccounts, saveAdminAccounts } from './adminAccounts';
import type { AdminAccount, AdminRole } from './adminAccounts';
import { recordAdminAction } from './adminAudit';

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Quản trị hệ thống',
  SUPPORT_ADMIN: 'Hỗ trợ kỹ thuật',
  BILLING_ADMIN: 'Quản lý thanh toán'
};

const formatLoginDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function AdminLogin() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = useState<AdminAccount[]>(() => {
    try {
      return getAdminAccounts();
    } catch {
      return [];
    }
  })[0];

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const accounts = getAdminAccounts();
      const matched = accounts.find(
        (acc) =>
          (acc.username.toLowerCase() === cleanInput ||
            acc.email.toLowerCase() === cleanInput) &&
          acc.password === password
      );

      if (!matched) {
        setError('Tên đăng nhập hoặc mật khẩu quản trị không chính xác.');
        setIsSubmitting(false);
        return;
      }

      if (matched.status === 'LOCKED') {
        setError(
          `Tài khoản "${matched.username}" hiện đang bị khóa. Vui lòng liên hệ Super Admin để mở khóa.`
        );
        setIsSubmitting(false);
        return;
      }

      // Cập nhật thời điểm đăng nhập cuối vào sys_demo_admin_accounts
      const loginTime = formatLoginDateTime(new Date());
      const updatedAccounts = accounts.map((acc) =>
        acc.username === matched.username ? { ...acc, lastLogin: loginTime } : acc
      );
      saveAdminAccounts(updatedAccounts);

      // Thiết lập đầy đủ 3 khóa sessionStorage đồng bộ với AdminTenantList & AdminAccountList
      sessionStorage.setItem('sys_core_username', matched.username);
      sessionStorage.setItem('sys_core_admin_name', matched.fullName);
      sessionStorage.setItem('sys_core_role', matched.role);

      // Ghi nhật ký đăng nhập vào sys_core_audit_logs thông qua adminAudit.ts
      recordAdminAction(
        'ĐĂNG NHẬP',
        `Đăng nhập cổng quản trị nền tảng (${ROLE_LABELS[matched.role]})`,
        { username: matched.username, fullName: matched.fullName }
      );

      navigate('/overview/admin');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đọc dữ liệu tài khoản quản trị trên trình duyệt.'
      );
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (account: AdminAccount) => {
    setIdentifier(account.username);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang đăng nhập Doanh nghiệp</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-7 pb-5 border-b border-slate-100 bg-slate-50/70 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Server className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SYSTEM CORE GOVERNANCE</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              DriveLinker Admin Login
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đăng nhập cổng quản trị nền tảng, doanh nghiệp và đối soát công nợ.
            </p>
          </div>

          {/* Form đăng nhập */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-identifier"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Tài khoản hoặc Email quản trị
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="VD: adminlong hoặc billing.minh"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Mật khẩu truy cập
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống quản trị'}
            </button>
          </form>

          {/* Danh sách tài khoản mẫu đồng bộ từ adminAccounts.ts */}
          {demoAccounts.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                <span>Tài khoản quản trị (nhấp để điền nhanh)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className="p-2.5 rounded-xl bg-white hover:bg-rose-50/60 border border-slate-200 hover:border-rose-200 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {acc.username}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${acc.status === 'LOCKED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                          }`}
                      >
                        {acc.status === 'LOCKED' ? 'LOCKED' : acc.role.replace('_ADMIN', '')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {acc.fullName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}