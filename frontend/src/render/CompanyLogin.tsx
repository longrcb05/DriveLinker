// http://localhost:5173/portal/login 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function CompanyLogin() {
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
            // 1. Tài khoản Chủ doanh nghiệp (Admin)
            if (email === 'admin@ctya.com' && password === '123456') {
                localStorage.setItem('tenantId', 'COMPANY_A');
                localStorage.setItem('tenantCode', 'CTA2026');
                localStorage.setItem('tenantName', 'Công ty A');
                localStorage.setItem('userRole', 'TENANT_ADMIN');

                setIsExiting(true);
                setTimeout(() => navigate('/dashboard'), 500);
            }
            // 2. Tài khoản Nhân viên (Staff)
            else if (email === 'staff@ctya.com' && password === '123456') {
                localStorage.setItem('tenantId', 'COMPANY_A');
                localStorage.setItem('tenantCode', 'CTA2026');
                localStorage.setItem('tenantName', 'Công ty A');
                localStorage.setItem('userRole', 'TENANT_STAFF');

                setIsExiting(true);
                setTimeout(() => navigate('/dashboard'), 500);
            }
            // Sai thông tin
            else {
                setError('Thông tin đăng nhập không hợp lệ.');
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans transition-all duration-500 ${isExiting ? 'opacity-0 scale-95 blur-[2px]' : 'opacity-100 scale-100'}`}>
            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] p-8 sm:p-10 transition-all duration-300">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập vào DriveLinker</h1>
                        <p className="text-sm text-slate-500 leading-relaxed">Hệ thống quản lý và giám sát phương tiện</p>
                    </div>

                    {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg text-center font-medium animate-pulse">{error}</div>}

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tài khoản doanh nghiệp</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" required placeholder="ví dụ: admin@congtya.vn" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" required placeholder="••••••••" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm bg-[#0EA5E9] hover:bg-[#0284C7] mt-6">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Đăng nhập hệ thống <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs text-[#10B981] font-medium bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-slate-500">Mã hóa đầu cuối chuẩn bảo mật giao thức vận tải</span>
                </div>
            </div>
        </div>
    );
}