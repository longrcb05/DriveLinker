import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, User, Lock, Building2, ArrowRight, AlertCircle,
  Eye, EyeOff, ShieldCheck, Activity, Cpu, Sparkles, CheckCircle2, Loader2, Globe
} from 'lucide-react';

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
    { username: 'owner.c', password: '123456', access: { 'COMPANY_C': 'TENANT_ADMIN' } },
    { username: 'staff.c', password: '123456', access: { 'COMPANY_C': 'TENANT_STAFF' } },
  ]
};
// ======================================================

export default function Login() {
  const { language, toggleLanguage, t } = useLanguage();
  // Khi khởi động lên, dữ liệu sẽ tự mặc định điền vào để tiện demo
  const [tenantCode, setTenantCode] = useState('CTA2026');
  const [username, setUsername] = useState('owner.an');
  const [password, setPassword] = useState('123456');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  // Hàm hỗ trợ điền nhanh tài khoản demo 1-Click
  const applyPreset = (code: string, user: string, pass: string = '123456') => {
    setTenantCode(code);
    setUsername(user);
    setPassword(pass);
    setError(null);
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
        setError(language === 'vi' ? 'Mã đăng nhập doanh nghiệp không tồn tại.' : 'Company login code does not exist.');
        setIsLoading(false);
        return;
      }

      // 2. Tìm Người dùng: Kiểm tra DEMO_DB.users hoặc sys_accounts
      const demoUser = DEMO_DB.users.find(u => u.username === userInput);
      const storedAccounts = JSON.parse(localStorage.getItem('sys_accounts') || '[]');
      const customAccount = storedAccounts.find((a: any) => a.username.toLowerCase() === userInput);

      if (!demoUser && !customAccount) {
        setError(language === 'vi' ? 'Tài khoản đăng nhập không tồn tại.' : 'User account does not exist.');
        setIsLoading(false);
        return;
      }

      let userRoleForTenant: string | null | undefined = null;

      // ƯU TIÊN 1: Kiểm tra tài khoản Demo chuẩn từ DEMO_DB (mật khẩu mặc định 123456)
      if (demoUser) {
        const validPassword = demoUser.password || '123456';
        if (password !== validPassword && password !== '123456') {
          setError(language === 'vi' ? 'Sai mật khẩu đăng nhập.' : 'Incorrect password.');
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
          setError(language === 'vi' ? `Tài khoản "${userInput}" không được phân quyền truy cập vào doanh nghiệp này.` : `Account "${userInput}" is not authorized for this enterprise.`);
          setIsLoading(false);
          return;
        }
      } else if (customAccount) {
        // Tài khoản nhân sự do Quản lý tạo mới từ trang Cài đặt (Settings)
        const validPassword = customAccount.password || '123456';
        if (password !== validPassword && password !== '123456') {
          setError(language === 'vi' ? 'Sai mật khẩu đăng nhập.' : 'Incorrect password.');
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
    <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-sky-500 selection:text-white">

      {/* =========================================================
          CỘT TRÁI: SHOWCASE GIỚI THIỆU HỆ THỐNG & BRANDING (DESKTOP)
          ========================================================= */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-[#0A192F] to-[#041E38] border-r border-slate-800/60">

        {/* Ambient Glow & Grid Pattern Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Platform Identity */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-sky-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 ring-1 ring-white/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                DriveLinker
                <span className="text-[10px] uppercase font-bold tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">Pro</span>
              </span>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Fleet Intelligence System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {language === 'vi' ? 'Hệ thống trực tuyến' : 'System Online'}
          </div>
        </div>

        {/* Middle: Hero Illustration & Core Value Pillars */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'vi' ? 'Nền tảng Quản lý & Giám sát đội xe Thông minh' : 'Smart Fleet Management & Telematics Platform'}
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            {language === 'vi' ? (
              <>
                Quản lý đội xe thông minh,<br />
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  Giám sát an toàn hành trình bằng AI.
                </span>
              </>
            ) : (
              <>
                Intelligent Fleet Operations,<br />
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  AI-Powered Road Safety Monitoring.
                </span>
              </>
            )}
          </h1>

          <p className="text-slate-300 text-base max-w-xl leading-relaxed mb-8">
            {language === 'vi'
              ? 'Giải pháp chuyên sâu tích hợp định vị GPS độ trễ thấp, phát hiện tài xế ngủ gật qua thị giác máy tính và tự động hóa hợp đồng cho thuê xe đa doanh nghiệp.'
              : 'Enterprise-grade platform integrating low-latency GPS tracking, computer vision driver drowsiness detection, and multi-tenant rental contract automation.'}
          </p>

          {/* 3 Thẻ Feature Card sắc nét */}
          <div className="grid grid-cols-1 gap-3.5 max-w-xl">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/80 transition-colors">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {language === 'vi' ? 'Giám sát Tọa độ & Lộ trình GPS Thời gian thực' : 'Real-time GPS Tracking & Fleet Routes'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'vi'
                    ? 'Đồng bộ liên tục qua STOMP WebSocket với bản đồ trực quan, tốc độ, trạng thái xe và cảnh báo tức thì.'
                    : 'Continuous sync via STOMP WebSocket with interactive maps, speed metrics, vehicle health, and instant alerts.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/80 transition-colors">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {language === 'vi' ? 'Edge AI Phát hiện Buồn ngủ & Mất tập trung' : 'Edge AI Drowsiness & Distraction Detection'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'vi'
                    ? 'Mô hình AI nhúng đánh giá trạng thái mắt và tư thế đầu, cảnh báo âm thanh và truyền dữ liệu về tổng đài.'
                    : 'Embedded AI model analyzes driver eyes and head posture, emits audio alarms, and streams incident data.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 hover:border-slate-700/80 transition-colors">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">
                  {language === 'vi' ? 'Kiến trúc Đa Doanh nghiệp (Multi-tenant)' : 'Multi-Tenant Enterprise Architecture'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'vi'
                    ? 'Mỗi công ty sở hữu không gian dữ liệu, đội xe, hợp đồng và nhân sự riêng biệt, cách ly an toàn 100%.'
                    : 'Each company retains an isolated workspace for vehicles, contracts, and staff with enterprise security.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800/60">
          <p>{language === 'vi' ? '© 2026 DriveLinker. Đồ án Tốt nghiệp Capstone Project.' : '© 2026 DriveLinker. Graduation Capstone Project.'}</p>
          <div className="flex items-center gap-4">
            <span>{language === 'vi' ? 'Bảo mật JWT' : 'JWT Security'}</span>
            <span>•</span>
            <span>PostGIS</span>
            <span>•</span>
            <span>Spring Boot + React</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          CỘT PHẢI: FORM ĐĂNG NHẬP CỔNG DOANH NGHIỆP
          ========================================================= */}
      <div className="w-full lg:w-5/12 min-h-screen bg-slate-900 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">

        {/* Top Header: Brand & Language Switcher (Visible on both Mobile and Desktop) */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white">DriveLinker</span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                Portal
              </span>
            </div>
          </div>

          {/* Button Chuyển đổi ngôn ngữ Anh <-> Việt */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-800 text-slate-200 hover:text-white transition-all shadow-sm text-xs font-semibold cursor-pointer group"
            title={language === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
          >
            <Globe className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform duration-300" />
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className={language === 'vi' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'}>VI</span>
              <span className="text-slate-600">/</span>
              <span className={language === 'en' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'}>EN</span>
            </div>
          </button>
        </div>

        {/* Middle: Main Form Card */}
        <div className="my-auto max-w-md w-full mx-auto">

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {language === 'vi' ? 'Đăng nhập Doanh nghiệp' : 'Enterprise Sign In'}
            </h2>
            <p className="text-sm text-slate-400">
              {language === 'vi'
                ? 'Vui lòng nhập Mã doanh nghiệp và tài khoản được cấp để truy cập bảng điều khiển.'
                : 'Please enter your Enterprise Code and assigned credentials to access the dashboard.'}
            </p>
          </div>

          {/* Hộp Thông báo lỗi nếu có */}
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3.5 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form Đăng nhập chính */}
          <form className="space-y-4" onSubmit={handleLogin}>

            {/* Ô 1: Mã doanh nghiệp */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'vi' ? 'Mã Doanh Nghiệp (Company Code)' : 'Enterprise Company Code'} <span className="text-rose-400">*</span>
                </label>
                {matchedTenant && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {matchedTenant.name}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                  placeholder="VD: CTA2026"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-slate-800 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Ô 2: Tên đăng nhập */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {language === 'vi' ? 'Tài khoản (Username)' : 'Username / Email'} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'vi' ? 'VD: owner.an hoặc staff.a' : 'e.g. owner.an or staff.a'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-slate-800 transition-all shadow-inner font-mono"
                />
              </div>
            </div>

            {/* Ô 3: Mật khẩu */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'vi' ? 'Mật khẩu (Password)' : 'Password'} <span className="text-rose-400">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'vi' ? 'Nhập mật khẩu...' : 'Enter your password...'}
                  className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-slate-800 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Nút Submit đăng nhập */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'vi' ? 'Đang xác thực hệ thống...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'vi' ? 'Đăng nhập hệ thống' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tiện ích chọn nhanh tài khoản Demo (Dành cho buổi bảo vệ đồ án) */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                {language === 'vi' ? 'Chọn nhanh tài khoản Demo (1-Click):' : 'Quick Demo Accounts (1-Click):'}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Pass: 123456</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset('CTA2026', 'owner.an')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  tenantCode === 'CTA2026' && username === 'owner.an'
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'CTY A • Quản lý' : 'Company A • Manager'}</span>
                  <span className="text-[10px] font-mono opacity-60">CTA2026</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">owner.an</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CTA2026', 'staff.a')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  tenantCode === 'CTA2026' && username === 'staff.a'
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'CTY A • Nhân viên' : 'Company A • Staff'}</span>
                  <span className="text-[10px] font-mono opacity-60">CTA2026</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">staff.a</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CTB2026', 'owner.an')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  tenantCode === 'CTB2026' && username === 'owner.an'
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'CTY B • Quản lý' : 'Company B • Manager'}</span>
                  <span className="text-[10px] font-mono opacity-60">CTB2026</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">owner.an</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CTC2026', 'staff.c')}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                  tenantCode === 'CTC2026' && username === 'staff.c'
                    ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{language === 'vi' ? 'CTY C • Nhân viên' : 'Company C • Staff'}</span>
                  <span className="text-[10px] font-mono opacity-60">CTC2026</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">staff.c</div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Lối vào Core Admin */}
        <div className="pt-6 text-center">
          <Link
            to="/overview/admin/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors py-1 px-3 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60"
          >
            <span>{language === 'vi' ? 'Bạn là Quản trị viên hệ thống?' : 'Are you a System Administrator?'}</span>
            <span className="text-sky-400 flex items-center gap-0.5">
              {language === 'vi' ? 'Truy cập vào Admin' : 'Access Admin Portal'} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

      </div>

    </div>
  );
}
