/**
 * @file ContractManagement.tsx
 * @description Quản lý Đối tác, Hợp đồng Vận chuyển & Bản nháp.
 * Tích hợp Phân quyền (RBAC) & PDF Viewer.
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Truck, ShieldCheck, FileText, Printer, Building2,
  User, CreditCard, Eye, Search, PenTool, Lock, ShieldAlert, Edit3, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestPriceChangeModal from '../components/RequestPriceChangeModal';

export default function ContractManagement() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'TENANT_STAFF';
  const tenantId = localStorage.getItem('tenantId') || 'COMPANY_A';

  // KIỂM TRA QUYỀN QUẢN LÝ
  const isManager = userRole === 'TENANT_ADMIN' || userRole === 'SYS_ADMIN' || userRole === 'SUPER_ADMIN_VIEW';

  // Tabs quản lý
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'DRAFT'>('OFFICIAL');

  const [contracts, setContracts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State quản lý xem PDF (PDF Viewer)
  const [viewingContract, setViewingContract] = useState<any | null>(null);

  // State quản lý Modal Yêu cầu Sửa Giá
  const [requestContractId, setRequestContractId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [tenantId]);

  const loadData = () => {
    if (!localStorage.getItem('sys_price_requests')) localStorage.setItem('sys_price_requests', JSON.stringify([]));

    // Load Hợp đồng chính thức
    const allContracts = JSON.parse(localStorage.getItem('sys_e_contracts') || '[]');
    setContracts(allContracts.filter((c: any) => c.tenantId === tenantId).reverse());

    // Load Bản nháp
    const allDrafts = JSON.parse(localStorage.getItem('sys_contract_drafts') || '[]');
    setDrafts(allDrafts.filter((d: any) => d.tenantId === tenantId || !d.tenantId).reverse()); // Giả sử chưa gán tenantId thì vẫn hiển thị để test
  };

  // ==========================================
  // XỬ LÝ GỬI YÊU CẦU SỬA GIÁ TỪ MODAL
  // ==========================================
  const handleSubmitPriceRequest = (reason: string) => {
    if (!requestContractId) return;

    const allContracts = JSON.parse(localStorage.getItem('sys_e_contracts') || '[]');
    const targetContract = allContracts.find((c: any) => c.id === requestContractId);
    const userName = localStorage.getItem('sys_core_role') === 'SUPER_ADMIN' ? 'Hệ thống Admin' : 'Nhân viên A';

    const newRequest = {
      id: `REQ-${Date.now()}`,
      contractId: requestContractId,
      customer: targetContract?.partnerName || 'Khách hàng',
      staff: userName,
      date: new Date().toLocaleString('vi-VN'),
      reason: reason,
      status: 'PENDING',
      managerNote: ''
    };

    const requests = JSON.parse(localStorage.getItem('sys_price_requests') || '[]');
    localStorage.setItem('sys_price_requests', JSON.stringify([newRequest, ...requests]));

    const updatedContracts = allContracts.map((c: any) =>
      c.id === requestContractId ? { ...c, hasPendingRequest: true } : c
    );
    localStorage.setItem('sys_e_contracts', JSON.stringify(updatedContracts));

    loadData();
    setRequestContractId(null);
    alert('Đã gửi yêu cầu phê duyệt thành công! Vui lòng chờ Quản lý duyệt.');
    window.dispatchEvent(new Event('storage'));
  };

  // ==========================================
  // XỬ LÝ BẢN NHÁP
  // ==========================================
  const handleDeleteDraft = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không?')) {
      const updated = drafts.filter(d => d.id !== id);
      localStorage.setItem('sys_contract_drafts', JSON.stringify(updated));
      setDrafts(updated);
    }
  };

  const totalClients = contracts.length;
  const eContractCount = contracts.filter(c => c.type === 'E_CONTRACT' || c.status === 'OFFICIAL').length;

  const displayData = activeTab === 'OFFICIAL' ? contracts : drafts;
  const filteredData = displayData.filter(c =>
    (c.partnerName || c.partyB?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (amount: any) => {
    if (!amount) return '0 VNĐ';
    const num = Number(String(amount).replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">

      {/* CSS CHO CHỨC NĂNG IN (ẨN GIAO DIỆN, CHỈ IN A4) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
          @page { size: A4; margin: 20mm; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      {/* GIAO DIỆN QUẢN LÝ CHÍNH */}
      <div className="no-print flex-1 overflow-auto">
        {/* HEADER KHU VỰC */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span className="hover:text-slate-800 cursor-pointer transition-colors">MENU</span>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-sky-600 cursor-pointer">ĐỐI TÁC & HỢP ĐỒNG</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">Quản lý Đối tác & Hợp đồng</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/create-contract')}
                className="bg-[#0EA5E9] hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <User className="w-4 h-4" /> Thêm hợp đồng mới
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS (Thẻ Thống kê) */}
        <div className="px-6 grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng hợp đồng / Khách</p>
                <h3 className="text-3xl font-bold text-sky-600 leading-none">{totalClients}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500"><Building2 className="w-4 h-4" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hợp đồng chính thức</p>
                <h3 className="text-3xl font-bold text-emerald-600 leading-none">{eContractCount}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><PenTool className="w-4 h-4" /></div>
            </div>
          </div>

          {/* THẺ DOANH THU ĐƯỢC CHE NẾU LÀ NHÂN VIÊN */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doanh thu dự kiến</p>
                <h3 className="text-3xl font-bold text-slate-300 leading-none">
                  {isManager ? '---' : '***'}
                </h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                {isManager ? <CreditCard className="w-4 h-4" /> : <Lock className="w-4 h-4 text-rose-400" />}
              </div>
            </div>
            {!isManager && <p className="text-[10px] font-bold text-rose-500 mt-2">Khu vực giới hạn xem</p>}
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hợp đồng Nháp</p>
                <h3 className="text-3xl font-bold text-amber-500 leading-none">{drafts.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FileText className="w-4 h-4 text-amber-500" /></div>
            </div>
          </div>
        </div>

        {/* BẢNG QUẢN LÝ (TABS) */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button onClick={() => setActiveTab('OFFICIAL')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'OFFICIAL' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Hợp đồng Chính thức ({contracts.length})
              </button>
              <button onClick={() => setActiveTab('DRAFT')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'DRAFT' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Quản lý Bản nháp ({drafts.length})
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo Mã HĐ, Tên..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-sky-500 w-64 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-4 pl-6">Mã Hợp Đồng</th>
                    <th className="p-4">Khách Hàng (Bên Thuê)</th>
                    <th className="p-4">Đơn giá / Trạng thái</th>
                    <th className="p-4">Ngày cập nhật</th>
                    <th className="p-4 text-right pr-6">Thao tác & Phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-600">Chưa có dữ liệu</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 pl-6 font-mono text-slate-600 font-bold text-xs">{item.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{item.partnerName || item.partyB?.name || '(Chưa nhập tên)'}</p>
                          <p className="text-[10px] font-mono text-slate-500">{item.partnerPhone || item.partyB?.phone}</p>
                        </td>
                        <td className="p-4">
                          {activeTab === 'OFFICIAL' ? (
                            <span className="font-bold text-emerald-600">{formatMoney(item.value || item.vehicle?.price)}</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Đang soạn thảo</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{item.date || item.lastModified}</td>

                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2 items-center">

                            {/* NẾU LÀ HỢP ĐỒNG CHÍNH THỨC */}
                            {activeTab === 'OFFICIAL' && (
                              <>
                                <button onClick={() => setViewingContract(item)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded flex items-center gap-1 transition-colors">
                                  <Eye className="w-3.5 h-3.5" /> Xem PDF
                                </button>

                                {isManager ? (
                                  <button onClick={() => alert('Chức năng sửa giá trực tiếp đang cập nhật')} className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold rounded-lg text-xs border border-sky-200 transition-colors flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> Sửa giá
                                  </button>
                                ) : (
                                  item.hasPendingRequest ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1.5 rounded border border-amber-100">
                                      <ShieldAlert className="w-3.5 h-3.5" /> Chờ duyệt sửa
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setRequestContractId(item.id)}
                                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                    >
                                      <Lock className="w-3 h-3" /> Yêu cầu sửa giá
                                    </button>
                                  )
                                )}
                              </>
                            )}

                            {/* NẾU LÀ BẢN NHÁP */}
                            {activeTab === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => navigate('/create-contract', { state: { draftId: item.id } })}
                                  className="px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs font-bold rounded flex items-center gap-1 transition-colors border border-sky-200"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Tiếp tục soạn
                                </button>
                                <button
                                  onClick={() => handleDeleteDraft(item.id)}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GỬI YÊU CẦU SỬA GIÁ */}
      {requestContractId && (
        <RequestPriceChangeModal
          contractId={requestContractId}
          onClose={() => setRequestContractId(null)}
          onSubmit={handleSubmitPriceRequest}
        />
      )}

      {/* =========================================================
          TRÌNH XEM PDF CHUYÊN NGHIỆP (A4 PDF VIEWER)
          ========================================================= */}
      {viewingContract && (
        <div className="fixed inset-0 bg-[#323639] z-[200] flex flex-col no-print animate-in fade-in duration-200">

          {/* Thanh công cụ PDF Viewer */}
          <div className="h-14 bg-[#323639] border-b border-white/10 flex justify-between items-center px-6 shrink-0 shadow-md z-10">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-white/70" />
              <span className="text-white font-medium text-sm truncate max-w-md">HopDong_{viewingContract.id}.pdf</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => window.print()} className="px-3 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-2 text-sm font-bold">
                <Printer className="w-4 h-4" /> In / Tải PDF
              </button>
              <div className="w-px h-6 bg-white/20 mx-2"></div>
              <button onClick={() => setViewingContract(null)} className="px-5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg shadow transition-colors">
                Đóng
              </button>
            </div>
          </div>

          {/* Khu vực hiển thị giấy A4 */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#525659]">
            <div
              className="bg-white shadow-2xl relative animate-in zoom-in-95 duration-200"
              style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.5' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
                <h1 className="text-8xl font-bold tracking-widest -rotate-45">DRIVELINKER</h1>
              </div>

              <div className="text-center mb-8 relative z-10">
                <h2 className="font-bold text-lg mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
                <h3 className="font-bold text-base underline decoration-solid underline-offset-4 mb-6">Độc lập - Tự do - Hạnh phúc</h3>
                <h1 className="text-2xl font-bold mb-2">HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI</h1>
                <p className="text-sm italic">Hôm nay, {viewingContract.date}, tại văn phòng hệ thống DriveLinker, chúng tôi gồm có:</p>
              </div>

              <div className="mb-6 space-y-2 relative z-10">
                <p className="font-bold uppercase">BÊN CHO THUÊ XE (BÊN A):</p>
                <p>Tên tổ chức/Cá nhân: <span className="font-bold">{viewingContract.partyA?.name || 'Đại lý DriveLinker'}</span></p>
                <p>Địa chỉ trụ sở: {viewingContract.partyA?.address || '120 Hoàng Minh Thảo, Đà Nẵng'}</p>
                <p>Điện thoại: {viewingContract.partyA?.phone || '0977.73.74.75'}</p>
              </div>

              <div className="mb-8 space-y-2 relative z-10">
                <p className="font-bold uppercase">BÊN THUÊ XE (BÊN B):</p>
                <p>Ông/Bà: <span className="font-bold uppercase">{viewingContract.partnerName || viewingContract.partyB?.name}</span></p>
                <p>Số CCCD/CMND: <span className="font-bold">{viewingContract.partyB?.cccd || 'Đang cập nhật'}</span></p>
                <p>Điện thoại: <span className="font-bold">{viewingContract.partnerPhone || viewingContract.partyB?.phone}</span></p>
              </div>

              <div className="mb-12 text-justify space-y-4 relative z-10">
                <p className="italic">Sau khi thỏa thuận, hai bên đồng ý ký kết Hợp đồng thuê xe với các điều khoản sau:</p>
                <p className="font-bold">ĐIỀU 1: THÔNG TIN XE VÀ ĐƠN GIÁ THUÊ</p>
                <p>Bên A đồng ý cho Bên B thuê 01 chiếc xe ô tô mang biển kiểm soát: <span className="font-bold">{viewingContract.vehicle?.plate || 'Đang cập nhật'}</span>.</p>
                <p>Đơn giá thuê: <span className="font-bold text-emerald-700">{formatMoney(viewingContract.value || viewingContract.vehicle?.price)} / Ngày</span>.</p>
                <p>Xe được trang bị đầy đủ thiết bị an toàn và hệ thống giám sát hành trình (GPS/Camera) của DriveLinker. Bên B cam kết không tự ý tháo dỡ, can thiệp vào hệ thống này.</p>
              </div>

              <div className="grid grid-cols-2 text-center mt-16 avoid-break relative z-10">
                <div>
                  <p className="font-bold mb-24">ĐẠI DIỆN BÊN A</p>
                  <p className="font-bold">Hệ thống DriveLinker</p>
                </div>
                <div>
                  <p className="font-bold mb-2">ĐẠI DIỆN BÊN B</p>
                  <p className="italic text-sm mb-4">(Ký, ghi rõ họ tên)</p>

                  {viewingContract.signature ? (
                    <div className="h-20 flex justify-center mb-2">
                      <img src={viewingContract.signature} alt="Chữ ký bên B" className="max-h-full mix-blend-multiply" />
                    </div>
                  ) : (
                    <div className="h-20 mb-2"></div>
                  )}

                  <p className="font-bold uppercase">{viewingContract.partnerName || viewingContract.partyB?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          NỘI DUNG CHUYÊN DÙNG ĐỂ IN (MÁY IN SẼ CHỈ LẤY KHỐI NÀY)
          ========================================================= */}
      {viewingContract && (
        <div className="print-only text-black" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.5' }}>
          <div className="text-center mb-8">
            <h2 className="font-bold text-lg mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
            <h3 className="font-bold text-base underline decoration-solid underline-offset-4 mb-6">Độc lập - Tự do - Hạnh phúc</h3>
            <h1 className="text-2xl font-bold mb-2">HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI</h1>
            <p className="text-sm italic">Hôm nay, {viewingContract.date}, tại văn phòng hệ thống DriveLinker, chúng tôi gồm có:</p>
          </div>

          <div className="mb-6 space-y-2">
            <p className="font-bold uppercase">BÊN CHO THUÊ XE (BÊN A):</p>
            <p>Tên tổ chức/Cá nhân: <span className="font-bold">{viewingContract.partyA?.name || 'Đại lý DriveLinker'}</span></p>
            <p>Địa chỉ trụ sở: {viewingContract.partyA?.address || '120 Hoàng Minh Thảo, Đà Nẵng'}</p>
            <p>Điện thoại: {viewingContract.partyA?.phone || '0977.73.74.75'}</p>
          </div>

          <div className="mb-8 space-y-2">
            <p className="font-bold uppercase">BÊN THUÊ XE (BÊN B):</p>
            <p>Ông/Bà: <span className="font-bold uppercase">{viewingContract.partnerName || viewingContract.partyB?.name}</span></p>
            <p>Số CCCD/CMND: <span className="font-bold">{viewingContract.partyB?.cccd || 'Đang cập nhật'}</span></p>
            <p>Điện thoại: <span className="font-bold">{viewingContract.partnerPhone || viewingContract.partyB?.phone}</span></p>
          </div>

          <div className="mb-12 text-justify space-y-4">
            <p className="italic">Sau khi thỏa thuận, hai bên đồng ý ký kết Hợp đồng thuê xe với các điều khoản sau:</p>
            <p className="font-bold">ĐIỀU 1: THÔNG TIN XE VÀ ĐƠN GIÁ THUÊ</p>
            <p>Bên A đồng ý cho Bên B thuê 01 chiếc xe ô tô mang biển kiểm soát: <span className="font-bold">{viewingContract.vehicle?.plate || 'Đang cập nhật'}</span>.</p>
            <p>Đơn giá thuê: <span className="font-bold">{formatMoney(viewingContract.value || viewingContract.vehicle?.price)} / Ngày</span>.</p>
            <p>Xe được trang bị đầy đủ thiết bị an toàn và hệ thống giám sát hành trình (GPS/Camera) của DriveLinker. Bên B cam kết không tự ý tháo dỡ, can thiệp vào hệ thống này.</p>
          </div>

          <div className="grid grid-cols-2 text-center mt-16 avoid-break">
            <div>
              <p className="font-bold mb-24">ĐẠI DIỆN BÊN A</p>
              <p className="font-bold">Hệ thống DriveLinker</p>
            </div>
            <div>
              <p className="font-bold mb-2">ĐẠI DIỆN BÊN B</p>
              <p className="italic text-sm mb-4">(Ký, ghi rõ họ tên)</p>
              {viewingContract.signature ? (
                <div className="h-20 flex justify-center mb-2">
                  <img src={viewingContract.signature} alt="Chữ ký bên B" className="max-h-full mix-blend-multiply" />
                </div>
              ) : (
                <div className="h-20 mb-2"></div>
              )}
              <p className="font-bold uppercase">{viewingContract.partnerName || viewingContract.partyB?.name}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}