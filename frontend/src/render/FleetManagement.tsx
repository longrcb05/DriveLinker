import { dlDialog } from '../context/DialogContext';
/**
 * @file FleetManagement.tsx
 * @description Trang Quản lý & Theo dõi Đội xe (Fleet Tracking) hoàn chỉnh.
 * Hỗ trợ 6 trạng thái phương tiện, CRUD phương tiện, kiểm tra ràng buộc,
 * tích hợp bộ lọc, tìm kiếm và hỗ trợ song ngữ Tiếng Việt - English.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Truck, Search, Plus, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Wrench, ShieldAlert, Edit3, Trash2, Eye, X, Phone,
  ChevronRight, Car
} from 'lucide-react';
import { vehicleService, type Vehicle, type VehicleStatus } from '../services/vehicleService';
import { useLanguage } from '../context/LanguageContext';

export default function FleetManagement() {
  const { t } = useLanguage();
  const tenantId = localStorage.getItem('tenantId') || 'COMPANY_A';
  const userRole = localStorage.getItem('userRole') || 'TENANT_STAFF';
  const isManager = userRole === 'TENANT_ADMIN' || userRole === 'SYS_ADMIN' || userRole === 'SUPER_ADMIN_VIEW';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | 'ALL'>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [inspectingVehicle, setInspectingVehicle] = useState<Vehicle | null>(null);

  // Form state for Add / Edit
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    payload: 'Xe Tải 5 Tấn',
    status: 'AVAILABLE' as VehicleStatus,
    driver: '',
    driverPhone: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string>('');

  // State thông tin hợp đồng tạm / đặt trước xe
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    phone: '',
    idCard: '',
    startDate: '',
    endDate: '',
    deposit: 5000000,
    notes: '',
  });

  // Xử lý xác nhận đã bảo trì xong
  const handleCompleteMaintenance = async (v: Vehicle) => {
    const ok = await dlDialog.confirm(`Xác nhận phương tiện ${v.plate} đã hoàn thành bảo dưỡng và sẵn sàng bàn giao đón khách?`, { title: 'Hoàn tất bảo dưỡng', type: 'success' });
    if (!ok) return;
    try {
      await vehicleService.completeMaintenance(tenantId, v.id);
      await loadVehicles();
      dlDialog.alert(`Phương tiện ${v.plate} đã hoàn tất bảo trì và chuyển sang trạng thái SẴN SÀNG CHO THUÊ!`, { title: 'Nghiệm thu thành công', type: 'success' });
    } catch (err: any) {
      dlDialog.alert(err.message || 'Lỗi cập nhật bảo trì.', { title: 'Thông báo lỗi', type: 'danger' });
    }
  };

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getFleetList(tenantId);
      setVehicles(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách xe:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadVehicles();

    // Lắng nghe sự kiện cập nhật dữ liệu từ các tab hoặc component khác
    let debounceTimer: any = null;
    const handleStorageUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadVehicles();
      }, 500);
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('dl_vehicles_updated', handleStorageUpdate);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('dl_vehicles_updated', handleStorageUpdate);
    };
  }, [loadVehicles]);

  // Thống kê KPI
  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'AVAILABLE').length,
      rented: vehicles.filter(v => v.status === 'RENTED').length,
      reserved: vehicles.filter(v => v.status === 'RESERVED').length,
      maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
      pendingInspection: vehicles.filter(v => v.status === 'PENDING_INSPECTION').length,
      inactive: vehicles.filter(v => v.status === 'INACTIVE').length,
    };
  }, [vehicles]);

  // Bộ lọc dữ liệu
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchStatus = selectedStatus === 'ALL' || v.status === selectedStatus;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.driver && v.driver.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [vehicles, selectedStatus, searchTerm]);

  // Mở modal thêm xe
  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      plate: '',
      brand: 'Hyundai',
      model: 'HD72',
      year: new Date().getFullYear(),
      payload: 'Xe Tải 3.5 Tấn',
      status: 'AVAILABLE',
      driver: '',
      driverPhone: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Mở modal sửa xe
  const handleOpenEditModal = (vehicle: Vehicle) => {
    if (vehicle.status === 'RENTED') {
      dlDialog.alert('Phương tiện đang trong hợp đồng cho thuê trên đường, không thể chỉnh sửa trạng thái!', { title: 'Cảnh báo ràng buộc', type: 'warning' });
      return;
    }
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      payload: vehicle.payload,
      status: vehicle.status,
      driver: vehicle.driver || '',
      driverPhone: vehicle.driverPhone || '',
      notes: vehicle.notes || '',
    });
    if (vehicle.reservationInfo) {
      setReservationForm({
        customerName: vehicle.reservationInfo.customerName || '',
        phone: vehicle.reservationInfo.phone || '',
        idCard: vehicle.reservationInfo.idCard || '',
        startDate: vehicle.reservationInfo.startDate || '',
        endDate: vehicle.reservationInfo.endDate || '',
        deposit: vehicle.reservationInfo.deposit || 5000000,
        notes: vehicle.reservationInfo.notes || '',
      });
    } else {
      setReservationForm({
        customerName: '',
        phone: '',
        idCard: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        deposit: 5000000,
        notes: '',
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  // Lưu Form Thêm / Sửa
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate.trim()) {
      setFormError('Vui lòng nhập biển số xe.');
      return;
    }

    try {
      if (editingVehicle) {
        if (formData.status === 'RESERVED' && reservationForm.customerName) {
          await vehicleService.reserveVehicle(tenantId, editingVehicle.id, reservationForm);
          await vehicleService.updateVehicle(tenantId, editingVehicle.id, {
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
            payload: formData.payload,
            driver: formData.driver,
            driverPhone: formData.driverPhone,
          });
        } else {
          await vehicleService.updateVehicle(tenantId, editingVehicle.id, formData);
        }
      } else {
        const created = await vehicleService.createVehicle(tenantId, formData);
        if (formData.status === 'RESERVED' && reservationForm.customerName) {
          await vehicleService.reserveVehicle(tenantId, created.id, reservationForm);
        }
      }
      setIsModalOpen(false);
      await loadVehicles();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu phương tiện.');
    }
  };

  // Xóa phương tiện
  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return;
    try {
      await vehicleService.deleteVehicle(tenantId, deletingVehicle.id);
      setDeletingVehicle(null);
      await loadVehicles();
    } catch (err: any) {
      dlDialog.alert(err.message || 'Lỗi khi xóa phương tiện.', { title: 'Không thể xóa xe', type: 'danger' });
    }
  };

  // Xử lý kiểm tra nghiệm thu (từ PENDING_INSPECTION sang AVAILABLE hoặc MAINTENANCE)
  const handleConfirmInspection = async (targetStatus: 'AVAILABLE' | 'MAINTENANCE') => {
    if (!inspectingVehicle) return;
    try {
      await vehicleService.updateVehicleStatus(
        tenantId,
        inspectingVehicle.id,
        targetStatus,
        targetStatus === 'AVAILABLE'
          ? 'Nghiệm thu đạt chuẩn - sẵn sàng cho thuê tiếp'
          : 'Phát hiện hư hỏng sau chuyến đi - chuyển xưởng sửa chữa'
      );
      setInspectingVehicle(null);
      await loadVehicles();
    } catch (err: any) {
      dlDialog.alert(err.message, { title: 'Thông báo', type: 'warning' });
    }
  };

  // Badge màu sắc cho từng trạng thái
  const renderStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('fleet.statusAvailable')}
          </span>
        );
      case 'RENTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            {t('fleet.statusRented')}
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            {t('fleet.statusReserved')}
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            {t('fleet.statusMaintenance')}
          </span>
        );
      case 'PENDING_INSPECTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {t('fleet.statusPendingInspection')}
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t('fleet.statusInactive')}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6 font-sans">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            <span className="hover:text-slate-800 cursor-pointer">{t('overview.breadcrumbHome')}</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-slate-400" />
            <span className="text-sky-600 font-extrabold">{t('nav.fleet')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-sky-600" />
            {t('fleet.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('fleet.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadVehicles}
            disabled={loading}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>

          {isManager && (
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('fleet.addVehicle')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS KPI CARDS (6 Trạng thái - Đã khắc phục lỗi mờ chữ & hỗ trợ Toggle) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400 scale-[1.02]'
              : 'bg-white hover:border-slate-300 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t('fleet.kpiTotal')}</span>
            <Car className="w-4 h-4 opacity-70" />
          </div>
          <h3 className="text-2xl font-black">{stats.total}</h3>
          <p className="text-[10px] mt-1 opacity-70">{t('common.all')}</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'AVAILABLE'
              ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300 scale-[1.02]'
              : 'bg-white hover:border-emerald-200 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {t('fleet.kpiAvailable')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950">{stats.available}</h3>
          <p className="text-[10px] text-emerald-700 font-medium mt-1">{t('fleet.subAvailable')}</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'RENTED' ? 'ALL' : 'RENTED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'RENTED'
              ? 'bg-sky-50 border-2 border-sky-500 shadow-md ring-2 ring-sky-300 scale-[1.02]'
              : 'bg-white hover:border-sky-200 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">{t('fleet.kpiRented')}</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-2xl font-black text-sky-950">{stats.rented}</h3>
          <p className="text-[10px] text-sky-700 font-medium mt-1">{t('fleet.subRented')}</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'RESERVED' ? 'ALL' : 'RESERVED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'RESERVED'
              ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md ring-2 ring-indigo-300 scale-[1.02]'
              : 'bg-white hover:border-indigo-200 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">{t('fleet.kpiReserved')}</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-indigo-950">{stats.reserved}</h3>
          <p className="text-[10px] text-indigo-700 font-medium mt-1">{t('fleet.subReserved')}</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'MAINTENANCE'
              ? 'bg-amber-50 border-2 border-amber-500 shadow-md ring-2 ring-amber-300 scale-[1.02]'
              : 'bg-white hover:border-amber-200 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t('fleet.kpiMaintenance')}</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-amber-950">{stats.maintenance}</h3>
          <p className="text-[10px] text-amber-700 font-medium mt-1">{t('fleet.subMaintenance')}</p>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'PENDING_INSPECTION' ? 'ALL' : 'PENDING_INSPECTION')}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedStatus === 'PENDING_INSPECTION'
              ? 'bg-rose-50 border-2 border-rose-500 shadow-md ring-2 ring-rose-300 scale-[1.02]'
              : 'bg-white hover:border-rose-200 text-slate-700 hover:shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              {t('fleet.kpiPendingInspection')}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-rose-950">{stats.pendingInspection}</h3>
          <p className="text-[10px] text-rose-700 font-medium mt-1">{t('fleet.subPendingInspection')}</p>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & STATUS FILTER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('fleet.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">{t('fleet.filterAllStatus')} ({vehicles.length})</option>
            <option value="AVAILABLE">{t('fleet.statusAvailable')} ({stats.available})</option>
            <option value="RENTED">{t('fleet.statusRented')} ({stats.rented})</option>
            <option value="RESERVED">{t('fleet.statusReserved')} ({stats.reserved})</option>
            <option value="MAINTENANCE">{t('fleet.statusMaintenance')} ({stats.maintenance})</option>
            <option value="PENDING_INSPECTION">{t('fleet.statusPendingInspection')} ({stats.pendingInspection})</option>
            <option value="INACTIVE">{t('fleet.statusInactive')} ({stats.inactive})</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN VEHICLE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">{t('fleet.colPlate')}</th>
                <th className="p-4">{t('fleet.colType')}</th>
                <th className="p-4">{t('fleet.colStatus')}</th>
                <th className="p-4">{t('fleet.colTelemetry')}</th>
                <th className="p-4">{t('fleet.colDriver')}</th>
                <th className="p-4 pr-6 text-right">{t('fleet.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-bold text-slate-600 text-sm">{t('common.noData')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('fleet.noVehiclesFiltered')}</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Cột 1: Biển số & Hãng */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700 font-bold">
                          <Car className="w-4 h-4 text-sky-600" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {v.plate}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {v.brand} {v.model} ({v.year})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Loại xe & Tải trọng */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{v.payload}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {v.id}</p>
                    </td>

                    {/* Cột 3: Trạng thái */}
                    <td className="p-4">
                      {renderStatusBadge(v.status)}
                      {v.status === 'MAINTENANCE' && isManager && (
                        <button
                          onClick={() => handleCompleteMaintenance(v)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã bảo trì xong
                        </button>
                      )}
                      {v.status === 'PENDING_INSPECTION' && isManager && (
                        <button
                          onClick={() => setInspectingVehicle(v)}
                          className="mt-1.5 block text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                        >
                          {t('fleet.inspectNowBtn')}
                        </button>
                      )}
                    </td>

                    {/* Cột 4: Telematics IoT */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{t('fleet.gpsOnline')}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {v.speed || '0 km/h'} • {t('fleet.gpsCoords')} {v.lat?.toFixed(3)}, {v.lng?.toFixed(3)}
                        </div>
                      </div>
                    </td>

                    {/* Cột 5: Tài xế phụ trách */}
                    <td className="p-4">
                      {v.driver && v.driver !== 'Chưa xếp tài' && v.driver !== 'Unassigned' ? (
                        <div>
                          <p className="font-bold text-slate-800">{v.driver}</p>
                          {v.driverPhone && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {v.driverPhone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {t('fleet.unassignedDriver')}
                        </span>
                      )}
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingVehicle(v)}
                          title={t('common.details')}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isManager && (
                          <>
                            {v.status === 'RENTED' ? (
                              <button
                                disabled
                                title="Xe đang cho thuê trên lộ trình, không thể can thiệp trạng thái!"
                                className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                              >
                                <Edit3 className="w-4 h-4 opacity-40" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenEditModal(v)}
                                title={t('common.edit')}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setDeletingVehicle(v)}
                              title={t('common.delete')}
                              disabled={v.status === 'RENTED'}
                              className={`p-1.5 rounded-lg transition ${
                                v.status === 'RENTED'
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
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

      {/* ================= MODAL: THÊM / SỬA PHƯƠNG TIỆN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingVehicle ? t('fleet.editVehicle') : t('fleet.addVehicle')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formPlate')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingVehicle}
                    value={formData.plate}
                    onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    placeholder="VD: 43A-123.45"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase outline-none focus:border-sky-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formBrand')}
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="VD: Hyundai, Toyota..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formModel')}
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    placeholder={t('fleet.formModelPlaceholder') || 'VD: Solati 16 seats, Hino 500...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formYear')}
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formPayload')}
                  </label>
                  <input
                    type="text"
                    value={formData.payload}
                    onChange={e => setFormData({ ...formData, payload: e.target.value })}
                    placeholder={t('fleet.formPayloadPlaceholder') || 'VD: 5 Ton Truck, 16 Seats...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formStatus')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                  >
                    <option value="AVAILABLE">{t('fleet.statusAvailable')}</option>
                    <option value="RESERVED">{t('fleet.statusReserved')}</option>
                    <option value="MAINTENANCE">{t('fleet.statusMaintenance')}</option>
                    <option value="PENDING_INSPECTION">{t('fleet.statusPendingInspection')}</option>
                    <option value="INACTIVE">{t('fleet.statusInactive')}</option>
                  </select>
                </div>
              </div>

              {/* Form Hợp đồng tạm / Thông tin đặt trước khi chọn RESERVED */}
              {formData.status === 'RESERVED' && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs border-b border-indigo-200 pb-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Thông tin Đặt trước xe (Lên hợp đồng tạm)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên khách hàng (*)</label>
                      <input
                        type="text"
                        required
                        value={reservationForm.customerName}
                        onChange={e => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                        placeholder="VD: Nguyễn Văn B..."
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại (*)</label>
                      <input
                        type="tel"
                        required
                        value={reservationForm.phone}
                        onChange={e => setReservationForm({ ...reservationForm, phone: e.target.value })}
                        placeholder="VD: 0905123456"
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số CCCD / CMND</label>
                      <input
                        type="text"
                        value={reservationForm.idCard}
                        onChange={e => setReservationForm({ ...reservationForm, idCard: e.target.value })}
                        placeholder="048099..."
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày giờ nhận xe</label>
                      <input
                        type="datetime-local"
                        value={reservationForm.startDate}
                        onChange={e => setReservationForm({ ...reservationForm, startDate: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày giờ trả dự kiến</label>
                      <input
                        type="datetime-local"
                        value={reservationForm.endDate}
                        onChange={e => setReservationForm({ ...reservationForm, endDate: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiền cọc giữ chỗ (VNĐ)</label>
                      <input
                        type="number"
                        value={reservationForm.deposit}
                        onChange={e => setReservationForm({ ...reservationForm, deposit: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ghi chú hợp đồng tạm</label>
                      <input
                        type="text"
                        value={reservationForm.notes}
                        onChange={e => setReservationForm({ ...reservationForm, notes: e.target.value })}
                        placeholder="VD: Dự án công trình, cọc giữ xe..."
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formDriver')}
                  </label>
                  <input
                    type="text"
                    value={formData.driver}
                    onChange={e => setFormData({ ...formData, driver: e.target.value })}
                    placeholder={t('fleet.modalDriver') || 'Driver full name'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('fleet.formDriverPhone')}
                  </label>
                  <input
                    type="text"
                    value={formData.driverPhone}
                    onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                    placeholder="09xx.xxx.xxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow transition"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN XÓA PHƯƠNG TIỆN ================= */}
      {deletingVehicle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{t('fleet.deleteVehicle')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {t('fleet.confirmDelete')}
              <br />
              <strong className="text-slate-800 font-mono mt-1 block">{t('fleet.plateLabel')} {deletingVehicle.plate}</strong>
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingVehicle(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: KIỂM ĐỊNH NGHIỆM THU XE ================= */}
      {inspectingVehicle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{t('fleet.inspectModalTitle')}</h3>
            <p className="text-xs text-slate-500 mb-6">
              {t('fleet.inspectModalDesc')} (<strong className="text-slate-800 font-mono">{inspectingVehicle.plate}</strong>)
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleConfirmInspection('AVAILABLE')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('fleet.inspectPassLabel')}
              </button>
              <button
                onClick={() => handleConfirmInspection('MAINTENANCE')}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Wrench className="w-4 h-4" />
                {t('fleet.inspectFailLabel')}
              </button>
              <button
                onClick={() => setInspectingVehicle(null)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHI TIẾT PHƯƠNG TIỆN ================= */}
      {viewingVehicle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">{t('fleet.modalDetailsTitle')}</h3>
              </div>
              <button onClick={() => setViewingVehicle(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-mono text-base font-extrabold text-slate-800">{viewingVehicle.plate}</span>
                  <p className="text-slate-500 mt-0.5">{viewingVehicle.brand} {viewingVehicle.model} ({viewingVehicle.year})</p>
                </div>
                {renderStatusBadge(viewingVehicle.status)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('fleet.modalPayload')}</span>
                  <span className="font-bold text-slate-700">{viewingVehicle.payload}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('fleet.modalDriver')}</span>
                  <span className="font-bold text-slate-700">{viewingVehicle.driver || t('fleet.unassignedDriver')}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('fleet.modalGps')}</span>
                  <span className="font-mono text-slate-700 font-bold">{viewingVehicle.lat?.toFixed(4)}, {viewingVehicle.lng?.toFixed(4)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t('fleet.modalSpeed')}</span>
                  <span className="font-bold text-emerald-600">{viewingVehicle.speed || '0 km/h'}</span>
                </div>
              </div>

              {viewingVehicle.reservationInfo && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-indigo-900">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-800 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" /> Thông tin Đặt trước / Hợp đồng tạm:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p>Khách hàng: <strong>{viewingVehicle.reservationInfo.customerName}</strong></p>
                    <p>Điện thoại: <strong>{viewingVehicle.reservationInfo.phone}</strong></p>
                    <p>Nhận xe: <span className="font-mono">{viewingVehicle.reservationInfo.startDate}</span></p>
                    <p>Trả xe: <span className="font-mono">{viewingVehicle.reservationInfo.endDate}</span></p>
                    <p className="col-span-2">Tiền cọc giữ chỗ: <strong className="text-emerald-700">{Number(viewingVehicle.reservationInfo.deposit || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
                  </div>
                </div>
              )}

              {viewingVehicle.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  <span className="font-bold block mb-1">{t('fleet.modalNotes')}</span>
                  <p>{viewingVehicle.notes}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingVehicle(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

