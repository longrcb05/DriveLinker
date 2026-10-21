import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  // State mới: Quản lý hiệu ứng rời khỏi trang
  const [isExiting, setIsExiting] = useState(false); 
  
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Giả lập thời gian server xử lý (1 giây)
    setTimeout(() => {
      if (email === 'admin' && password === '123456') {
        // Bước 1: Kích hoạt hiệu ứng mờ dần
        setIsExiting(true);
        
        // Bước 2: Đợi 500ms cho hiệu ứng chạy xong rồi mới chuyển trang
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác. Hãy thử lại');
        setIsLoading(false);
      }
    }, 1000); 
  };

  return (
    // Bọc toàn bộ trang bằng các class transition của Tailwind.
    // Nếu isExiting = true, trang sẽ mờ đi (opacity-0) và chìm xuống (scale-95, blur)
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans transition-all duration-500 ease-in-out transform ${
      isExiting ? 'opacity-0 scale-95 blur-[2px]' : 'opacity-100 scale-100 blur-0'
    }`}>
      

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] p-8 sm:p-10">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập vào DriveLinker</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Hệ thống quản lý xe cho thuê thông minh và giám sát tài xế
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            
            {/* Email/Username Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tên đăng nhập
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <a href="#" className="text-xs text-[#0EA5E9] hover:text-blue-700 font-medium">
                  Quên mật khẩu?
                </a>
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

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
                isLoading 
                  ? 'bg-sky-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#0EA5E9] hover:bg-[#0284C7] shadow-blue-200'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
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