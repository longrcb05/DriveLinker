/**
 * @file SystemLogs.tsx
 * @description Phần nhật ký hệ thống dành cho System Admin.
 * Component này chịu trách nhiệm hiển thị, tìm kiếm và kết xuất toàn bộ
 * lịch sử thao tác của người dùng trên nền tảng. Dữ liệu tạm thời được lưu trữ
 * và truy xuất thông qua `localStorage`.
 */

import React, { useState, useEffect } from 'react';
import { Activity, Search, Download, Settings, LogIn, ShieldAlert, Clock, Loader2, Plus, Edit2, Trash2, UserPlus, UserMinus, UserCheck } from 'lucide-react';

/**
 * Dữ liệu mẫu  dùng để khởi tạo hệ thống khi chưa có dữ liệu log thực tế.
 * Đảm bảo giao diện luôn có dữ liệu để hiển thị trong lần chạy đầu tiên.
 */
const INITIAL_LOGS = [
    { id: 'LOG-001', time: '2026-10-24 09:15:22', user: 'admin', role: 'SYS_ADMIN', action: 'USER_LOGIN', target: 'Hệ thống Lõi', status: 'Success', ip: '192.168.1.45' },
    { id: 'LOG-002', time: '2026-10-24 08:30:05', user: 'Unknown', role: 'GUEST', action: 'FAILED_LOGIN', target: 'Cổng SYS_ADMIN', status: 'Failed', ip: '103.11.23.50' }
];

/**
 * Hàm ánh xạ (Mapping Data) chuyển đổi mã hành động  từ cơ sở dữ liệu
 * thành các thông tin hiển thị trên giao diện bao gồm Icon, màu sắc và nhãn.
 * 
 * @param {string} action - Mã hành động được lưu trong log (VD: 'CREATE_TENANT').
 * @returns {Object} Đối tượng chứa cấu hình UI: { icon, color, bg, label }.
 */
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
        // Fallback cho các hành động chưa được định nghĩa
        default: return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10', label: action };
    }
};

export default function SystemLogs() {
    // --- State Management ---
    const [logs, setLogs] = useState<any[]>([]); // Lưu trữ toàn bộ dữ liệu log gốc

    // Sử dụng 2 state cho tìm kiếm để tối ưu hiệu suất:
    // `searchTerm` lưu giá trị người dùng đang gõ, `appliedSearch` lưu giá trị thực sự dùng để lọc sau khi nhấn Enter/Tìm kiếm.
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const [isExporting, setIsExporting] = useState(false); // Trạng thái hiển thị loading khi xuất file CSV

    /**
     * Vòng đời khởi tạo : 
     * Đọc dữ liệu từ `localStorage` khi Component mount lần đầu tiên.
     * Nếu không có dữ liệu, tiến hành ghi dữ liệu mẫu (INITIAL_LOGS) vào bộ nhớ tạm.
     */
    useEffect(() => {
        const storedLogs = localStorage.getItem('system_logs');
        if (!storedLogs) {
            localStorage.setItem('system_logs', JSON.stringify(INITIAL_LOGS));
            setLogs(INITIAL_LOGS);
        } else {
            setLogs(JSON.parse(storedLogs));
        }
    }, []);

    /**
     * Xác nhận áp dụng từ khóa tìm kiếm vào bộ lọc dữ liệu.
     */
    const handleSearch = () => {
        setAppliedSearch(searchTerm);
    };

    /**
     * Bắt sự kiện bàn phím. Nếu phím là Enter thì kích hoạt tìm kiếm.
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    /**
     * Thuật toán Tìm kiếm tuyến tính kết hợp So khớp chuỗi.
     * - Mục tiêu: Lọc ra các bản ghi log thỏa mãn từ khóa tìm kiếm.
     * - Cách hoạt động: 
     *   1. Duyệt tuần tự qua mảng `logs` (độ phức tạp O(n)).
     *   2. Lấy nhãn hiển thị của hành động để đảm bảo tìm kiếm khớp với những gì user nhìn thấy, không phải mã code ẩn.
     *   3. Chuyển đổi mọi trường dữ liệu và từ khóa về chữ thường để so khớp không phân biệt hoa/thường.
     *   4. Sử dụng điều kiện OR (||), nếu từ khóa xuất hiện ở BẤT KỲ trường nào, bản ghi đó sẽ được giữ lại.
     */
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

    /**
     * Thuật toán kết xuất và tải file CSV trực tiếp từ trình duyệt.
     * - Mục tiêu: Biến mảng JSON thành file .csv và ép trình duyệt tải xuống.
     * - Cách hoạt động:
     *   1. Khởi tạo mảng `csvRows` với phần tử đầu tiên là dòng tiêu đề.
     *   2. Duyệt qua mảng `filteredLogs`, chuyển đổi từng đối tượng thành một chuỗi các giá trị cách nhau bằng dấu phẩy (,), thêm vào `csvRows`.
     *   3. Ghép mảng `csvRows` thành chuỗi văn bản hoàn chỉnh bằng ký tự xuống dòng (`\n`).
     *   4. Tiền tố `\uFEFF` (Byte Order Mark - BOM) được thêm vào để thông báo cho các phần mềm như Microsoft Excel biết file sử dụng bảng mã UTF-8, tránh lỗi font tiếng Việt.
     *   5. Thao tác DOM ảo (Virtual DOM Manipulation): Tạo động một thẻ `<a>`, gắn URL dữ liệu, kích hoạt sự kiện click để tải, và xóa thẻ ngay lập tức.
     */
    const handleExportCSV = () => {
        setIsExporting(true);

        // Sử dụng setTimeout để giả lập độ trễ, cho phép UI cập nhật trạng thái loading (spinner) trước khi luồng chính bị chặn bởi việc xử lý string lớn.
        setTimeout(() => {
            const headers = ['Mã Log', 'Thời gian', 'Tài khoản', 'Quyền', 'Hành động', 'Đối tượng', 'Trạng thái', 'IP'];
            const csvRows = [headers.join(',')];

            filteredLogs.forEach(log => {
                const actionLabel = getActionMeta(log.action).label;
                csvRows.push(`${log.id},${log.time},${log.user},${log.role},${actionLabel},${log.target},${log.status},${log.ip}`);
            });

            // Gắn cờ BOM (\uFEFF) hỗ trợ hiển thị tiếng Việt UTF-8 trên Excel
            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
            const encodedUri = encodeURI(csvContent);

            // Khởi tạo thẻ a ẩn để thực thi lệnh download
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `DriveLinker_AuditLogs_${new Date().getTime()}.csv`);

            // Gắn vào DOM, click và dọn dẹp
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsExporting(false);
        }, 800);
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white h-full flex flex-col">

            {/* Tiêu đề và Nút hành động */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-rose-500 flex items-center gap-2">
                        <Activity className="w-6 h-6" /> Nhật ký Hệ thống
                    </h1>
                    <p className="text-slate-400 mt-2">Truy vết toàn bộ thao tác bảo mật, đăng nhập và thay đổi cấu hình trên toàn nền tảng.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Đang xử lý...' : 'Xuất dữ liệu (.csv)'}
                </button>
            </div>

            {/* Thanh công cụ tìm kiếm */}
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

            {/* Bảng dữ liệu hiển thị Logs */}
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
                        {/* Trạng thái Empty (Khi không tìm thấy dữ liệu) */}
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