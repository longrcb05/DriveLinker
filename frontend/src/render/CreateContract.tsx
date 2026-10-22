import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, PhoneCall, FileText, Truck, Save, PlusCircle } from 'lucide-react';

export default function CreateContract() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6">

            {/* HEADER & NÚT QUAY LẠI */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <span onClick={() => navigate('/partners')} className="hover:text-slate-800 cursor-pointer transition-colors">
                            Fleet Operations
                        </span>
                        <ChevronLeft className="w-3 h-3 mx-1" />
                        <span className="text-sky-600">Tạo mới hợp đồng</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Biểu mẫu Hợp đồng Thuê xe Điện tử</h2>
                    <span className="inline-block mt-2 px-2 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-md">
                        ● Digital Rental & Onboarding Form
                    </span>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Nhập lại
                    </button>
                    <button className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors">
                        Lưu bản nháp
                    </button>
                </div>
            </div>

            {/* KHUNG FORM CHÍNH */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* CỘT TRÁI (2/3 chiều rộng) */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Section 1: Thông tin người thuê */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                                Thông tin người thuê xe (Bên B)
                            </h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">BẮT BUỘC</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên người thuê xe *</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input type="text" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Nguyễn Văn Hùng" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại người thuê *</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="0812 839 281" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Giấy tờ pháp lý */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                            Giấy tờ pháp lý & Định danh điện tử (CCCD & GPLX)
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Khối CCCD */}
                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-sky-500" /> Căn cước công dân (CCCD gắn chip)</h4>
                                {/* Thêm các input CCCD vào đây */}
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3" placeholder="Số CCCD (12 chữ số)" />
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="border border-dashed border-sky-300 bg-sky-50 text-sky-600 py-4 rounded-lg text-xs font-bold flex flex-col items-center gap-1 hover:bg-sky-100">
                                        <PlusCircle className="w-4 h-4" /> Ảnh mặt trước
                                    </button>
                                    <button className="border border-dashed border-sky-300 bg-sky-50 text-sky-600 py-4 rounded-lg text-xs font-bold flex flex-col items-center gap-1 hover:bg-sky-100">
                                        <PlusCircle className="w-4 h-4" /> Ảnh mặt sau
                                    </button>
                                </div>
                            </div>
                            {/* Khối GPLX */}
                            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500" /> Giấy phép lái xe</h4>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Số Giấy phép lái xe" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* CỘT PHẢI (1/3 chiều rộng) */}
                <div className="space-y-6">

                    {/* Section 2: Người thân bảo lãnh (Giao diện cảnh báo đỏ) */}
                    <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">2</span>
                            SĐT Người thân & Bảo lãnh khẩn cấp
                        </h3>
                        <div className="bg-rose-50 text-rose-600 text-[11px] p-3 rounded-lg font-medium mb-4 flex items-start gap-2">
                            <PhoneCall className="w-4 h-4 shrink-0 mt-0.5" />
                            Gọi can thiệp ngay khi tài xế không nghe máy hoặc phương tiện có cảnh báo ngắt định vị GPS.
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Họ tên người bảo lãnh *</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Nguyễn Thị Mai Hương" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại khẩn cấp *</label>
                                <input type="text" className="w-full px-3 py-2 border border-rose-300 bg-rose-50/30 rounded-lg text-sm text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 outline-none" placeholder="0983 194 022" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* BAR NÚT LƯU Ở ĐÁY BÀN HÌNH */}
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium max-w-lg">
                    Hợp đồng điện tử và dữ liệu GPS/viễn thông được mã hóa theo tiêu chuẩn Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
                </p>
                <button className="px-6 py-2.5 bg-[#0EA5E9] hover:bg-sky-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95">
                    <Save className="w-4 h-4" /> Tạo hợp đồng
                </button>
            </div>

        </div>
    );
}