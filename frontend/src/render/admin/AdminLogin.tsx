import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Key, User, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        let adminName = '';

        if (username.toUpperCase() === 'ADMINLONG' && password === '123456') {
            adminName = 'Nguyễn Nhật Long';
        } else if (username.toUpperCase() === 'ADMINAN' && password === '123456') {
            adminName = 'Nguyễn Phạm Thiện Ân';
        }

        if (adminName) {
            // 1. KHỞI TẠO DỮ LIỆU CÔNG TY MẪU NẾU TRÌNH DUYỆT CHƯA CÓ
            if (!localStorage.getItem('sys_tenants')) {
                localStorage.setItem('sys_tenants', JSON.stringify([
                    { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTYA26' },
                    { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTYB26' },
                    { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTYC26' }
                ]));
            }

            // 2. LƯU PHIÊN ĐĂNG NHẬP ADMIN VÀO SESSION STORAGE
            sessionStorage.setItem('sys_core_role', 'SUPER_ADMIN');
            sessionStorage.setItem('sys_core_admin_name', adminName);

            // 3. CHUYỂN HƯỚNG SANG TRANG DANH SÁCH
            navigate('/overview/admin');
        } else {
            setError('Tài khoản hoặc mật khẩu Quản trị viên không đúng!');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Xác thực System Admin</h1>
                <p className="text-sm text-slate-500 mb-6">Đăng nhập tài khoản Quản trị viên</p>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        <p className="text-sm font-bold text-rose-600 text-left">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full bg-slate-50 border pl-10 pr-4 py-3 rounded-xl outline-none transition-colors ${error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-sky-500'}`}
                            placeholder="Tài khoản"
                            autoFocus
                        />
                    </div>
                    <div className="relative">
                        <Key className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-slate-50 border pl-10 pr-4 py-3 rounded-xl outline-none transition-colors ${error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-sky-500'}`}
                            placeholder="Mật khẩu"
                        />
                    </div>
                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm active:scale-95">
                        Truy cập
                    </button>
                </form>
            </div>
        </div>
    );
}