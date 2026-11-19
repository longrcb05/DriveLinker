import { useLanguage } from '../context/LanguageContext';
import fleetImage from '../assets/login-fleet.png';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, User, Building2, AlertCircle,
  Eye, EyeOff, CheckCircle2,
  Loader2, Globe, ChevronRight, HelpCircle, Check, Copy
} from 'lucide-react';

// === CƠ SỞ DỮ LIỆU GIẢ LẬP (MOCK DATABASE FRONTEND) ===
const DEMO_DB = {
  tenants: [
    { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTA2026' },
    { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTB2026' },
    { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTC2026' },
    { id: 'CORE', name: 'Admin chuẩn bị bảo vệ đồ án', code: 'ADMIN' }
  ],
  users: [
    { username: 'owner.an', password: '123456', access: { 'COMPANY_A': 'TENANT_ADMIN', 'COMPANY_B': 'TENANT_ADMIN' } },
    { username: 'staff.a', password: '123456', access: { 'COMPANY_A': 'TENANT_STAFF' } },
    { username: 'staff.b', password: '123456', access: { 'COMPANY_B': 'TENANT_STAFF' } },
    { username: 'owner.c', password: '123456', access: { 'COMPANY_C': 'TENANT_ADMIN' } },
    { username: 'staff.c', password: '123456', access: { 'COMPANY_C': 'TENANT_STAFF' } },
  ]
};
// ======================================================

export default function Login() {
  const { language, toggleLanguage } = useLanguage();

  // Khởi tạo các trường thông tin rỗng - không điền sẵn dữ liệu
  const [tenantCode, setTenantCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoHints, setShowDemoHints] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Đảm bảo các ô nhập luôn rỗng khi mở trang
    setTenantCode('');
    setUsername('');
    setPassword('');

    try {
      const stored = JSON.parse(localStorage.getItem('sys_tenants') || '[]');
      if (stored.length === 0 || stored.some((t: any) => t.code === 'CTYA26')) {
        localStorage.setItem('sys_tenants', JSON.stringify([
          { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTA2026' },
          { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTB2026' },
          { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTC2026' }
        ]));
      }
      // Đồng bộ mật khẩu cho các tài khoản hệ thống (sys_accounts)
      const accounts = JSON.parse(localStorage.getItem('sys_accounts') || '[]');
      if (accounts.length > 0 && accounts.some((a: any) => !a.password)) {
        const fixedAccounts = accounts.map((a: any) => ({ ...a, password: a.password || '123456' }));
        localStorage.setItem('sys_accounts', JSON.stringify(fixedAccounts));
      }
    } catch {
      // ignore
    }
  }, []);

  // Nhận diện Doanh nghiệp realtime khi người dùng nhập mã
  const getMatchedTenant = () => {
    if (!tenantCode || !tenantCode.trim()) return null;
    const code = tenantCode.trim().toUpperCase();
    const stored = JSON.parse(localStorage.getItem('sys_tenants') || '[]');
    let match = DEMO_DB.tenants.find(t => t.code === code) || stored.find((t: any) => t.code === code);
    if (!match) {
      if (code === 'CTA2026' || code === 'CTYA26') match = DEMO_DB.tenants.find(t => t.id === 'COMPANY_A');
      else if (code === 'CTB2026' || code === 'CTYB26') match = DEMO_DB.tenants.find(t => t.id === 'COMPANY_B');
      else if (code === 'CTC2026' || code === 'CTYC26') match = DEMO_DB.tenants.find(t => t.id === 'COMPANY_C');
    }
    return match;
  };
  const matchedTenant = getMatchedTenant();

  const handleCopyHint = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Bắt đầu luồng kiểm tra logic Multi-tenant
    setTimeout(() => {
      const codeInput = tenantCode.trim().toUpperCase();
      const userInput = username.trim().toLowerCase();

      // 1. Tìm Doanh nghiệp theo Mã đăng nhập (ưu tiên DEMO_DB chuẩn và hỗ trợ sys_tenants tùy biến)
      const storedTenants = JSON.parse(localStorage.getItem('sys_tenants') || '[]');

      let tenant = DEMO_DB.tenants.find(t => t.code === codeInput)
        || storedTenants.find((st: any) => st.code === codeInput);

      // Hỗ trợ alias linh hoạt (CTA2026 / CTYA26 -> COMPANY_A)
      if (!tenant) {
        if (codeInput === 'CTA2026' || codeInput === 'CTYA26') {
          tenant = DEMO_DB.tenants.find(t => t.id === 'COMPANY_A') || { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTA2026' };
        } else if (codeInput === 'CTB2026' || codeInput === 'CTYB26') {
          tenant = DEMO_DB.tenants.find(t => t.id === 'COMPANY_B') || { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTB2026' };
        } else if (codeInput === 'CTC2026' || codeInput === 'CTYC26') {
          tenant = DEMO_DB.tenants.find(t => t.id === 'COMPANY_C') || { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTC2026' };
        }
      }
      if (!tenant) {
        setError(language === 'vi' ? 'Mã đăng nhập doanh nghiệp không tồn tại trên hệ thống.' : 'Enterprise login code does not exist.');
        setIsLoading(false);
        return;
      }

      // 2. Tìm Người dùng: Kiểm tra DEMO_DB.users hoặc sys_accounts
      const demoUser = DEMO_DB.users.find(u => u.username === userInput);
      const storedAccounts = JSON.parse(localStorage.getItem('sys_accounts') || '[]');
      const customAccount = storedAccounts.find((a: any) => a.username.toLowerCase() === userInput);

      if (!demoUser && !customAccount) {
        setError(language === 'vi' ? 'Tài khoản người dùng không tồn tại.' : 'User account does not exist.');
        setIsLoading(false);
        return;
      }

      let userRoleForTenant: string | null | undefined = null;

      // ƯU TIÊN 1: Kiểm tra tài khoản Demo chuẩn từ DEMO_DB (mật khẩu mặc định 123456)
      if (demoUser) {
        const validPassword = demoUser.password || '123456';
        if (password !== validPassword && password !== '123456') {
          setError(language === 'vi' ? 'Mật khẩu đăng nhập không chính xác.' : 'Incorrect password.');
          setIsLoading(false);
          return;
        }
        // Kiểm tra xem tài khoản trong sys_accounts có bị Admin khóa hay không
        if (customAccount && customAccount.status === 'LOCKED') {
          setError(language === 'vi' ? 'Tài khoản này đã bị khóa quyền truy cập. Vui lòng liên hệ Quản trị viên.' : 'This account has been locked. Please contact your Administrator.');
          setIsLoading(false);
          return;
        }
        userRoleForTenant = demoUser.access[tenant.id as keyof typeof demoUser.access];
        if (!userRoleForTenant && customAccount) {
          userRoleForTenant = customAccount.role;
        }
        if (!userRoleForTenant) {
          setError(language === 'vi' ? `Tài khoản "${userInput}" không có quyền truy cập vào doanh nghiệp "${tenant.name}".` : `Account "${userInput}" is not authorized for "${tenant.name}".`);
          setIsLoading(false);
          return;
        }
      } else if (customAccount) {
        // Tài khoản nhân sự do Quản lý tạo mới từ trang Cài đặt (Settings)
        const validPassword = customAccount.password || '123456';
        if (password !== validPassword && password !== '123456') {
          setError(language === 'vi' ? 'Mật khẩu đăng nhập không chính xác.' : 'Incorrect password.');
          setIsLoading(false);
          return;
        }
        if (customAccount.status === 'LOCKED') {
          setError(language === 'vi' ? 'Tài khoản này đã bị khóa quyền truy cập. Vui lòng liên hệ Quản trị viên.' : 'This account has been locked. Please contact your Administrator.');
          setIsLoading(false);
          return;
        }
        if (customAccount.tenantId !== tenant.id) {
          setError(language === 'vi' ? `Tài khoản "${userInput}" không thuộc doanh nghiệp "${tenant.name}".` : `Account "${userInput}" does not belong to "${tenant.name}".`);
          setIsLoading(false);
          return;
        }
        userRoleForTenant = customAccount.role;
      }

      if (!userRoleForTenant) {
        setError(language === 'vi' ? 'Không xác định được quyền hạn truy cập của tài khoản.' : 'Unable to determine access role for this account.');
        setIsLoading(false);
        return;
      }

      // Lưu phiên làm việc và Điều hướng
      localStorage.setItem('tenantId', tenant.id);
      localStorage.setItem('tenantCode', tenant.code);
      localStorage.setItem('tenantName', tenant.name);
      localStorage.setItem('username', userInput);
      localStorage.setItem('userRole', userRoleForTenant);

      navigate('/overview');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-900 selection:bg-teal-100 lg:grid lg:grid-cols-2">
      <main className="flex min-h-screen min-w-0 flex-col px-6 py-7 sm:px-12 lg:px-[clamp(2.5rem,6vw,6rem)] lg:py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-3 text-[22px] font-bold tracking-tight text-slate-900"><Truck className="shrink-0 text-teal-700" size={27} aria-hidden="true" /> DriveLinker</div>
            <span className="ml-[39px] block whitespace-nowrap text-[11px] font-semibold tracking-wide text-slate-500">Drive Safe - Arrive Alive</span>
          </div>
          <button type="button" onClick={toggleLanguage} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-600 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 motion-reduce:transition-none" title={language === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}>
            <Globe size={16} aria-hidden="true" />
            <span>{language === 'vi' ? <><strong>VI</strong> / EN</> : <>VI / <strong>EN</strong></>}</span>
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{language === 'vi' ? 'Đăng nhập DriveLinker' : 'Sign in to DriveLinker'}</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">{language === 'vi' ? 'Nhập mã doanh nghiệp và tài khoản của bạn để truy cập bảng điều khiển vận hành.' : 'Enter your enterprise code and authorized account to access your fleet operations.'}</p>
          {error && <div className="mt-7 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-800" role="alert"><AlertCircle size={17} aria-hidden="true" /><p>{error}</p></div>}

          <form className="mt-9 grid gap-6" onSubmit={handleLogin} autoComplete="off">
            <div>
              <div className="group relative">
                <label className="absolute -top-2 left-3 z-10 bg-[#f6f8f7] px-1.5 text-xs font-medium text-slate-600 group-focus-within:text-teal-800" htmlFor="tenant_code_input">{language === 'vi' ? 'Mã doanh nghiệp' : 'Enterprise company code'} *</label>
                <input className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 motion-reduce:transition-none" type="text" name="tenant_code_input" id="tenant_code_input" required value={tenantCode} onChange={(e) => setTenantCode(e.target.value.toUpperCase())} placeholder={language === 'vi' ? 'Ví dụ: CTA2026' : 'e.g. CTA2026'} autoComplete="off" spellCheck={false} />
                <Building2 className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              </div>
              {matchedTenant && <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} aria-hidden="true" /> {matchedTenant.name}</div>}
            </div>
            <div className="group relative">
              <label className="absolute -top-2 left-3 z-10 bg-[#f6f8f7] px-1.5 text-xs font-medium text-slate-600 group-focus-within:text-teal-800" htmlFor="username_input">{language === 'vi' ? 'Tài khoản đăng nhập' : 'Username / Email'} *</label>
              <input className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 motion-reduce:transition-none" type="text" name="username_input" id="username_input" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder={language === 'vi' ? 'Nhập tên tài khoản' : 'Enter username'} autoComplete="off" spellCheck={false} />
              <User className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            </div>
            <div className="group relative">
              <label className="absolute -top-2 left-3 z-10 bg-[#f6f8f7] px-1.5 text-xs font-medium text-slate-600 group-focus-within:text-teal-800" htmlFor="password_input">{language === 'vi' ? 'Mật khẩu' : 'Password'} *</label>
              <input className="h-14 w-full rounded-lg border border-slate-300 bg-white px-4 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 motion-reduce:transition-none" type={showPassword ? 'text' : 'password'} name="password_input" id="password_input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700" aria-label={showPassword ? (language === 'vi' ? 'Ẩn mật khẩu' : 'Hide password') : (language === 'vi' ? 'Hiện mật khẩu' : 'Show password')}>
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <button type="submit" disabled={isLoading} className="mt-1 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
              {isLoading ? <><Loader2 size={17} className="animate-spin" /> {language === 'vi' ? 'Đang xác thực thông tin...' : 'Authenticating...'}</> : (language === 'vi' ? 'Đăng nhập doanh nghiệp' : 'Sign In to Portal')}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200">
            <button type="button" onClick={() => setShowDemoHints(!showDemoHints)} className="flex min-h-14 w-full items-center justify-between gap-3 text-left text-xs font-medium text-slate-600 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 [&>span]:flex [&>span]:items-center [&>span]:gap-2" aria-expanded={showDemoHints}>
              <span><HelpCircle size={15} aria-hidden="true" />{language === 'vi' ? 'Thông tin mẫu phục vụ đánh giá đồ án' : 'Demo account hints for Capstone evaluation'}</span>
              <ChevronRight size={16} className={`shrink-0 transition-transform motion-reduce:transition-none ${showDemoHints ? 'rotate-90' : ''}`} aria-hidden="true" />
            </button>
            {showDemoHints && <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
              <p>{language === 'vi' ? 'Bạn có thể tự nhập một trong các thông tin mẫu sau (mật khẩu chung: 123456):' : 'You can manually enter either of the following demo credentials (password: 123456):'}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 [&_strong]:font-semibold [&_strong]:text-slate-800"><strong>Doanh nghiệp A</strong><div>Mã: <strong>CTA2026</strong></div><div>User: owner.an</div><button type="button" onClick={() => handleCopyHint('CTA2026', 'cta')} className="mt-2 inline-flex min-h-9 items-center gap-1.5 font-medium text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">{copiedKey === 'cta' ? <Check size={13} /> : <Copy size={13} />}{copiedKey === 'cta' ? 'Đã sao chép mã' : 'Sao chép mã'}</button></div>
                <div className="min-w-0 [&_strong]:font-semibold [&_strong]:text-slate-800"><strong>Doanh nghiệp B</strong><div>Mã: <strong>CTB2026</strong></div><div>User: owner.an</div><button type="button" onClick={() => handleCopyHint('CTB2026', 'ctb')} className="mt-2 inline-flex min-h-9 items-center gap-1.5 font-medium text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">{copiedKey === 'ctb' ? <Check size={13} /> : <Copy size={13} />}{copiedKey === 'ctb' ? 'Đã sao chép mã' : 'Sao chép mã'}</button></div>
              </div>
            </div>}
          </div>

        <footer className="mt-4 text-center text-sm leading-6 text-slate-600 [&_a]:font-semibold [&_a]:text-teal-800 [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2">
          {language === 'vi' ? 'Bạn là Quản trị viên hệ thống? ' : 'Are you a System Administrator? '}
          <Link to="/overview/admin/login">{language === 'vi' ? 'Truy cập Admin' : 'Super Admin Portal'}</Link>
        </footer>
        </div>
      </main>
      <div className="relative hidden min-h-screen overflow-hidden lg:block" aria-hidden="true"><img src={fleetImage} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
    </div>
  );
}
