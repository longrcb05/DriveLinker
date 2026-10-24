import React, { useState, useEffect } from 'react';
import { Activity, Search, Download, Settings, LogIn, ShieldAlert, Clock, Loader2, Plus, Edit2, Trash2, UserPlus, UserMinus, UserCheck } from 'lucide-react';

// Dữ liệu mẫu nạp lần đầu nếu hệ thống chưa có log
const INITIAL_LOGS = [
    { id: 'LOG-001', time: '2026-10-24 09:15:22', user: 'admin', role: 'SYS_ADMIN', action: 'USER_LOGIN', target: 'Hệ thống Lõi', status: 'Success', ip: '192.168.1.45' },
    { id: 'LOG-002', time: '2026-10-24 08:30:05', user: 'Unknown', role: 'GUEST', action: 'FAILED_LOGIN', target: 'Cổng SYS_ADMIN', status: 'Failed', ip: '103.11.23.50' }
];

// Hàm ánh xạ mã Hành động ra Icon và Màu sắc giao diện
const getActionMeta = (action: string) => {
    switch (action) {
        case 'CREATE_TENANT': return { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'TẠO DOANH NGHIỆP' };
        case 'UPDATE_TENANT': return { icon: Edit2, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'SỬA DOANH NGHIỆP' };
        case 'DELETE_TENANT': return { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'XÓA DOANH NGHIỆP' };
        case 'UPDATE_CONFIG': return { icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'LƯU CẤU HÌNH' };
        case 'CREATE_USER': return { icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'THÊM TÀI KHOẢN' };
        case 'DELETE_USER': return { icon: UserMinus, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'XÓA TÀI KHOẢN' };
        case 'APPROVE_USER': return { icon: UserCheck, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'DUYỆT TÀI KHOẢN' };
        case 'USER_LOGIN': return { icon: LogIn, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'ĐĂNG NHẬP' };
        case 'FAILED_LOGIN': return { icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'CẢNH BÁO BẢO MẬT' };
        default: return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10', label: action };
    }
};

export default function SystemLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Đọc dữ liệu log từ LocalStorage
    useEffect(() => {
        const storedLogs = localStorage.getItem('system_logs');
        if (!storedLogs) {
            localStorage.setItem('system_logs', JSON.stringify(INITIAL_LOGS));
            setLogs(INITIAL_LOGS);
        } else {
            setLogs(JSON.parse(storedLogs));
        }
    }, []);

    // Xử lý Tìm kiếm
    const handleSearch = () => {
        setAppliedSearch(searchTerm);
    };

    // Xử lý phím Enter khi tìm kiếm
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Lọc danh sách log dựa trên từ khóa
    const filteredLogs = logs.filter(log => {
        const term = appliedSearch.toLowerCase();
        const meta = getActionMeta(log.action);
        return (
            log.user.toLowerCase().includes(term) ||
            meta.label.toLowerCase().includes(term) ||
            log.target.toLowerCase().includes(term) ||
            log.ip.toLowerCase().includes(term)
        );
    });

    const handleExportCSV = () => {
        setIsExporting(true);
        setTimeout(() => {
            const headers = ['Mã Log', 'Thời gian', 'Tài khoản', 'Quyền', 'Hành động', 'Đối tượng', 'Trạng thái', 'IP'];
            const csvRows = [headers.join(',')];

            filteredLogs.forEach(log => {
                const actionLabel = getActionMeta(log.action).label;
                csvRows.push(`${log.id},${log.time},${log.user},${log.role},${actionLabel},${log.target},${log.status},${log.ip}`);
            });

            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `DriveLinker_AuditLogs_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsExporting(false);
        }, 800);
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-rose-500 flex items-center gap-2">
                        <Activity className="w-6 h-6" /> Nhật ký Hệ thống
                    </h1>
                    <p className="text-slate-400 mt-2">Truy vết toàn bộ thao tác bảo mật, đăng nhập và thay đổi cấu hình trên toàn nền tảng.</p>
                </div>
                <button onClick={handleExportCSV} disabled={isExporting} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-wait">
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Đang xử lý...' : 'Xuất dữ liệu (.csv)'}
                </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo user, hành động, mục tiêu, IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-rose-500 text-slate-200"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-rose-600 border border-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm"
                >
                    <Search className="w-4 h-4" /> Tìm kiếm
                </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4">Hành động</th>
                            <th className="px-6 py-4">Tài khoản thao tác</th>
                            <th className="px-6 py-4">Đối tượng tác động</th>
                            <th className="px-6 py-4">Trạng thái / IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredLogs.map((log) => {
                            const meta = getActionMeta(log.action);
                            const Icon = meta.icon;
                            return (
                                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            {log.time}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg}`}>
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                            </div>
                                            <span className="font-bold text-slate-200">{meta.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{log.user}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500">{log.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                                        {log.target}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            {log.status === 'Success' ? (
                                                <span className="w-fit bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">THÀNH CÔNG</span>
                                            ) : (
                                                <span className="w-fit bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">THẤT BẠI</span>
                                            )}
                                            <span className="text-xs text-slate-500 font-mono">{log.ip}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    Không tìm thấy nhật ký nào khớp với từ khóa "{appliedSearch}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}