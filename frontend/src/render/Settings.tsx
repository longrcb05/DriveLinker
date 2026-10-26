/**
 * @file Settings.tsx
 * @description Phân hệ Cài đặt hệ thống (Settings) dành cho Quản trị viên doanh nghiệp (Tenant Admin).
 * Module này quản lý các thiết lập bảo mật (Mã đăng nhập doanh nghiệp), quản trị nhân sự (thêm, sửa, vô hiệu hóa, duyệt),
 * và ghi nhận nhật ký thao tác (Audit Logs). Toàn bộ dữ liệu được mô phỏng lưu trữ qua `localStorage`
 * với cơ chế cô lập dữ liệu đa tiền thuê (Multi-tenant Isolation) dựa trên `tenantId`.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Camera, Users, Shield, Key,
  CheckCircle2, AlertCircle, Edit2, Trash2, Check, X, Eye, EyeOff,
  UserPlus, History, Clock, ShieldAlert, UserCheck
} from 'lucide-react';

/**
 * Hàm khởi tạo dữ liệu mẫu (Seed Data) cho môi trường phát triển.
 * - Bài toán: Hệ thống cần dữ liệu ban đầu để hiển thị giao diện và cho phép thao tác nếu cơ sở dữ liệu trống.
 * - Đầu vào: Trạng thái hiện tại của `localStorage`.
 * - Nguyên lý: Khởi tạo các bảng `sys_tenants`, `sys_users`, và `sys_logs` nếu chúng chưa tồn tại.
 * - Đặc biệt: Sử dụng phương pháp Tìm kiếm tuần tự (Linear Search) thông qua hàm `Array.prototype.some`
 *   để kiểm tra xem Công ty A có tài khoản nào đang chờ duyệt hay không. Nếu không, tự động thêm một
 *   tài khoản mới để đảm bảo chức năng "Duyệt tài khoản" luôn có dữ liệu để kiểm thử.
 */
const initDemoData = () => {
  // 1. Khởi tạo danh sách Doanh nghiệp (Tenants)
  if (!localStorage.getItem('sys_tenants')) {
    localStorage.setItem('sys_tenants', JSON.stringify([
      { id: 'COMPANY_A', name: 'Demo CTY A', code: 'CTYA26' },
      { id: 'COMPANY_B', name: 'Demo CTY B', code: 'CTYB26' },
      { id: 'COMPANY_C', name: 'Demo CTY C', code: 'CTYC26' }
    ]));
  }

  // 2. Khởi tạo danh sách Người dùng (Users)
  let currentUsers = JSON.parse(localStorage.getItem('sys_users') || '[]');
  if (currentUsers.length === 0) {
    currentUsers = [
      { id: 'U1', tenantId: 'COMPANY_A', name: 'Nguyễn Văn A', email: 'admin@drivelinker.vn', role: 'TENANT_ADMIN', status: 'ACTIVE', requestTime: '2026-10-20T10:00:00' },
      { id: 'U2', tenantId: 'COMPANY_A', name: 'Trần Thị B', email: 'nhanvien1@drivelinker.vn', role: 'TENANT_STAFF', status: 'ACTIVE', requestTime: '2026-10-25T14:30:00' },
      { id: 'U4', tenantId: 'COMPANY_B', name: 'Phạm Văn D', email: 'admin_b@drivelinker.vn', role: 'TENANT_ADMIN', status: 'ACTIVE', requestTime: '2026-10-20T10:00:00' }
    ];
  }

  // 3. Tự động bơm dữ liệu kiểm thử (Mock Data Injection)
  // Duyệt qua mảng users để tìm tài khoản trạng thái PENDING của COMPANY_A
  const hasPending = currentUsers.some((u: any) => u.tenantId === 'COMPANY_A' && u.status === 'PENDING');
  if (!hasPending) {
    currentUsers.push({
      id: `U_TEST_${Date.now()}`,
      tenantId: 'COMPANY_A',
      name: 'Hoàng Văn F (Tài khoản mới)',
      email: `nhanvien_${Date.now().toString().slice(-4)}@drivelinker.vn`,
      role: 'TENANT_STAFF',
      status: 'PENDING',
      requestTime: new Date().toISOString()
    });
  }
  localStorage.setItem('sys_users', JSON.stringify(currentUsers));

  // 4. Khởi tạo mảng Nhật ký hệ thống trống
  if (!localStorage.getItem('sys_logs')) {
    localStorage.setItem('sys_logs', JSON.stringify([]));
  }
};

