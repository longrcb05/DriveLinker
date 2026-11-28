import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  getAdminAccounts,
  saveAdminAccounts,
  formatLastLogin
} from './adminAccounts';
import { recordAdminAction } from './adminAudit';
import type { AdminAccount, AdminRole } from './adminAccounts';
import { ArrowLeft, Search, ShieldCheck, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

type ExtendedAdminAccount = AdminAccount & {
  phone?: string;
  status?: 'ACTIVE' | 'LOCKED';
};

const roleNames: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Quản trị hệ thống',
  SUPPORT_ADMIN: 'Hỗ trợ kỹ thuật',
  BILLING_ADMIN: 'Quản lý thanh toán',
};

const PLATFORM_SYNC_EVENT_NAME = 'sys_platform_sync_v1';

const emitPlatformSync = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PLATFORM_SYNC_EVENT_NAME));
    }
  } catch {
    // Bỏ qua nếu môi trường không hỗ trợ window hoặc Event
  }
};

const isAccountLocked = (account: ExtendedAdminAccount): boolean => {
  if (typeof account.isLocked === 'boolean') return account.isLocked;
  return account.status === 'LOCKED';
};

interface AdminAccountListProps {
  embedded?: boolean;
}

export default function AdminAccountList({ embedded = false }: AdminAccountListProps) {
  const { language, toggleLanguage } = useLanguage();
  const [accounts, setAccounts] = useState<ExtendedAdminAccount[]>(() => {
    try { return getAdminAccounts() as ExtendedAdminAccount[]; } catch { return []; }
  });
  const [error, setError] = useState(() => {
    try { getAdminAccounts(); return ''; } catch { return 'Không thể đọc dữ liệu tài khoản mẫu trên trình duyệt.'; }
  });
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'SUPPORT_ADMIN' as AdminRole,
    password: ''
  });
  const currentUsername = sessionStorage.getItem('sys_core_username');
  const isSuperAdmin = sessionStorage.getItem('sys_core_role') === 'SUPER_ADMIN';
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    const syncAccounts = () => {
      try {
        setAccounts(getAdminAccounts() as ExtendedAdminAccount[]);
      } catch {
        // Giữ danh sách hiện tại nếu không đọc được
      }
    };

    window.addEventListener(PLATFORM_SYNC_EVENT_NAME, syncAccounts);
    window.addEventListener('storage', syncAccounts);
    return () => {
      window.removeEventListener(PLATFORM_SYNC_EVENT_NAME, syncAccounts);
      window.removeEventListener('storage', syncAccounts);
    };
  }, []);
// Tìm tài khoản theo thông tin cá nhân và lọc theo vai trò, trạng thái.
  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return accounts.filter((account) => {
      const locked = isAccountLocked(account);
      const currentStatus = locked ? 'LOCKED' : 'ACTIVE';
      const matchesQuery = [
        account.fullName,
        account.username,
        account.email,
        account.phone || ''
      ].some((value) => value.toLocaleLowerCase('vi').includes(query));

      return (
        matchesQuery &&
        (role === 'ALL' || account.role === role) &&
        (status === 'ALL' || currentStatus === status)
      );
    });
  }, [accounts, search, role, status]);

  const commit = (next: ExtendedAdminAccount[], message: string) => {
    try {
      getAdminAccounts();
      saveAdminAccounts(next as AdminAccount[]);
      setAccounts(next);
      setError('');
      setNotice(message);
      emitPlatformSync();
      return true;
    } catch {
      setError('Không thể lưu thay đổi trên trình duyệt. Vui lòng thử lại.');
      return false;
    }
  };
// Kiểm tra thông tin và thêm tài khoản admin mới.
  const addAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!form.fullName.trim() || !username || !form.email.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin tài khoản.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      setError('Username chỉ được chứa chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (accounts.some((item) => item.username.toLowerCase() === username || item.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError('Username hoặc email đã tồn tại.');
      return;
    }

    const cleanPhone = form.phone.trim();
    const account: ExtendedAdminAccount = {
      id: `adm-${Date.now()}`,
      username,
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: cleanPhone,
      role: form.role,
      isLocked: false,
      lastLogin: 'Chưa đăng nhập'
    };

    if (commit([...accounts, account], 'Đã thêm tài khoản ' + username + '.')) {
      recordAdminAction('THÊM MỚI', `Tạo tài khoản ${username} • ${form.role}`);
      emitPlatformSync();
      setForm({ fullName: '', username: '', email: '', phone: '', role: 'SUPPORT_ADMIN', password: '' });
      setShowAdd(false);
    }
  };
