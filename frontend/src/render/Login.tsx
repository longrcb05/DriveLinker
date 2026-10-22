import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, ArrowRight, ShieldCheck,
  Loader2, Building, ArrowLeft // --- MỚI THÊM: Các Icon cho giao diện chọn công ty
} from 'lucide-react';

// --- MỚI THÊM: Giả lập dữ liệu các Tenant (Công ty) từ Backend trả về
const MOCK_TENANTS = [
  { id: 'TENANT_HAIHA', name: 'Công ty A', code: 'CTA', role: 'Admin' },
  { id: 'TENANT_VINHTRI', name: 'Hộ kinh doanh B', code: 'HKDB', role: 'Manager' }
];

export default function Login() {
  // --- MỚI THÊM: Quản lý luồng 3 bước (1: Email, 2: Chọn Công ty, 3: Mật khẩu)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const navigate = useNavigate();

  // --- MỚI THÊM: Hàm xử lý Bước 1 (Kiểm tra Email)
  const handleCheckEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Giả lập gọi API kiểm tra email
    setTimeout(() => {
      if (email.toLowerCase() === 'admin') {
        setIsLoading(false);
        setStep(2); // Email đúng -> Chuyển sang bước chọn công ty
      } else {
        setError('Tài khoản không tồn tại trên hệ thống.');
        setIsLoading(false);
      }
    }, 800);
  };

  // --- MỚI THÊM: Hàm xử lý Bước 2 (Chọn Công ty)
  const handleSelectTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setStep(3); // Chọn xong -> Chuyển sang bước nhập mật khẩu
  };

  // Hàm xử lý Bước 3 (Đăng nhập chính thức - Giữ nguyên logic cũ của bạn)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (password === '123456') {
        // --- MỚI THÊM: Lưu mã công ty vào LocalStorage để các API sau này sử dụng
        localStorage.setItem('tenantId', selectedTenant.id);
        localStorage.setItem('tenantName', selectedTenant.name);
        localStorage.setItem('userRole', selectedTenant.role);

        setIsExiting(true);
        setTimeout(() => {
          navigate('/dashboard'); // Hoặc '/overview' tùy cấu hình Router của bạn
        }, 500);

      } else {
        setError('Mật khẩu không chính xác. Hãy thử lại');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans transition-all duration-500 ease-in-out transform ${isExiting ? 'opacity-0 scale-95 blur-[2px]' : 'opacity-100 scale-100 blur-0'
      }`}>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] p-8 sm:p-10 transition-all duration-300">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập vào DriveLinker</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Hệ thống quản lý xe cho thuê thông minh và giám sát tài xế
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          {/* ==========================================
              BƯỚC 1: CHỈ NHẬP EMAIL
              ========================================== */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleCheckEmail}>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tên đăng nhập / Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${isLoading ? 'bg-sky-400 cursor-not-allowed shadow-none' : 'bg-[#0EA5E9] hover:bg-[#0284C7] shadow-blue-200'
                  }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* ==========================================
              BƯỚC 2: CHỌN CÔNG TY (TENANT)
              ========================================== */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 mb-5 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-3 h-3" /> Quay lại
              </button>

              <div className="mb-6">
                <p className="text-sm text-slate-500">Tài khoản <span className="font-bold text-[#0EA5E9]">{email}</span> thuộc về các doanh nghiệp sau. Vui lòng chọn không gian làm việc:</p>
              </div>

              <div className="space-y-3">
                {MOCK_TENANTS.map(tenant => (
                  <button
                    key={tenant.id}
                    onClick={() => handleSelectTenant(tenant)}
                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#0EA5E9] hover:bg-sky-50 transition-all text-left group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-sky-200">
                        <Building className="w-5 h-5 text-slate-500 group-hover:text-[#0EA5E9]" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{tenant.name}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">Vai trò: {tenant.role}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0EA5E9]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              BƯỚC 3: NHẬP MẬT KHẨU CỦA CÔNG TY ĐÃ CHỌN
              ========================================== */}
          {step === 3 && (
            <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleLogin}>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider"
                >
                  <ArrowLeft className="w-3 h-3" /> Đổi công ty
                </button>
              </div>

              {/* Box hiển thị công ty đang chọn */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-2">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">{selectedTenant?.name}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Mật khẩu xác thực
                  </label>
                  <a href="#" className="text-xs text-[#0EA5E9] hover:text-blue-700 font-medium">Quên mật khẩu?</a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    required
                  />
                  <button type="button" disabled={isLoading} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 pb-2">
                <input
                  type="checkbox"
                  id="remember"
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9] cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="remember" className={`text-sm text-slate-600 select-none ${isLoading ? 'cursor-default opacity-50' : 'cursor-pointer'}`}>
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${isLoading ? 'bg-sky-400 cursor-not-allowed shadow-none' : 'bg-[#0EA5E9] hover:bg-[#0284C7] shadow-blue-200'
                  }`}
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xác thực...</>
                ) : (
                  <>Đăng nhập <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-[#10B981] font-medium bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-slate-500">Mã hóa đầu cuối chuẩn bảo mật giao thức vận tải</span>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-[#F8FAFC] py-5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <div>© 2026 DriveLinker Telematics. Sản phẩm của nhóm C1SE.69.</div>
        <div className="flex items-center divide-x divide-slate-300 mt-4 md:mt-0">
          <span className="pr-4">Hỗ trợ kỹ thuật 24/7: <strong className="text-slate-700 font-bold">0886.557.205</strong></span>
          <a href="#" className="px-4 hover:text-slate-700 transition-colors">Điều khoản dịch vụ</a>
          <a href="#" className="pl-4 hover:text-slate-700 transition-colors">Chính sách bảo mật</a>
        </div>
      </footer>
    </div>
  );
}