/**
 * Component chính quản lý trang Cài đặt (Settings).
 * Chịu trách nhiệm render giao diện và xử lý toàn bộ logic nghiệp vụ liên quan đến Tenant Admin.
 */
export default function Settings() {
  // Lấy thông tin định danh và phân quyền từ phiên đăng nhập (Session) hiện tại
  const [userRole] = useState(localStorage.getItem('userRole') || 'TENANT_STAFF');
  const [tenantId] = useState(localStorage.getItem('tenantId') || 'COMPANY_A');
  const currentUserEmail = localStorage.getItem('username') || 'admin@drivelinker.vn';

  // --- Trạng thái quản lý Mã đăng nhập doanh nghiệp ---
  const [currentCode, setCurrentCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [codeMessage, setCodeMessage] = useState({ type: '', text: '' });

  // --- Trạng thái quản lý Danh sách Nhân sự & Modal Thêm/Sửa ---
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'TENANT_STAFF', status: 'ACTIVE' });
  const [staffMessage, setStaffMessage] = useState({ type: '', text: '' });

  // --- Trạng thái quản lý Modal Duyệt tài khoản ---
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // --- Trạng thái quản lý Lịch sử thao tác ---
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  /**
   * Theo dõi vòng đời Component: Khởi tạo dữ liệu mẫu và nạp dữ liệu thực tế
   * mỗi khi Component được render lần đầu hoặc khi định danh `tenantId` thay đổi.
   */
  useEffect(() => {
    initDemoData();
    loadData();
  }, [tenantId]);

  /**
   * Tải và cô lập dữ liệu (Data Loading & Isolation).
   * Mục tiêu: Chỉ lấy dữ liệu thuộc về doanh nghiệp hiện tại (Dựa vào tenantId).
   */
  const loadData = () => {
    // 1. Tải thông tin công ty để lấy mã đăng nhập
    const tenants = JSON.parse(localStorage.getItem('sys_tenants') || '[]');
    const currentTenant = tenants.find((t: any) => t.id === tenantId);
    if (currentTenant) setCurrentCode(currentTenant.code);

    // 2. Tải danh sách nhân sự: Sử dụng Lọc mảng (Array Filtering) để cô lập dữ liệu nhân sự
    const allUsers = JSON.parse(localStorage.getItem('sys_users') || '[]');
    setStaffList(allUsers.filter((u: any) => u.tenantId === tenantId));

    // 3. Tải và Sắp xếp nhật ký: Lọc theo tenantId, sau đó dùng Thuật toán Sắp xếp (Sorting Algorithm)
    // dựa trên thời gian (timestamp) giảm dần để bản ghi mới nhất luôn nằm trên cùng.
    const allLogs = JSON.parse(localStorage.getItem('sys_logs') || '[]');
    setActivityLogs(
      allLogs
        .filter((l: any) => l.tenantId === tenantId)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
    );
  };

  /**
   * Mảng dẫn xuất (Derived State) lưu các tài khoản đang chờ duyệt.
   * Cập nhật tự động mỗi khi `staffList` thay đổi.
   */
  const pendingStaffList = staffList.filter(s => s.status === 'PENDING');

  /**
   * Ghi nhận Nhật ký thao tác (Audit Log).
   * @param {string} action - Hành động vừa thực hiện (VD: 'Thêm nhân sự mới').
   * @param {string} target - Đối tượng chịu tác động (VD: email của nhân sự).
   * @param {string} result - Kết quả thao tác (Mặc định: 'Thành công').
   */
  const logActivity = (action: string, target: string, result: string = 'Thành công') => {
    const allLogs = JSON.parse(localStorage.getItem('sys_logs') || '[]');
    const newLog = {
      id: `LOG_${Date.now()}`,
      tenantId,
      user: currentUserEmail,
      action,
      target,
      result,
      timestamp: Date.now(),
      timeStr: new Date().toLocaleString('vi-VN')
    };
    // Ghi nối bản ghi mới vào đầu mảng
    localStorage.setItem('sys_logs', JSON.stringify([newLog, ...allLogs]));
    loadData(); // Tải lại danh sách log để cập nhật giao diện
  };

  /**
   * Xử lý thay đổi Mã đăng nhập doanh nghiệp.
   * - Xác thực chuỗi nhập vào: Đúng 6 ký tự, chỉ gồm chữ cái và số.
   * - Xác thực nghiệp vụ: Phải khớp với mã xác nhận, khác mã cũ.
   * - Xác thực duy nhất toàn cục: Không được trùng với mã của bất kỳ Tenant nào khác.
   */
  const handleSaveCode = () => {
    setCodeMessage({ type: '', text: '' });

    // Biểu thức chính quy (Regular Expression) giới hạn chính xác 6 ký tự Alphanumeric.
    const codeRegex = /^[A-Za-z0-9]{6}$/;

    // Các bước kiểm tra tính hợp lệ (Validation)
    if (!codeRegex.test(newCode)) return setCodeMessage({ type: 'error', text: 'Mã doanh nghiệp phải gồm đúng 6 ký tự chữ và số.' });
    if (newCode !== confirmCode) return setCodeMessage({ type: 'error', text: 'Mã xác nhận không khớp.' });
    if (newCode.toUpperCase() === currentCode.toUpperCase()) return setCodeMessage({ type: 'error', text: 'Mã mới phải khác mã hiện tại.' });

    // Kiểm tra tính duy nhất: Tìm kiếm tuần tự trong toàn bộ hệ thống để đảm bảo không trùng mã
    const tenants = JSON.parse(localStorage.getItem('sys_tenants') || '[]');
    if (tenants.some((t: any) => t.code.toUpperCase() === newCode.toUpperCase())) {
      return setCodeMessage({ type: 'error', text: 'Mã doanh nghiệp này đã được sử dụng.' });
    }

    // Tiến hành cập nhật bằng cách ánh xạ (mapping) mảng dữ liệu cũ sang cấu trúc mới
    const updatedTenants = tenants.map((t: any) => t.id === tenantId ? { ...t, code: newCode.toUpperCase() } : t);
    localStorage.setItem('sys_tenants', JSON.stringify(updatedTenants));
    localStorage.setItem('tenantCode', newCode.toUpperCase());

    // Ghi Audit Log
    logActivity('Đổi mã doanh nghiệp', `CTY ID: ${tenantId}`);

    // Dọn dẹp trạng thái UI
    setCurrentCode(newCode.toUpperCase());
    setIsEditingCode(false);
    setNewCode(''); setConfirmCode('');
    setCodeMessage({ type: 'success', text: 'Đổi mã doanh nghiệp thành công. Mã cũ đã vô hiệu hóa.' });

    // Ẩn thông báo sau 5 giây
    setTimeout(() => setCodeMessage({ type: '', text: '' }), 5000);
  };

  /**
   * Chuẩn bị trạng thái để mở Modal Thêm/Sửa nhân sự.
   * @param {any} staff - Đối tượng nhân sự (Nếu null -> Thêm mới, Nếu có dữ liệu -> Chế độ Sửa).
   */
  const openStaffModal = (staff: any = null) => {
    setStaffMessage({ type: '', text: '' });
    if (staff) {
      setEditingStaffId(staff.id);
      setStaffForm({ name: staff.name, email: staff.email, role: staff.role, status: staff.status });
    } else {
      setEditingStaffId(null);
      setStaffForm({ name: '', email: '', role: 'TENANT_STAFF', status: 'ACTIVE' });
    }
    setIsStaffModalOpen(true);
  };

  /**
   * Lưu thông tin Nhân sự (Create/Update).
   * - Xác thực đầu vào cơ bản (Tên, Email).
   * - Xác thực nghiệp vụ: Email phải là duy nhất trên toàn hệ thống (cả các doanh nghiệp khác).
   */
  const saveStaff = () => {
    // 1. Xác thực trường dữ liệu bắt buộc
    if (!staffForm.name || !staffForm.email) return setStaffMessage({ type: 'error', text: 'Vui lòng nhập đủ Họ tên và Email.' });

    const allUsers = JSON.parse(localStorage.getItem('sys_users') || '[]');

    // 2. Xác thực tính duy nhất của Email toàn cục (loại trừ tài khoản đang sửa)
    const isEmailExist = allUsers.some((u: any) => u.email.toLowerCase() === staffForm.email.toLowerCase() && u.id !== editingStaffId);
    if (isEmailExist) return setStaffMessage({ type: 'error', text: 'Email này đã tồn tại trong hệ thống.' });

    // 3. Xử lý ghi dữ liệu dựa trên ngữ cảnh (Sửa hay Thêm mới)
    if (editingStaffId) {
      // Chế độ Sửa (Update)
      const updatedUsers = allUsers.map((u: any) => u.id === editingStaffId ? { ...u, ...staffForm } : u);
      localStorage.setItem('sys_users', JSON.stringify(updatedUsers));
      logActivity('Cập nhật nhân sự', staffForm.email);
    } else {
      // Chế độ Thêm mới (Create)
      const newUser = { id: `U_${Date.now()}`, tenantId, ...staffForm, requestTime: new Date().toISOString() };
      localStorage.setItem('sys_users', JSON.stringify([newUser, ...allUsers]));
      logActivity('Thêm nhân sự mới', staffForm.email);
    }

    setIsStaffModalOpen(false);
    loadData();
  };

  /**
   * Vô hiệu hóa Nhân sự (Soft Delete).
   * - Nguyên lý: Không xóa hẳn dòng dữ liệu trong DB để bảo toàn lịch sử nghiệp vụ (đơn hàng, hành trình xe).
   *   Thay vào đó, chuyển trạng thái thành 'DISABLED'.
   * - Ràng buộc: Không tự vô hiệu hóa chính mình, không vô hiệu hóa Admin cuối cùng.
   * @param {any} staff - Đối tượng nhân sự cần vô hiệu hóa.
   */
  const handleDisableStaff = (staff: any) => {
    // Ngăn chặn tự tử (Self-lockout prevention)
    if (staff.email === currentUserEmail) return alert("Hệ thống từ chối: Bạn không thể tự vô hiệu hóa tài khoản của chính mình.");

    // Ngăn chặn vô hiệu hóa quản trị viên cuối cùng (Last Admin lock prevention)
    const activeAdmins = staffList.filter(s => s.role === 'TENANT_ADMIN' && s.status === 'ACTIVE');
    if (staff.role === 'TENANT_ADMIN' && activeAdmins.length <= 1) {
      return alert("Cảnh báo: Không thể vô hiệu hóa Quản trị viên cuối cùng của doanh nghiệp.");
    }

    if (window.confirm(`Xác nhận vô hiệu hóa tài khoản của ${staff.name}?\nLịch sử chuyến xe của tài xế này vẫn sẽ được giữ lại.`)) {
      const allUsers = JSON.parse(localStorage.getItem('sys_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => u.id === staff.id ? { ...u, status: 'DISABLED' } : u);
      localStorage.setItem('sys_users', JSON.stringify(updatedUsers));

      logActivity('Vô hiệu hóa tài khoản', staff.email);
      loadData();
    }
  };

  /**
   * Xử lý phê duyệt (Duyệt/Từ chối) tài khoản nhân sự mới đăng ký.
   * @param {string} userId - Mã ID nhân sự cần xét duyệt.
   * @param {'ACTIVE' | 'REJECTED'} action - Trạng thái mới muốn gán.
   * @param {string} userName - Tên nhân sự (dùng hiển thị thông báo).
   * @param {string} email - Email (dùng để ghi log).
   */
  const handleApproval = (userId: string, action: 'ACTIVE' | 'REJECTED', userName: string, email: string) => {
    const actionText = action === 'ACTIVE' ? 'Duyệt' : 'Từ chối';
    if (!window.confirm(`Xác nhận ${actionText.toLowerCase()} yêu cầu tham gia của ${userName}?`)) return;

    // Tìm và cập nhật đúng User thuộc Tenant hiện tại (bảo mật tránh thao tác chéo)
    const allUsers = JSON.parse(localStorage.getItem('sys_users') || '[]');
    const updatedUsers = allUsers.map((u: any) => u.id === userId && u.tenantId === tenantId ? { ...u, status: action } : u);

    localStorage.setItem('sys_users', JSON.stringify(updatedUsers));
    logActivity(`${actionText} yêu cầu tham gia`, email);
    loadData();

    // Logic đóng modal thông minh: Nếu xử lý xong người cuối cùng đang chờ, tự động đóng Modal
    const remainingPending = updatedUsers.filter((u: any) => u.tenantId === tenantId && u.status === 'PENDING');
    if (remainingPending.length === 0) {
      setIsApprovalModalOpen(false);
    }
  };

  // -------------------------------------------------------------------------
  // Middleware Xác thực Quyền truy cập phía Client (Client-side Access Control)
  // Ngăn chặn tài khoản không có quyền Admin truy cập màn hình cài đặt.
  // -------------------------------------------------------------------------
  if (userRole !== 'TENANT_ADMIN' && userRole !== 'SYS_ADMIN') {
    return (
      <div className="flex-1 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Khu vực Giới hạn</h2>
        <p className="text-slate-500">Chỉ Quản trị viên doanh nghiệp mới có quyền truy cập trang Cài đặt.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER UI CHÍNH
  // -------------------------------------------------------------------------
  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6 font-sans">

      {/* KHU VỰC 1: Tiêu đề trang */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Cài đặt Hệ thống</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý bảo mật, nhân sự, phân quyền và nhật ký thao tác</p>
      </div>

      {/* KHU VỰC 2: Quản lý Mã đăng nhập doanh nghiệp */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Key className="w-5 h-5" /></div>
          <div><h3 className="font-bold text-slate-800">Bảo mật & Đăng nhập</h3><p className="text-xs text-slate-500">Quản lý mã định danh doanh nghiệp (Company Login Code)</p></div>
        </div>
        <div className="p-5">
          {codeMessage.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm font-medium ${codeMessage.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'} border`}>
              {codeMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}{codeMessage.text}
            </div>
          )}
          {!isEditingCode ? (
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mã đăng nhập hiện tại</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-slate-800 tracking-widest">{showCode ? currentCode : '•••' + currentCode.slice(-3)}</span>
                  <button onClick={() => setShowCode(!showCode)} className="text-slate-400 hover:text-sky-600 transition-colors">{showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
              <button onClick={() => setIsEditingCode(true)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">Đổi mã doanh nghiệp</button>
            </div>
          ) : (
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Mã doanh nghiệp mới (6 ký tự)</label><input type="text" maxLength={6} value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono uppercase" placeholder="VD: CTYA26" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mã mới</label><input type="text" maxLength={6} value={confirmCode} onChange={(e) => setConfirmCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono uppercase" placeholder="Nhập lại mã mới" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setIsEditingCode(false); setCodeMessage({ type: '', text: '' }); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Hủy bỏ</button>
                <button onClick={handleSaveCode} className="bg-rose-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 flex items-center gap-2"><Key className="w-4 h-4" /> Lưu mã mới</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KHU VỰC 3: Thống kê Dịch vụ hệ thống */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> Dịch vụ đang sử dụng</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-lg"><MapPin className="w-6 h-6 text-sky-500 mb-2" /><h4 className="font-bold text-sky-900">Giám sát hành trình</h4><span className="text-xs font-medium text-sky-600">Đang hoạt động</span></div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg opacity-60"><Camera className="w-6 h-6 text-slate-400 mb-2" /><h4 className="font-bold text-slate-600">Camera AI (DMS)</h4><span className="text-xs font-medium text-slate-400">Chưa đăng ký</span></div>
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg"><Users className="w-6 h-6 text-indigo-500 mb-2" /><h4 className="font-bold text-indigo-900">Giới hạn nhân sự</h4><span className="text-xs font-medium text-indigo-600">Tối đa 15 tài khoản</span></div>
        </div>
      </div>

      {/* KHU VỰC 4: Quản trị Nhân sự & Phân quyền */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-sky-500" /> Quản lý Nhân viên & Phân quyền</h3>
            <p className="text-xs text-slate-500 mt-1">Đã dùng: {staffList.filter(s => s.status === 'ACTIVE').length} / 15 tài khoản khả dụng</p>
          </div>
          <div className="flex gap-3">
            {/* Nút thao tác nhanh: Chỉ kích hoạt nổi bật khi có yêu cầu phê duyệt */}
            <button
              onClick={() => setIsApprovalModalOpen(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${pendingStaffList.length > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <UserCheck className="w-4 h-4" />
              Duyệt tài khoản {pendingStaffList.length > 0 && `(${pendingStaffList.length})`}
            </button>
            <button onClick={() => openStaffModal(null)} className="bg-[#0EA5E9] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 transition-all shadow-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Thêm nhân sự
            </button>
          </div>
        </div>

        {/* Bảng dữ liệu nhân sự */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Nhân sự</th>
                <th className="p-4">Quyền truy cập</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {staffList.map((staff) => (
                <tr key={staff.id} className={`hover:bg-slate-50/50 transition-colors ${staff.status === 'DISABLED' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{staff.name}</p>
                    <p className="text-xs text-slate-500">{staff.email}</p>
                    {staff.status === 'PENDING' && <p className="text-[10px] text-amber-500 mt-1">Gửi lúc: {new Date(staff.requestTime).toLocaleString('vi-VN')}</p>}
                  </td>
                  <td className="p-4"><span className="font-medium text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{staff.role === 'TENANT_ADMIN' ? 'Quản lý (Admin)' : 'Nhân viên (Staff)'}</span></td>
                  <td className="p-4 text-center">
                    {/* Render badge (huy hiệu) tùy theo trạng thái */}
                    {staff.status === 'ACTIVE' && <span className="inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Hoạt động</span>}
                    {staff.status === 'PENDING' && <span className="inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 animate-pulse">Chờ duyệt</span>}
                    {staff.status === 'REJECTED' && <span className="inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600">Bị từ chối</span>}
                    {staff.status === 'DISABLED' && <span className="inline-flex text-[11px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-500">Vô hiệu hóa</span>}
                  </td>
                  <td className="p-4 text-right">
                    {/* Render các nút thao tác khác nhau giữa Tài khoản Đang chờ vs Đã duyệt */}
                    {staff.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApproval(staff.id, 'ACTIVE', staff.name, staff.email)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded" title="Duyệt yêu cầu"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleApproval(staff.id, 'REJECTED', staff.name, staff.email)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded" title="Từ chối"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openStaffModal(staff)} className="p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 rounded transition-colors" title="Sửa thông tin"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDisableStaff(staff)} disabled={staff.status === 'DISABLED'} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400" title="Vô hiệu hóa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHU VỰC 5: Nhật ký thao tác (Audit Logs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> Lịch sử Thao tác</h3><p className="text-xs text-slate-500 mt-1">Giám sát toàn bộ hoạt động thay đổi dữ liệu trong hệ thống.</p></div>
        </div>
        <div className="overflow-auto max-h-[300px]">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
              <tr><th className="p-3 pl-5">Thời gian</th><th className="p-3">Người thực hiện</th><th className="p-3">Thao tác</th><th className="p-3">Đối tượng</th><th className="p-3 text-center">Kết quả</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-3 pl-5 whitespace-nowrap text-slate-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {log.timeStr}</td>
                  <td className="p-3 font-medium text-slate-700">{log.user}</td>
                  <td className="p-3 text-sky-600 font-medium">{log.action}</td>
                  <td className="p-3 text-slate-600">{log.target}</td>
                  <td className="p-3 text-center"><span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">{log.result}</span></td>
                </tr>
              ))}
              {activityLogs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Chưa có bản ghi lịch sử nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CÁC MODAL HIỂN THỊ (Nằm ngoài luồng render giao diện tĩnh) --- */}

      {/* MODAL: DUYỆT TÀI KHOẢN */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" /> Danh sách Tài khoản chờ duyệt
              </h2>
              <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-0">
              {pendingStaffList.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Thông tin liên hệ</th>
                      <th className="p-4">Thời gian Đăng ký</th>
                      <th className="p-4 text-right">Phê duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingStaffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{staff.name}</td>
                        <td className="p-4 text-slate-600">{staff.email}</td>
                        <td className="p-4 text-slate-500 text-xs">{new Date(staff.requestTime).toLocaleString('vi-VN')}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApproval(staff.id, 'ACTIVE', staff.name, staff.email)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"><Check className="w-3 h-3" /> Duyệt</button>
                            <button onClick={() => handleApproval(staff.id, 'REJECTED', staff.name, staff.email)} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> Từ chối</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="font-bold">Không có yêu cầu chờ duyệt</p>
                  <p className="text-sm mt-1">Tất cả tài khoản đều đã được xử lý.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsApprovalModalOpen(false)} className="bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA NHÂN SỰ */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {editingStaffId ? <Edit2 className="w-5 h-5 text-sky-500" /> : <UserPlus className="w-5 h-5 text-sky-500" />}
                {editingStaffId ? 'Sửa thông tin Nhân sự' : 'Thêm Nhân sự mới'}
              </h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {staffMessage.text && <div className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-lg flex items-center gap-2 border border-rose-100"><AlertCircle className="w-4 h-4 shrink-0" /> {staffMessage.text}</div>}
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên</label><input type="text" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="VD: Nguyễn Văn A" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Email đăng nhập</label><input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="VD: nguyenvan.a@domain.com" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Quyền truy cập</label><select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm cursor-pointer"><option value="TENANT_STAFF">Nhân viên (Staff)</option><option value="TENANT_ADMIN">Quản lý (Admin)</option></select></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label><select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm cursor-pointer"><option value="ACTIVE">Hoạt động</option><option value="DISABLED">Vô hiệu hóa</option>{!editingStaffId && <option value="PENDING">Chờ duyệt</option>}</select></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">Hủy</button>
              <button onClick={saveStaff} className="bg-[#0EA5E9] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors shadow-sm">{editingStaffId ? 'Cập nhật thông tin' : 'Tạo nhân sự'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}