// Cho phép Super Admin khóa hoặc mở khóa tài khoản dưới quyền.
  const toggleLock = (account: ExtendedAdminAccount) => {
    if (sessionStorage.getItem('sys_core_role') !== 'SUPER_ADMIN') {
      setError('Chỉ Super Admin có quyền khóa hoặc mở khóa tài khoản.');
      return;
    }
    if (account.role === 'SUPER_ADMIN') {
      setError('Các tài khoản Super Admin không thể khóa hoặc mở khóa tài khoản của nhau.');
      return;
    }
    if (account.username === currentUsername) {
      setError('Bạn không thể khóa tài khoản đang đăng nhập.');
      return;
    }

    const currentlyLocked = isAccountLocked(account);
    const nextLocked = !currentlyLocked;
    if (!window.confirm(`${nextLocked ? 'Khóa' : 'Mở khóa'} tài khoản ${account.username}?`)) return;

    const nextAccounts = accounts.map((item) =>
      item.username === account.username
        ? { ...item, isLocked: nextLocked }
        : item
    );

    if (commit(nextAccounts, `Đã ${nextLocked ? 'khóa' : 'mở khóa'} tài khoản ${account.username}.`)) {
      recordAdminAction(nextLocked ? 'KHÓA' : 'MỞ KHÓA', `Tài khoản ${account.username}`);
      emitPlatformSync();
    }
  };
