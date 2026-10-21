import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Loader2 } from 'lucide-react';

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  driver: string | null;
}

const MOCK_VEHICLES_DB: Vehicle[] = [
  { id: 'V001', plateNumber: '51G-123.45', model: 'Toyota Vios 2022', status: 'RENTED', driver: 'Nguyễn Văn A' },
  { id: 'V002', plateNumber: '51H-678.90', model: 'Honda City 2023', status: 'AVAILABLE', driver: null },
  { id: 'V003', plateNumber: '29A-333.44', model: 'Ford Transit', status: 'MAINTENANCE', driver: null },
];

export default function FleetVehicles() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ==========================================
  // 2. METHODS & HANDLERS
  // ==========================================

  /**
   * Giả lập API Fetch danh sách xe từ DB
   */
  const loadVehiclesData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600)); // Delay mô phỏng mạng
      setVehicles(MOCK_VEHICLES_DB);
    } catch (error) {
      console.error("Lỗi get danh sách xe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bắt sự kiện khi người dùng gõ vào ô tìm kiếm (Two-way binding)
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  /**
   * Xử lý điều hướng sang trang chi tiết xe
   */
  const handleViewDetails = (vehicleId: string) => {
    // Tương lai: dùng navigate() của react-router-dom
    console.log(`Navigate: /vehicles/detail/${vehicleId}`);
  };

  /**
   * Helper function: Trả về UI Badge tùy theo trạng thái Enum của xe
   */
  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'AVAILABLE': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded border border-emerald-100">CÓ SẴN</span>;
      case 'RENTED': return <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100">ĐANG THUÊ</span>;
      case 'MAINTENANCE': return <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded border border-amber-100">BẢO DƯỠNG</span>;
      default: return null;
    }
  };

  // ==========================================
  // 3. LIFECYCLE
  // ==========================================
  useEffect(() => {
    loadVehiclesData();
  }, []);

  // ==========================================
  // 4. COMPUTED DATA (Dữ liệu tính toán)
  // ==========================================
  // Lọc trực tiếp trên frontend dựa vào keyword
  const filteredVehicles = vehicles.filter(v =>
    v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // 5. RENDER
  // ==========================================
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
        <h2 className="text-xl font-bold text-slate-800">Danh sách Phương tiện</h2>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm biển số, dòng xe..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        {isLoading ? (
          // Khối hiển thị khi đang tải dữ liệu
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin mb-2" />
            <p className="text-sm text-slate-500 font-medium">Đang đồng bộ dữ liệu xe...</p>
          </div>
        ) : null}

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Biển số</th>
              <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Dòng xe</th>
              <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">Tài xế hiện tại</th>
              <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-700">{vehicle.plateNumber}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.model}</td>
                <td className="px-6 py-4">{getStatusBadge(vehicle.status)}</td>
                <td className="px-6 py-4 text-slate-500">{vehicle.driver || <span className="text-slate-300 italic">Trống</span>}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleViewDetails(vehicle.id)}
                    className="p-1.5 text-slate-400 hover:text-[#0EA5E9] hover:bg-sky-50 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredVehicles.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <Search className="w-8 h-8 text-slate-300 mb-3" />
                    <p>Không tìm thấy xe nào phù hợp với từ khóa "<span className="font-bold">{searchTerm}</span>"</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}