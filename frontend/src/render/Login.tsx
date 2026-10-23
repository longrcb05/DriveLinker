import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // Xác thực thẳng vào tài khoản Admin tổng
      if (email === 'admin' && password === '123456') {
        localStorage.setItem('tenantId', 'CORE_SYSTEM');
        localStorage.setItem('tenantName', 'DriveLinker Global');
        localStorage.setItem('userRole', 'SYS_ADMIN');

        setIsExiting(true);
        setTimeout(() => navigate('/sysadmin'), 500);
      } else {
        setError('Thông tin đăng nhập quản trị không hợp lệ.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col relative font-sans transition-all duration-500 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100'}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-[20px] shadow-2xl w-full max-w-[400px] p-8 sm:p-10 text-white">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-rose-600 rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">DriveLinker Admin</h1>
            <p className="text-sm text-slate-400">Restricted Area • System Admin</p>
          </div>

          {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg text-center">{error}</div>}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tài khoản quản trị</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" required placeholder="admin" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all" required placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Truy cập hệ thống <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}