// Kiểm tra mật khẩu hiện tại trước khi lưu mật khẩu mới.
  const changePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const signedInUsername = sessionStorage.getItem('sys_core_username');
    if (!signedInUsername || passwordTarget !== signedInUsername) {
      setError('Bạn chỉ có thể đổi mật khẩu của chính mình.');
      return;
    }
    let latestAccounts: ExtendedAdminAccount[];
    try {
      latestAccounts = getAdminAccounts();
    } catch {
      setError('Không thể đọc dữ liệu tài khoản trên trình duyệt.');
      return;
    }
    const account = latestAccounts.find(item => item.username === signedInUsername);
    if (!account || account.password !== currentPassword) {
      setError('Mật khẩu hiện tại không chính xác.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (commit(latestAccounts.map((item) => item.username === passwordTarget ? { ...item, password: newPassword } : item), `Đã đổi mật khẩu cho ${passwordTarget}.`)) {
      recordAdminAction('ĐỔI MẬT KHẨU', `Đổi mật khẩu tài khoản ${signedInUsername}`);
      emitPlatformSync();
      setPasswordTarget(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const controlClass = 'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500';

  const content = (
    <div className={embedded ? 'w-full' : 'mx-auto max-w-6xl'}>
      {!embedded && (
        <Link to="/overview/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Quay lại doanh nghiệp
        </Link>
      )}
      <div className={`${embedded ? '' : 'mt-5'} flex flex-wrap items-start justify-between gap-4`}>
        {!embedded && <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><Users className="h-7 w-7 text-rose-600" aria-hidden="true" /> Tài khoản Admin</h1>
          <p className="mt-2 text-sm text-slate-600">Danh sách tài khoản quản trị hệ thống và thông tin truy cập.</p>
        </div>}
        <div className="flex flex-wrap items-center gap-3">
          {!embedded && (
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-11 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title={language === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
            >
              <Globe className="h-4 w-4 text-rose-600" />
              <span>{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>
          )}
          <button type="button" onClick={() => { setShowAdd(!showAdd); setPasswordTarget(null); setError(''); setNotice(''); }} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer">{showAdd ? 'Đóng biểu mẫu' : 'Thêm tài khoản'}</button>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {showAdd && <form onSubmit={addAccount} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Thêm tài khoản Admin</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Họ tên<input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={`${controlClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Username<input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={`${controlClass} mt-1`} autoComplete="off" /></label>
          <label className="text-sm font-semibold">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${controlClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Số điện thoại<input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`${controlClass} mt-1`} /></label>
          <label className="text-sm font-semibold">Vai trò<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AdminRole })} className={`${controlClass} mt-1`}><option value="SUPER_ADMIN">Super Admin</option><option value="SUPPORT_ADMIN">Support Admin</option><option value="BILLING_ADMIN">Billing Admin</option></select></label>
          <label className="text-sm font-semibold">Mật khẩu · Tối thiểu 6 ký tự<input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${controlClass} mt-1`} autoComplete="new-password" /></label>
        </div><div className="mt-5 flex gap-3"><button type="submit" className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">Lưu tài khoản</button><button type="button" onClick={() => { setShowAdd(false); setError(''); }} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Hủy</button></div>
      </form>}
      {passwordTarget && <form onSubmit={changePassword} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Đổi mật khẩu: {passwordTarget}</h2>
        <label className="mt-4 block text-sm font-semibold">Mật khẩu hiện tại<input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" className={`${controlClass} mt-1`} /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Mật khẩu mới · Tối thiểu 6 ký tự<input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" className={`${controlClass} mt-1`} /></label><label className="text-sm font-semibold">Xác nhận mật khẩu<input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" className={`${controlClass} mt-1`} /></label></div>
        <div className="mt-5 flex gap-3"><button type="submit" className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">Lưu mật khẩu</button><button type="button" onClick={() => { setPasswordTarget(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); }} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Hủy</button></div>
      </form>}
      <div className="mt-7 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách tài khoản</h2>
              <p className="mt-1 text-sm text-slate-600">{filteredAccounts.length} / {accounts.length} tài khoản</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px_180px]">
            <div><label htmlFor="admin-search" className="mb-1.5 block text-sm font-semibold text-slate-700">Tìm kiếm</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" /><input id="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, username, email hoặc số điện thoại" className={`${controlClass} pl-10`} /></div></div>
            <div><label htmlFor="admin-role" className="mb-1.5 block text-sm font-semibold text-slate-700">Vai trò</label><select id="admin-role" value={role} onChange={(event) => setRole(event.target.value)} className={controlClass}><option value="ALL">Tất cả vai trò</option><option value="SUPER_ADMIN">Super Admin</option><option value="SUPPORT_ADMIN">Support Admin</option><option value="BILLING_ADMIN">Billing Admin</option></select></div>
            <div><label htmlFor="admin-status" className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</label><select id="admin-status" value={status} onChange={(event) => setStatus(event.target.value)} className={controlClass}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600"><tr><th scope="col" className="px-5 py-4">Tài khoản</th><th scope="col" className="px-5 py-4">Liên hệ</th><th scope="col" className="px-5 py-4">Vai trò</th><th scope="col" className="px-5 py-4">Trạng thái</th><th scope="col" className="px-5 py-4">Đăng nhập cuối</th><th scope="col" className="px-5 py-4">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((account) => {
                const locked = isAccountLocked(account);
                return (
                  <tr key={account.username} className="align-top">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{account.fullName}</div><div className="mt-1 text-slate-600">{account.username}</div></td>
                    <td className="px-5 py-4"><div>{account.email}</div><div className="mt-1 text-slate-600">{account.phone || '--'}</div></td>
                    <td className="px-5 py-4"><div className="font-medium">{roleNames[account.role]}</div><div className="mt-1 text-xs text-slate-600">{account.role}</div></td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${!locked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{!locked ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatLastLogin(account.lastLogin)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        {isSuperAdmin && account.username !== currentUsername && account.role !== 'SUPER_ADMIN' && (
                          <button type="button" onClick={() => toggleLock(account)} className="text-sm font-semibold text-rose-700 underline underline-offset-2 cursor-pointer">
                            {!locked ? 'Khóa' : 'Mở khóa'}
                          </button>
                        )}
                        {isSuperAdmin && account.role === 'SUPER_ADMIN' && account.username !== currentUsername && (
                          <span className="text-xs text-slate-400">Không thể khóa</span>
                        )}
                        {account.username === currentUsername && (
                          <button type="button" onClick={() => { setPasswordTarget(account.username); setShowAdd(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); setNotice(''); }} className="whitespace-nowrap text-sm font-semibold text-slate-700 underline underline-offset-2 cursor-pointer">
                            Đổi mật khẩu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAccounts.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-600">Không tìm thấy tài khoản phù hợp. Hãy thử thay đổi điều kiện lọc.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-8 sm:py-8">
      {content}
    </main>
  );
}
