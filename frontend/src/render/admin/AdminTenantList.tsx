import React, { useState, useEffect, useMemo } from 'react';
import { auditDate, formatAuditTime, readAdminAuditLogs, recordAdminAction } from './adminAudit';
import type { AdminAuditLog } from './adminAudit';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Server,
  LogOut,
  ArrowRight,
  ArrowLeft,
  UserCircle,
  Plus,
  Info,
  MapPin,
  Phone,
  User,
  X,
  History,
  Clock,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Ban,
  Car,
  Calendar,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Mail,
  Receipt,
  Banknote,
  QrCode,
  Wallet,
  Upload,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import AdminBillingManagement from './AdminBillingManagement';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
export type SubscriptionPlan = 'TRIAL_14D' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type RenewPaymentMethod = 'BANK_TRANSFER' | 'ONLINE_GATEWAY' | 'CASH';

export interface TenantRecord {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  monthlyFee: number;
  maxVehicles: number;
  activatedAt: string;
  expiresAt: string;
  notes?: string;
}

interface PlanConfig {
  key: SubscriptionPlan;
  label: string;
  monthlyFee: number;
  maxVehicles: number;
  defaultDays: number;
  badgeClass: string;
}

const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  TRIAL_14D: {
    key: 'TRIAL_14D',
    label: 'Dùng thử (14 ngày)',
    monthlyFee: 0,
    maxVehicles: 5,
    defaultDays: 14,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  STARTER: {
    key: 'STARTER',
    label: 'Starter (Cơ bản)',
    monthlyFee: 990000,
    maxVehicles: 15,
    defaultDays: 30,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  PRO: {
    key: 'PRO',
    label: 'Professional (Chuyên nghiệp)',
    monthlyFee: 2490000,
    maxVehicles: 50,
    defaultDays: 30,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    label: 'Enterprise (Không giới hạn)',
    monthlyFee: 4990000,
    maxVehicles: 200,
    defaultDays: 365,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  }
};

const PHONE_REGEX = /^0\d{9}$/;
const CODE_REGEX = /^[A-Z0-9]{4,12}$/;

const addDaysISO = (baseDateStr: string, days: number): string => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().split('T')[0];
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
};

const formatDateVN = (isoDate?: string): string => {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getRemainingDays = (expiresAt?: string): number => {
  if (!expiresAt) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const buildSeedTenants = (): TenantRecord[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'COMPANY_A',
      name: 'Demo CTY A',
      code: 'CTYA26',
      ownerName: 'Trần Văn A',
      phone: '0901234567',
      email: 'vanhanh@ctya-rental.vn',
      address: '123 Nguyễn Văn Linh, Đà Nẵng',
      status: 'ACTIVE',
      plan: 'PRO',
      monthlyFee: 2490000,
      maxVehicles: 50,
      activatedAt: addDaysISO(today, -120),
      expiresAt: addDaysISO(today, 45),
      notes: ''
    },
    {
      id: 'COMPANY_B',
      name: 'Demo CTY B',
      code: 'CTYB26',
      ownerName: 'Lê Thị B',
      phone: '0912345678',
      email: 'contact@ctyb-fleet.vn',
      address: '456 Lê Duẩn, Hà Nội',
      status: 'TRIAL',
      plan: 'TRIAL_14D',
      monthlyFee: 0,
      maxVehicles: 5,
      activatedAt: addDaysISO(today, -9),
      expiresAt: addDaysISO(today, 5),
      notes: ''
    },
    {
      id: 'COMPANY_C',
      name: 'Demo CTY C',
      code: 'CTYC26',
      ownerName: 'Phạm Văn C',
      phone: '0987654321',
      email: 'admin@ctyc-car.vn',
      address: '789 Nguyễn Huệ, TP. HCM',
      status: 'ACTIVE',
      plan: 'STARTER',
      monthlyFee: 990000,
      maxVehicles: 15,
      activatedAt: addDaysISO(today, -30),
      expiresAt: addDaysISO(today, 30),
      notes: ''
    }
  ];
};

const normalizeTenantList = (rawList: any[]): TenantRecord[] => {
  const today = new Date().toISOString().split('T')[0];
  return rawList.map((item, idx) => {
    const planKey: SubscriptionPlan =
      item.plan && PLAN_CONFIGS[item.plan as SubscriptionPlan]
        ? (item.plan as SubscriptionPlan)
        : idx === 0
          ? 'PRO'
          : idx === 1
            ? 'TRIAL_14D'
            : 'STARTER';

    const planCfg = PLAN_CONFIGS[planKey];
    const status: TenantStatus =
      item.status === 'ACTIVE' || item.status === 'TRIAL' || item.status === 'SUSPENDED'
        ? item.status
        : planKey === 'TRIAL_14D'
          ? 'TRIAL'
          : 'ACTIVE';

    return {
      id: item.id || `COMPANY_${Date.now()}_${idx}`,
      name: item.name || `Doanh nghiệp #${idx + 1}`,
      code: String(item.code || `CTY${260 + idx}`).toUpperCase(),
      ownerName: item.ownerName || 'Chưa cập nhật',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || 'Chưa cập nhật',
      status,
      plan: planKey,
      monthlyFee:
        typeof item.monthlyFee === 'number' ? item.monthlyFee : planCfg.monthlyFee,
      maxVehicles:
        typeof item.maxVehicles === 'number' && item.maxVehicles > 0
          ? item.maxVehicles
          : planCfg.maxVehicles,
      activatedAt: item.activatedAt || addDaysISO(today, -30),
      expiresAt: item.expiresAt || addDaysISO(today, planCfg.defaultDays),
      notes: item.notes || ''
    };
  });
};

export default function AdminTenantList() {
  const navigate = useNavigate();

  // Điều hướng nội bộ: Danh sách Doanh nghiệp | Công nợ & Thanh toán | Trang Phương thức Thanh toán Gia hạn
  const [activeSection, setActiveSection] = useState<'tenants' | 'billing' | 'renew_payment'>('tenants');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});

  // State quản lý Modals
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | number | null>(null);
  const [auditAdmin, setAuditAdmin] = useState('');
  const [auditDay, setAuditDay] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const adminKey = (log: AdminAuditLog) => log.username ? `user:${log.username}` : `name:${log.admin || 'Không rõ'}`;
  const adminOptions = Array.from(new Map(auditLogs.map(log => [adminKey(log), log.username ? `${log.admin || 'Không rõ'} (${log.username})` : log.admin || 'Không rõ'])).entries());
  const actionOptions = Array.from(new Set(auditLogs.map(log => log.action).filter((action): action is string => Boolean(action)))).sort();
  const filteredAuditLogs = auditLogs.filter(log => (!auditAdmin || adminKey(log) === auditAdmin) && (!auditDay || auditDate(log) === auditDay) && (!auditAction || log.action === auditAction));

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TenantStatus | 'EXPIRING'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | SubscriptionPlan>('ALL');

  // Modal Thêm / Sửa Doanh nghiệp
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [formError, setFormError] = useState('');

  const [formValues, setFormValues] = useState<{
    name: string;
    code: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    status: TenantStatus;
    plan: SubscriptionPlan;
    monthlyFee: string;
    maxVehicles: string;
    activatedAt: string;
    expiresAt: string;
    notes: string;
  }>({
    name: '',
    code: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    status: 'TRIAL',
    plan: 'TRIAL_14D',
    monthlyFee: '0',
    maxVehicles: '5',
    activatedAt: new Date().toISOString().split('T')[0],
    expiresAt: addDaysISO(new Date().toISOString().split('T')[0], 14),
    notes: ''
  });

  // State Gia hạn & Trang Phương thức Thanh toán
  const [renewTenant, setRenewTenant] = useState<TenantRecord | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<SubscriptionPlan>('PRO');
  const [renewMonths, setRenewMonths] = useState<number>(1);

  const [paymentMethod, setPaymentMethod] = useState<RenewPaymentMethod>('BANK_TRANSFER');
  const [gatewayProvider, setGatewayProvider] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [paymentTxCode, setPaymentTxCode] = useState('');
  const [paymentVoucherCode, setPaymentVoucherCode] = useState('');
  const [paymentVoucherImage, setPaymentVoucherImage] = useState('');
  const [paymentPaidAt, setPaymentPaidAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentNote, setPaymentNote] = useState('');
  const [confirmPaymentNow, setConfirmPaymentNow] = useState(true);
  const [paymentError, setPaymentError] = useState('');

  const adminName = sessionStorage.getItem('sys_core_admin_name') || 'Quản trị viên';

  const loadData = () => {
    try {
      const raw = localStorage.getItem('sys_tenants');
      let list: TenantRecord[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = normalizeTenantList(parsed);
        } else {
          list = buildSeedTenants();
        }
      } else {
        list = buildSeedTenants();
      }

      localStorage.setItem('sys_tenants', JSON.stringify(list));
      setTenants(list);

      const counts: Record<string, number> = {};
      list.forEach((tenant, idx) => {
        const tenantVehiclesRaw = localStorage.getItem(`sys_vehicles_${tenant.id}`);
        if (tenantVehiclesRaw) {
          const vList = JSON.parse(tenantVehiclesRaw);
          counts[tenant.id] = Array.isArray(vList) ? vList.length : 0;
        } else {
          counts[tenant.id] = idx === 0 ? 18 : idx === 1 ? 4 : 9;
        }
      });
      setVehicleCountMap(counts);

      setAuditLogs(readAdminAuditLogs());
    } catch (err) {
      console.error('Lỗi tải dữ liệu Admin:', err);
      setTenants(buildSeedTenants());
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('sys_tenants')) {
      localStorage.setItem('sys_tenants', JSON.stringify(buildSeedTenants()));
    }

    loadData();

    const handleStorageSync = () => loadData();
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [activeSection]);

  const logAction = (action: string, details: string) => {
    recordAdminAction(action, details);
    setAuditLogs(readAdminAuditLogs());
  };

  const persistTenants = (nextList: TenantRecord[]) => {
    setTenants(nextList);
    localStorage.setItem('sys_tenants', JSON.stringify(nextList));
    window.dispatchEvent(new Event('storage'));
  };

  const handleImpersonate = (tenantId: string, tenantName: string) => {
    logAction('TRUY CẬP', `Nhập vai quản trị vào hệ thống: ${tenantName}`);

    localStorage.setItem('isAdminImpersonating', 'true');
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('tenantName', tenantName);
    localStorage.setItem('userRole', 'SUPER_ADMIN_VIEW');
    navigate('/overview');
  };

  const handleLogout = () => {
    logAction('ĐĂNG XUẤT', 'Kết thúc phiên làm việc');
    sessionStorage.removeItem('sys_core_role');
    sessionStorage.removeItem('sys_core_admin_name');
    sessionStorage.removeItem('sys_core_username');
    sessionStorage.removeItem('sys_core_token');
    navigate('/overview/admin/login');
  };

  const metrics = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.status === 'ACTIVE').length;
    const trial = tenants.filter((t) => t.status === 'TRIAL').length;
    const suspended = tenants.filter((t) => t.status === 'SUSPENDED').length;

    const expiringSoon = tenants.filter((t) => {
      const days = getRemainingDays(t.expiresAt);
      return t.status !== 'SUSPENDED' && days >= 0 && days <= 15;
    }).length;

    const totalRegisteredVehicles = tenants.reduce(
      (sum, t) => sum + (vehicleCountMap[t.id] || 0),
      0
    );
    const totalVehicleQuota = tenants.reduce((sum, t) => sum + (t.maxVehicles || 0), 0);

    const monthlyRecurringRevenue = tenants
      .filter((t) => t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.monthlyFee || 0), 0);

    return {
      total,
      active,
      trial,
      suspended,
      expiringSoon,
      totalRegisteredVehicles,
      totalVehicleQuota,
      monthlyRecurringRevenue
    };
  }, [tenants, vehicleCountMap]);

  const filteredTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter === 'EXPIRING') {
        const days = getRemainingDays(t.expiresAt);
        if (days > 15 || t.status === 'SUSPENDED') return false;
      } else if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      if (planFilter !== 'ALL' && t.plan !== planFilter) {
        return false;
      }

      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.ownerName.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingTenant(null);
    setFormError('');
    setFormValues({
      name: '',
      code: `CTY${Math.floor(100 + Math.random() * 900)}`,
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      status: 'TRIAL',
      plan: 'TRIAL_14D',
      monthlyFee: '0',
      maxVehicles: '5',
      activatedAt: today,
      expiresAt: addDaysISO(today, 14),
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (tenant: TenantRecord) => {
    setEditingTenant(tenant);
    setFormError('');
    setFormValues({
      name: tenant.name,
      code: tenant.code,
      ownerName: tenant.ownerName,
      phone: tenant.phone,
      email: tenant.email || '',
      address: tenant.address,
      status: tenant.status,
      plan: tenant.plan,
      monthlyFee: String(tenant.monthlyFee),
      maxVehicles: String(tenant.maxVehicles),
      activatedAt: tenant.activatedAt,
      expiresAt: tenant.expiresAt,
      notes: tenant.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleSelectPlanInForm = (newPlan: SubscriptionPlan) => {
    const cfg = PLAN_CONFIGS[newPlan];
    setFormValues((prev) => ({
      ...prev,
      plan: newPlan,
      status: newPlan === 'TRIAL_14D' ? 'TRIAL' : prev.status === 'TRIAL' ? 'ACTIVE' : prev.status,
      monthlyFee: String(cfg.monthlyFee),
      maxVehicles: String(cfg.maxVehicles),
      expiresAt: addDaysISO(prev.activatedAt, cfg.defaultDays)
    }));
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formValues.name.trim();
    const cleanCode = formValues.code.trim().toUpperCase();
    const cleanOwner = formValues.ownerName.trim();
    const cleanPhone = formValues.phone.replace(/\D/g, '');
    const cleanAddress = formValues.address.trim();

    if (cleanName.length < 2) {
      setFormError('Vui lòng nhập tên doanh nghiệp (tối thiểu 2 ký tự).');
      return;
    }
    if (!CODE_REGEX.test(cleanCode)) {
      setFormError('Mã doanh nghiệp phải gồm 4–12 ký tự chữ in hoa hoặc số (VD: CTYA26).');
      return;
    }
    const isDuplicateCode = tenants.some(
      (t) => t.code.toUpperCase() === cleanCode && t.id !== editingTenant?.id
    );
    if (isDuplicateCode) {
      setFormError(`Mã doanh nghiệp "${cleanCode}" đã tồn tại trên hệ thống.`);
      return;
    }
    if (cleanOwner.length < 2) {
      setFormError('Vui lòng nhập tên chủ doanh nghiệp / người đại diện.');
      return;
    }
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setFormError('Số điện thoại liên hệ phải gồm đúng 10 chữ số và bắt đầu bằng số 0.');
      return;
    }
    if (
      formValues.activatedAt &&
      formValues.expiresAt &&
      formValues.expiresAt < formValues.activatedAt
    ) {
      setFormError('Ngày hết hạn gói dịch vụ không được trước ngày kích hoạt.');
      return;
    }

    const maxVehiclesNum = Math.max(1, Number(formValues.maxVehicles) || 5);
    const monthlyFeeNum = Math.max(0, Number(formValues.monthlyFee) || 0);

    if (editingTenant) {
      const updated = tenants.map((t) =>
        t.id === editingTenant.id
          ? {
            ...t,
            name: cleanName,
            code: cleanCode,
            ownerName: cleanOwner,
            phone: cleanPhone,
            email: formValues.email.trim(),
            address: cleanAddress || 'Chưa cập nhật',
            status: formValues.status,
            plan: formValues.plan,
            monthlyFee: monthlyFeeNum,
            maxVehicles: maxVehiclesNum,
            activatedAt: formValues.activatedAt,
            expiresAt: formValues.expiresAt,
            notes: formValues.notes.trim()
          }
          : t
      );
      persistTenants(updated);
      logAction('CẬP NHẬT', `Cập nhật doanh nghiệp: ${cleanName} (Mã: ${cleanCode})`);
    } else {
      const newId = `COMPANY_${Date.now()}`;
      const newTenant: TenantRecord = {
        id: newId,
        name: cleanName,
        code: cleanCode,
        ownerName: cleanOwner,
        phone: cleanPhone,
        email: formValues.email.trim(),
        address: cleanAddress || 'Chưa cập nhật',
        status: formValues.status,
        plan: formValues.plan,
        monthlyFee: monthlyFeeNum,
        maxVehicles: maxVehiclesNum,
        activatedAt: formValues.activatedAt,
        expiresAt: formValues.expiresAt,
        notes: formValues.notes.trim()
      };
      persistTenants([...tenants, newTenant]);
      setVehicleCountMap((prev) => ({ ...prev, [newId]: 0 }));
      logAction('THÊM MỚI', `Tạo doanh nghiệp: ${cleanName} (Mã: ${cleanCode})`);
    }

    setIsFormModalOpen(false);
  };

  const handleQuickStatusChange = (tenant: TenantRecord, nextStatus: TenantStatus) => {
    const updated = tenants.map((t) =>
      t.id === tenant.id ? { ...t, status: nextStatus } : t
    );
    persistTenants(updated);
    logAction('TRẠNG THÁI', `Chuyển ${tenant.name} (${tenant.code}) sang ${nextStatus}`);
  };

  // Bước 1: Mở modal chọn gói & thời hạn gia hạn
  const openRenewModal = (tenant: TenantRecord) => {
    setRenewTenant(tenant);
    setRenewPlan(tenant.plan === 'TRIAL_14D' ? 'STARTER' : tenant.plan);
    setRenewMonths(1);
    setIsRenewModalOpen(true);
  };

  // Bước 2: Chuyển sang Trang Phương thức Thanh toán Gia hạn
  const handleProceedToPaymentPage = () => {
    if (!renewTenant) return;
    const today = new Date().toISOString().split('T')[0];
    const shortStamp = Date.now().toString().slice(-6);
    setPaymentMethod('BANK_TRANSFER');
    setGatewayProvider('VNPAY');
    setPaymentTxCode(`FT${shortStamp}`);
    setPaymentVoucherCode(`UNC-${renewTenant.code}-${shortStamp.slice(-3)}`);
    setPaymentVoucherImage('');
    setPaymentPaidAt(today);
    setPaymentNote(
      `Thanh toán gia hạn gói ${PLAN_CONFIGS[renewPlan].label} (${renewMonths} tháng)`
    );
    setConfirmPaymentNow(true);
    setPaymentError('');
    setIsRenewModalOpen(false);
    setActiveSection('renew_payment');
  };

  const handleSelectPaymentMethod = (method: RenewPaymentMethod) => {
    setPaymentMethod(method);
    setPaymentError('');
    const shortStamp = Date.now().toString().slice(-6);
    const code = renewTenant?.code || 'DN';
    if (method === 'BANK_TRANSFER') {
      setPaymentTxCode(`FT${shortStamp}`);
      setPaymentVoucherCode(`UNC-${code}-${shortStamp.slice(-3)}`);
    } else if (method === 'ONLINE_GATEWAY') {
      setPaymentTxCode(`${gatewayProvider}-${shortStamp}`);
      setPaymentVoucherCode(`GD-${gatewayProvider}-${shortStamp.slice(-3)}`);
    } else {
      setPaymentTxCode(`PT-TM-${shortStamp.slice(-4)}`);
      setPaymentVoucherCode(`BL-${code}-${shortStamp.slice(-3)}`);
    }
  };

  const handleVoucherImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentVoucherImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Tính toán thông tin dự kiến cho trang thanh toán gia hạn
  const renewalSummary = useMemo(() => {
    if (!renewTenant) return null;
    const cfg = PLAN_CONFIGS[renewPlan];
    const today = new Date().toISOString().split('T')[0];
    const baseDate =
      renewTenant.expiresAt && renewTenant.expiresAt > today
        ? renewTenant.expiresAt
        : today;
    const addedDays = renewPlan === 'TRIAL_14D' ? 14 : renewMonths * 30;
    const nextExpiresAt = addDaysISO(baseDate, addedDays);
    const totalAmount = cfg.monthlyFee * renewMonths;

    return {
      cfg,
      addedDays,
      nextExpiresAt,
      totalAmount
    };
  }, [renewTenant, renewPlan, renewMonths]);

  // Hoàn tất thanh toán gia hạn & đồng bộ sang sys_tenants + sys_platform_billing + sys_core_audit_logs
  const handleCompleteRenewalPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTenant || !renewalSummary) return;

    const cleanTx = paymentTxCode.trim().toUpperCase();
    const cleanVoucher = paymentVoucherCode.trim().toUpperCase();

    if (!cleanTx) {
      setPaymentError('Vui lòng nhập mã giao dịch hoặc mã phiếu thu để đối soát.');
      return;
    }
    if (!cleanVoucher) {
      setPaymentError('Vui lòng nhập số chứng từ / biên lai thanh toán.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { cfg, nextExpiresAt, totalAmount } = renewalSummary;

    const methodLabel =
      paymentMethod === 'BANK_TRANSFER'
        ? 'Chuyển khoản ngân hàng'
        : paymentMethod === 'ONLINE_GATEWAY'
          ? `Cổng thanh toán ${gatewayProvider}`
          : 'Tiền mặt tại văn phòng';

    // 1. Nếu xác nhận đã thu tiền ngay -> cập nhật gói & cộng nối tiếp thời hạn cho doanh nghiệp
    if (confirmPaymentNow) {
      const updatedTenants = tenants.map((t) =>
        t.id === renewTenant.id
          ? {
            ...t,
            plan: renewPlan,
            status:
              renewPlan === 'TRIAL_14D'
                ? ('TRIAL' as TenantStatus)
                : ('ACTIVE' as TenantStatus),
            monthlyFee: cfg.monthlyFee,
            maxVehicles: Math.max(t.maxVehicles, cfg.maxVehicles),
            expiresAt: nextExpiresAt
          }
          : t
      );
      persistTenants(updatedTenants);
    }

    // 2. Đồng bộ hóa đơn & giao dịch thanh toán sang kho công nợ sys_platform_billing
    try {
      const rawInvoices = JSON.parse(
        localStorage.getItem('sys_platform_billing') || '[]'
      );
      const existingInvoices = Array.isArray(rawInvoices) ? rawInvoices : [];
      const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
      const newInvoiceCode = `HD-GH-${Date.now().toString().slice(-6)}`;

      const newInvoice = {
        id: `INV-${Date.now()}`,
        invoiceCode: newInvoiceCode,
        tenantId: renewTenant.id,
        tenantName: renewTenant.name,
        tenantCode: renewTenant.code,
        billingPeriod: `${currentMonth} (${renewMonths}T)`,
        billingMode: 'PACKAGE',
        planName: cfg.label,
        vehicleCount: vehicleCountMap[renewTenant.id] || 0,
        unitPricePerVehicle: 150000,
        totalAmount,
        paidAmount: confirmPaymentNow ? totalAmount : 0,
        dueDate: paymentPaidAt || today,
        createdAt: today,
        transactions: [
          {
            id: `TX-${Date.now().toString().slice(-6)}`,
            amount: totalAmount,
            method: paymentMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
            transactionCode: cleanTx,
            voucherCode: cleanVoucher,
            voucherImage: paymentVoucherImage || undefined,
            paidAt: paymentPaidAt || today,
            verifyStatus: confirmPaymentNow ? 'CONFIRMED' : 'PENDING',
            verifiedBy: confirmPaymentNow ? adminName : undefined,
            verifiedAt: confirmPaymentNow ? today : undefined,
            note: `[${methodLabel}] ${paymentNote.trim()}`
          }
        ]
      };

      localStorage.setItem(
        'sys_platform_billing',
        JSON.stringify([newInvoice, ...existingInvoices])
      );
    } catch (err) {
      console.error('Lỗi đồng bộ hóa đơn gia hạn:', err);
    }

    // 3. Ghi nhật ký hoạt động vào sys_core_audit_logs
    if (confirmPaymentNow) {
      logAction(
        'GIA HẠN',
        `Gia hạn ${cfg.label} (${renewMonths} tháng) cho ${renewTenant.name} (${renewTenant.code}) — Đã thu ${totalAmount.toLocaleString('vi-VN')} ₫ qua ${methodLabel} (Mã GD: ${cleanTx})`
      );
    } else {
      logAction(
        'THANH TOÁN',
        `Tạo yêu cầu gia hạn ${cfg.label} (${renewMonths} tháng) cho ${renewTenant.name} (${renewTenant.code}) — Chờ duyệt ${totalAmount.toLocaleString('vi-VN')} ₫ qua ${methodLabel} (Mã GD: ${cleanTx})`
      );
    }

    window.dispatchEvent(new Event('storage'));
    setRenewTenant(null);
    setActiveSection('tenants');
  };

  const handleDeleteTenant = (tenant: TenantRecord) => {
    const confirmed = window.confirm(
      `Xác nhận xóa doanh nghiệp "${tenant.name}" (${tenant.code}) khỏi hệ thống?`
    );
    if (!confirmed) return;
    persistTenants(tenants.filter((t) => t.id !== tenant.id));
    logAction('XÓA', `Xóa doanh nghiệp: ${tenant.name} (Mã: ${tenant.code})`);
  };

  const renderStatusBadge = (status: TenantStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ACTIVE
        </span>
      );
    }
    if (status === 'TRIAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          TRIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        SUSPENDED
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ================= HEADER GỐC: DRIVELINKER ADMIN ================= */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-[1520px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-6 h-6 text-rose-500" /> DriveLinker Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Danh sách doanh nghiệp đang quản lý.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Nút Xem Lịch sử */}
            <button
              type="button"
              onClick={() => { setAuditLogs(readAdminAuditLogs()); setExpandedLog(null); setIsHistoryModalOpen(true); }}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-colors active:scale-95 cursor-pointer"
            >
              <History className="w-4 h-4" /> Lịch sử
              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[11px] font-mono text-slate-600">
                {auditLogs.length}
              </span>
            </button>

            {/* Nút Thêm Doanh nghiệp */}
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-colors active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Thêm mới
            </button>

            {/* Thông tin Admin */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm ml-1">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700 leading-none">{adminName}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  System Admin
                </p>
              </div>
            </div>

            {/* Nút Thoát */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-500 font-bold hover:bg-rose-50 px-3 py-3 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
              title="Thoát phiên làm việc"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= THANH CHUYỂN TAB 2 PHÂN HỆ ================= */}
      <div className="bg-white border-b border-slate-200 px-8 py-2.5">
        <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRenewTenant(null);
                setActiveSection('tenants');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'tenants' || activeSection === 'renew_payment'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Quản lý Doanh nghiệp (Tenant)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRenewTenant(null);
                setActiveSection('billing');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'billing'
                  ? 'bg-[#0EA5E9] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
            >
              <Receipt className="w-4 h-4" />
              <span>2. Công nợ & Thanh toán (Billing)</span>
            </button>
          </div>

          {activeSection === 'tenants' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Dạng bảng chi tiết
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Dạng thẻ truy cập nhanh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= NỘI DUNG CHÍNH THEO TỪNG MÀN HÌNH ================= */}
      {activeSection === 'billing' ? (
        <AdminBillingManagement />
      ) : activeSection === 'renew_payment' && renewTenant && renewalSummary ? (
        /* ================= TRANG PHƯƠNG THỨC THANH TOÁN GIA HẠN ================= */
        <div className="flex-1 max-w-[1280px] w-full mx-auto p-8 space-y-6">
          {/* Thanh điều hướng quay lại & tiêu đề trang thanh toán */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setRenewTenant(null);
                  setActiveSection('tenants');
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Danh sách Doanh nghiệp</span>
              </button>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>CỔNG THANH TOÁN & ĐỐI SOÁT GIA HẠN DỊCH VỤ</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Chọn Phương thức Thanh toán • {renewTenant.name} ({renewTenant.code})
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ 1. Chọn gói & Thời hạn
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white">
                2. Phương thức thanh toán
              </span>
            </div>
          </div>

          <form
            onSubmit={handleCompleteRenewalPayment}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            {/* CỘT TRÁI (2/3): CHỌN PHƯƠNG THỨC THANH TOÁN & THÔNG TIN CHỨNG TỪ */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  1. Chọn phương thức thanh toán
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod('BANK_TRANSFER')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${paymentMethod === 'BANK_TRANSFER'
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      {paymentMethod === 'BANK_TRANSFER' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Chuyển khoản / VietQR
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Internet Banking 24/7
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod('ONLINE_GATEWAY')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${paymentMethod === 'ONLINE_GATEWAY'
                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      {paymentMethod === 'ONLINE_GATEWAY' && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Cổng VNPay / Ví MoMo
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thanh toán trực tuyến
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentMethod('CASH')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${paymentMethod === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Banknote className="w-4 h-4" />
                      </div>
                      {paymentMethod === 'CASH' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Tiền mặt tại quầy
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Lập phiếu thu trực tiếp
                    </div>
                  </button>
                </div>
              </div>

              {/* CHI TIẾT HƯỚNG DẪN TƯƠNG ỨNG VỚI PHƯƠNG THỨC ĐÃ CHỌN */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 p-2 text-center">
                    <QrCode className="w-14 h-14 text-slate-800" />
                    <span className="text-[10px] font-mono font-bold text-sky-700 mt-1">
                      VIETQR 24/7
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs flex-1 w-full">
                    <div className="font-bold text-slate-800 text-sm">
                      Thông tin tài khoản thụ hưởng DriveLinker
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                      <div>
                        Ngân hàng: <strong className="text-slate-900">Vietcombank (VCB)</strong>
                      </div>
                      <div>
                        Số tài khoản:{' '}
                        <strong className="font-mono text-slate-900">1029384756</strong>
                      </div>
                      <div className="sm:col-span-2">
                        Chủ tài khoản:{' '}
                        <strong className="text-slate-900">
                          CONG TY CO PHAN CONG NGHE DRIVELINKER
                        </strong>
                      </div>
                      <div className="sm:col-span-2">
                        Nội dung CK:{' '}
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-bold">
                          GIAHAN {renewTenant.code} {renewPlan} {renewMonths}T
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'ONLINE_GATEWAY' && (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <div className="text-xs font-bold text-indigo-900">
                    Chọn cổng thanh toán trực tuyến liên kết:
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGatewayProvider('VNPAY');
                        setPaymentTxCode(`VNPAY-${Date.now().toString().slice(-6)}`);
                      }}
                      className={`p-3 rounded-xl border text-left font-bold text-xs cursor-pointer ${gatewayProvider === 'VNPAY'
                          ? 'bg-white border-indigo-600 text-indigo-700 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-600'
                        }`}
                    >
                      VNPay QR / Thẻ nội địa Napas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGatewayProvider('MOMO');
                        setPaymentTxCode(`MOMO-${Date.now().toString().slice(-6)}`);
                      }}
                      className={`p-3 rounded-xl border text-left font-bold text-xs cursor-pointer ${gatewayProvider === 'MOMO'
                          ? 'bg-white border-pink-600 text-pink-700 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-600'
                        }`}
                    >
                      Ví điện tử MoMo Doanh nghiệp
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold">
                    Thu tiền mặt trực tiếp tại Văn phòng DriveLinker
                  </div>
                  <p className="text-emerald-800">
                    Kế toán lập phiếu thu 2 liên, giao 1 liên cho đại diện{' '}
                    <strong>{renewTenant.name}</strong> và lưu mã phiếu thu bên dưới để đối soát.
                  </p>
                </div>
              )}

              {/* THÔNG TIN CHỨNG TỪ & MÃ GIAO DỊCH */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Thông tin giao dịch & Chứng từ đối soát
                </h3>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {paymentMethod === 'CASH'
                        ? 'Mã phiếu thu tiền mặt *'
                        : 'Mã giao dịch thanh toán *'}
                    </label>
                    <input
                      type="text"
                      value={paymentTxCode}
                      onChange={(e) => {
                        setPaymentTxCode(e.target.value.toUpperCase());
                        if (paymentError) setPaymentError('');
                      }}
                      placeholder="VD: FT26320981"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số chứng từ / Biên lai *
                    </label>
                    <input
                      type="text"
                      value={paymentVoucherCode}
                      onChange={(e) => {
                        setPaymentVoucherCode(e.target.value.toUpperCase());
                        if (paymentError) setPaymentError('');
                      }}
                      placeholder="VD: UNC-2026-01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày thanh toán
                    </label>
                    <input
                      type="date"
                      value={paymentPaidAt}
                      onChange={(e) => setPaymentPaidAt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi chú đối soát
                    </label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Nhập ghi chú thanh toán..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ảnh chứng từ / Ủy nhiệm chi (tùy chọn)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-2 rounded-lg border border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Tải ảnh biên lai...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVoucherImageUpload}
                          className="hidden"
                        />
                      </label>
                      {paymentVoucherImage && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã đính kèm
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmPaymentNow}
                    onChange={(e) => setConfirmPaymentNow(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-semibold text-emerald-900">
                    Xác nhận đã nhận đủ thanh toán & Kích hoạt gia hạn gói dịch vụ ngay lập tức
                  </span>
                </label>
              </div>
            </div>

            {/* CỘT PHẢI (1/3): TÓM TẮT ĐƠN HÀNG GIA HẠN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tóm tắt Đơn hàng Gia hạn
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kiểm tra lại thông tin gói cước và thời hạn trước khi xác nhận.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Doanh nghiệp:</span>
                  <strong className="text-slate-900 text-right">{renewTenant.name}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Mã định danh:</span>
                  <strong className="font-mono text-slate-800">{renewTenant.code}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Gói dịch vụ mới:</span>
                  <strong className="text-indigo-700">{renewalSummary.cfg.label}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Hạn mức phương tiện:</span>
                  <strong className="font-mono text-slate-800">
                    {Math.max(renewTenant.maxVehicles, renewalSummary.cfg.maxVehicles)} xe
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Chu kỳ gia hạn:</span>
                  <strong className="text-slate-900">
                    {renewMonths} tháng (+{renewalSummary.addedDays} ngày)
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">HSD hiện tại:</span>
                  <span className="font-mono text-slate-600">
                    {formatDateVN(renewTenant.expiresAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">HSD mới sau gia hạn:</span>
                  <strong className="font-mono text-emerald-700">
                    {formatDateVN(renewalSummary.nextExpiresAt)}
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Phương thức TT:</span>
                  <strong className="text-slate-900">
                    {paymentMethod === 'BANK_TRANSFER'
                      ? 'Chuyển khoản ngân hàng'
                      : paymentMethod === 'ONLINE_GATEWAY'
                        ? `Cổng ${gatewayProvider}`
                        : 'Tiền mặt'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="text-[11px] text-slate-400 uppercase font-bold">
                  Tổng số tiền thanh toán
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  {renewalSummary.totalAmount.toLocaleString('vi-VN')} ₫
                </div>
                <div className="text-[11px] text-slate-400">
                  ({renewalSummary.cfg.monthlyFee.toLocaleString('vi-VN')} đ/tháng ×{' '}
                  {renewMonths} tháng)
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>
                    {confirmPaymentNow
                      ? 'Xác nhận thanh toán & Gia hạn'
                      : 'Lưu chứng từ chờ đối soát'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('tenants');
                    setIsRenewModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Đổi gói dịch vụ / Số tháng
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ================= NỘI DUNG PHÂN HỆ 1: QUẢN LÝ DOANH NGHIỆP ================= */
        <div className="flex-1 max-w-[1520px] w-full mx-auto p-8 space-y-6">
          <div><h1 className="text-3xl font-extrabold text-slate-900">Tổng Quan</h1><p className="mt-2 text-sm text-slate-500">Quản lý doanh nghiệp và theo dõi hoạt động hệ thống.</p></div>
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-sm font-bold uppercase text-slate-400">Doanh nghiệp <Building2 className="text-red-500"/></div><p className="mt-2 text-3xl font-extrabold">{metrics.total}</p><p className="mt-1 text-sm text-slate-400">Tổng doanh nghiệp quản lý</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-sm font-bold uppercase text-slate-400">Hoạt động gần đây <History className="text-emerald-500"/></div><p className="mt-2 text-3xl font-extrabold">{auditLogs.length}</p><p className="mt-1 text-sm text-slate-400">Bản ghi lịch sử</p></div>
          </div>
          {/* 4 THẺ KPI TỔNG QUAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tổng doanh nghiệp
                </span>
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {metrics.total}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold">
                <span className="text-emerald-600">{metrics.active} Active</span>
                <span className="text-slate-300">•</span>
                <span className="text-sky-600">{metrics.trial} Trial</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600">{metrics.suspended} Suspended</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Doanh thu gói / tháng
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {metrics.monthlyRecurringRevenue.toLocaleString('vi-VN')} ₫
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Tính trên {metrics.active} đơn vị đang kích hoạt ACTIVE
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Quy mô xe đăng ký
                </span>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {metrics.totalRegisteredVehicles}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {metrics.totalVehicleQuota} xe
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Tỷ lệ lấp đầy hạn mức:{' '}
                {metrics.totalVehicleQuota > 0
                  ? Math.round(
                    (metrics.totalRegisteredVehicles / metrics.totalVehicleQuota) * 100
                  )
                  : 0}
                %
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cảnh báo thời hạn
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 font-mono">
                {metrics.expiringSoon}{' '}
                <span className="text-sm font-sans font-semibold text-slate-600">
                  đơn vị
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Gói dịch vụ / dùng thử còn dưới 15 ngày
              </p>
            </div>
          </div>

          {/* THANH TÌM KIẾM & BỘ LỌC */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'ALL', label: 'Tất cả', count: metrics.total },
                  { key: 'ACTIVE', label: 'ACTIVE', count: metrics.active },
                  { key: 'TRIAL', label: 'TRIAL', count: metrics.trial },
                  { key: 'SUSPENDED', label: 'SUSPENDED', count: metrics.suspended },
                  { key: 'EXPIRING', label: 'Sắp hết hạn', count: metrics.expiringSoon }
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial justify-end">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'ALL' | SubscriptionPlan)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="ALL">Tất cả gói dịch vụ</option>
                {Object.values(PLAN_CONFIGS).map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, ID, mã DN, người đại diện..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {viewMode === 'cards' ? (
            /* ================= DẠNG THẺ TRỰC QUAN ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTenants.map((t) => {
                const planCfg = PLAN_CONFIGS[t.plan] || PLAN_CONFIGS.STARTER;
                const registeredCount = vehicleCountMap[t.id] || 0;
                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group overflow-hidden flex flex-col"
                  >
                    <div className="p-6 flex justify-between items-start gap-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-800 text-lg">{t.name}</h3>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-bold text-slate-700">
                              {t.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-1">ID: {t.id}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                            <span>
                              Gói: <strong>{planCfg.label}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {registeredCount}/{t.maxVehicles} xe
                            </span>
                            <span>•</span>
                            <span className="font-mono">HSD: {formatDateVN(t.expiresAt)}</span>
                          </div>
                        </div>
                      </div>

                      {renderStatusBadge(t.status)}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50 grid grid-cols-3 divide-x divide-slate-200">
                      <button
                        type="button"
                        onClick={() => setSelectedTenant(t)}
                        className="py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      >
                        <Info className="w-4 h-4" /> Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => openRenewModal(t)}
                        className="py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Gia hạn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImpersonate(t.id, t.name)}
                        className="py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Truy cập <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= DẠNG BẢNG CHI TIẾT ================= */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Doanh nghiệp & Địa chỉ</th>
                      <th className="py-3.5 px-4">Người đại diện & Liên hệ</th>
                      <th className="py-3.5 px-4">Trạng thái & Kích hoạt</th>
                      <th className="py-3.5 px-4">Gói dịch vụ & Thời hạn</th>
                      <th className="py-3.5 px-4">Số xe đăng ký</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                          Không tìm thấy doanh nghiệp phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((tenant) => {
                        const planCfg = PLAN_CONFIGS[tenant.plan] || PLAN_CONFIGS.STARTER;
                        const registeredCount = vehicleCountMap[tenant.id] || 0;
                        const quotaRatio =
                          tenant.maxVehicles > 0
                            ? Math.min(100, Math.round((registeredCount / tenant.maxVehicles) * 100))
                            : 0;
                        const remainingDays = getRemainingDays(tenant.expiresAt);

                        return (
                          <tr
                            key={tenant.id}
                            className="hover:bg-slate-50/80 transition-colors align-top"
                          >
                            <td className="py-4 px-4 max-w-[260px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{tenant.name}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                                  {tenant.code}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                ID: {tenant.id}
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5 leading-relaxed">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span>{tenant.address || 'Chưa cập nhật'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{tenant.ownerName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 mt-1.5">
                                <Phone className="w-3.5 h-3.5 text-sky-500" />
                                <span>{tenant.phone || 'Chưa cập nhật'}</span>
                              </div>
                              {tenant.email && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{tenant.email}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {renderStatusBadge(tenant.status)}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  Kích hoạt:{' '}
                                  <strong className="font-mono text-slate-700">
                                    {formatDateVN(tenant.activatedAt)}
                                  </strong>
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-bold ${planCfg.badgeClass}`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {planCfg.label}
                              </span>
                              <div className="text-xs font-mono font-semibold text-slate-700 mt-1.5">
                                {tenant.monthlyFee > 0
                                  ? `${tenant.monthlyFee.toLocaleString('vi-VN')} đ/tháng`
                                  : 'Miễn phí dùng thử'}
                              </div>
                              <div className="text-[11px] mt-1 flex items-center gap-1.5">
                                <span className="text-slate-500">
                                  HSD: <strong className="font-mono">{formatDateVN(tenant.expiresAt)}</strong>
                                </span>
                                {remainingDays < 0 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                                    Quá hạn {Math.abs(remainingDays)}n
                                  </span>
                                ) : remainingDays <= 15 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                    Còn {remainingDays} ngày
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold">
                                    (Còn {remainingDays}n)
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap min-w-[150px]">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-800 font-mono flex items-center gap-1">
                                  <Car className="w-3.5 h-3.5 text-indigo-500" />
                                  {registeredCount} / {tenant.maxVehicles} xe
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {quotaRatio}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${quotaRatio >= 90
                                      ? 'bg-rose-500'
                                      : quotaRatio >= 75
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                  style={{ width: `${quotaRatio}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap text-right">
                              <div className="inline-flex flex-col items-end gap-1.5">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleImpersonate(tenant.id, tenant.name)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <span>Truy cập hệ thống</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedTenant(tenant)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                    <span>Xem chi tiết</span>
                                  </button>
                                </div>

                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openRenewModal(tenant)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Gia hạn</span>
                                  </button>

                                  {tenant.status !== 'SUSPENDED' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStatusChange(tenant, 'SUSPENDED')}
                                      title="Tạm ngưng doanh nghiệp"
                                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStatusChange(tenant, 'ACTIVE')}
                                      title="Kích hoạt lại ACTIVE"
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openEditModal(tenant)}
                                    title="Chỉnh sửa thông tin"
                                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTenant(tenant)}
                                    title="Xóa doanh nghiệp"
                                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: LỊCH SỬ THAO TÁC ================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-sky-500" /> Lịch sử Thao tác Hệ thống
              </h2>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">Admin<select value={auditAdmin} onChange={e => { setAuditAdmin(e.target.value); setExpandedLog(null); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Tất cả admin</option>{adminOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs font-bold text-slate-600">Ngày<input type="date" value={auditDay} onChange={e => { setAuditDay(e.target.value); setExpandedLog(null); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal" /></label>
              <label className="text-xs font-bold text-slate-600">Loại hoạt động<select value={auditAction} onChange={e => { setAuditAction(e.target.value); setExpandedLog(null); }} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Tất cả hoạt động</option>{actionOptions.map(action => <option key={action} value={action}>{action}</option>)}</select></label>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">
                      Hành động
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">{auditLogs.length ? 'Không có bản ghi phù hợp với bộ lọc.' : 'Chưa có bản ghi nhật ký nào.'}</td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-300" /> {formatAuditTime(log)}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-slate-700 whitespace-nowrap">
                          {log.admin || 'Không rõ'}{log.username ? ` (${log.username})` : ''}
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${log.action === 'THÊM MỚI' || log.action === 'XÁC NHẬN TT'
                                ? 'bg-emerald-100 text-emerald-700'
                                : log.action === 'TRUY CẬP' ||
                                  log.action === 'GIA HẠN' ||
                                  log.action === 'THANH TOÁN'
                                  ? 'bg-sky-100 text-sky-700'
                                  : log.action === 'ĐĂNG XUẤT'
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-rose-100 text-rose-700'
                              }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600"><div className="flex items-center gap-2"><span>{log.details || 'Không có chi tiết'}</span><button type="button" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} aria-expanded={expandedLog === log.id} aria-label={`${expandedLog === log.id ? 'Ẩn' : 'Xem'} lịch sử của ${log.admin || 'tài khoản'}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-slate-700 hover:bg-slate-100">{expandedLog === log.id ? '−' : '+'}</button></div></td>
                      </tr>
                      {expandedLog === log.id && <tr><td colSpan={4} className="bg-slate-50 px-6 py-4"><h3 className="mb-3 text-sm font-bold text-slate-800">Hoạt động của {log.admin || 'tài khoản không rõ'}{log.username ? ` (${log.username})` : ''}</h3><ul className="space-y-2">{filteredAuditLogs.filter((item) => log.username && item.username ? item.username === log.username : Boolean(log.admin && item.admin === log.admin)).map((item) => <li key={item.id} className="text-sm text-slate-700"><span className="text-slate-500">{formatAuditTime(item)}</span> · <strong>{item.action || 'Không rõ'}</strong> · {item.details || 'Không có chi tiết'}</li>)}</ul></td></tr>}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Đóng Lịch sử
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHI TIẾT DOANH NGHIỆP ================= */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-500" /> Hồ sơ Doanh nghiệp
              </h2>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">{selectedTenant.name}</h3>
                  {renderStatusBadge(selectedTenant.status)}
                </div>
                <p className="text-sm font-mono text-slate-400 mt-1">
                  ID: {selectedTenant.id} • Mã: {selectedTenant.code}
                </p>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chủ doanh nghiệp
                    </p>
                    <p className="font-medium text-slate-700">
                      {selectedTenant.ownerName || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Số điện thoại
                    </p>
                    <p className="font-medium text-slate-700 font-mono">
                      {selectedTenant.phone || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Địa chỉ
                    </p>
                    <p className="font-medium text-slate-700 leading-snug">
                      {selectedTenant.address || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block">Gói dịch vụ</span>
                    <strong className="text-indigo-700">
                      {PLAN_CONFIGS[selectedTenant.plan]?.label || selectedTenant.plan}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hạn mức xe</span>
                    <strong className="font-mono text-slate-800">
                      {vehicleCountMap[selectedTenant.id] || 0} / {selectedTenant.maxVehicles} xe
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kích hoạt</span>
                    <strong className="font-mono text-slate-800">
                      {formatDateVN(selectedTenant.activatedAt)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hết hạn gói</span>
                    <strong className="font-mono text-slate-800">
                      {formatDateVN(selectedTenant.expiresAt)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedTenant;
                    setSelectedTenant(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleImpersonate(selectedTenant.id, selectedTenant.name)}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  Truy cập <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM / SỬA DOANH NGHIỆP ================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                {editingTenant
                  ? `Cập nhật Doanh nghiệp • ${editingTenant.code}`
                  : 'Thêm Doanh nghiệp'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Tên doanh nghiệp *
                  </label>
                  <input
                    required
                    type="text"
                    value={formValues.name}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, name: e.target.value }));
                      if (formError) setFormError('');
                    }}
                    placeholder="VD: Công ty Vận tải ABC"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Mã doanh nghiệp *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={12}
                    value={formValues.code}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormValues((prev) => ({ ...prev, code: clean }));
                      if (formError) setFormError('');
                    }}
                    placeholder="CTYA26"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase font-bold outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Tên chủ doanh nghiệp *
                  </label>
                  <input
                    required
                    type="text"
                    value={formValues.ownerName}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, ownerName: e.target.value }));
                      if (formError) setFormError('');
                    }}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formValues.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormValues((prev) => ({ ...prev, phone: digits }));
                      if (formError) setFormError('');
                    }}
                    placeholder="VD: 0901234567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="admin@company.vn"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formValues.address}
                  onChange={(e) => {
                    setFormValues((prev) => ({ ...prev, address: e.target.value }));
                    if (formError) setFormError('');
                  }}
                  placeholder="VD: 123 Đường A, Quận B..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gói dịch vụ
                    </label>
                    <select
                      value={formValues.plan}
                      onChange={(e) =>
                        handleSelectPlanInForm(e.target.value as SubscriptionPlan)
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-rose-500"
                    >
                      {Object.values(PLAN_CONFIGS).map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label} ({p.maxVehicles} xe)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trạng thái hoạt động
                    </label>
                    <select
                      value={formValues.status}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          status: e.target.value as TenantStatus
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold outline-none focus:border-rose-500"
                    >
                      <option value="ACTIVE">ACTIVE — Đang hoạt động</option>
                      <option value="TRIAL">TRIAL — Đang dùng thử</option>
                      <option value="SUSPENDED">SUSPENDED — Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ngày kích hoạt
                    </label>
                    <input
                      type="date"
                      value={formValues.activatedAt}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, activatedAt: e.target.value }))
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ngày hết hạn
                    </label>
                    <input
                      type="date"
                      min={formValues.activatedAt}
                      value={formValues.expiresAt}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, expiresAt: e.target.value }))
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Hạn mức xe tối đa
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formValues.maxVehicles}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          maxVehicles: e.target.value.replace(/\D/g, '').slice(0, 4)
                        }))
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Phí gói / tháng (₫)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formValues.monthlyFee}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          monthlyFee: e.target.value.replace(/\D/g, '').slice(0, 10)
                        }))
                      }
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  {editingTenant ? 'Lưu thay đổi' : 'Lưu doanh nghiệp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BƯỚC 1 GIA HẠN: CHỌN GÓI & THỜI HẠN ================= */}
      {isRenewModalOpen && renewTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gia hạn & Nâng cấp gói dịch vụ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bước 1/2 • {renewTenant.name} ({renewTenant.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRenewModalOpen(false);
                  setRenewTenant(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn gói dịch vụ áp dụng
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(['STARTER', 'PRO', 'ENTERPRISE'] as SubscriptionPlan[]).map((pKey) => {
                    const cfg = PLAN_CONFIGS[pKey];
                    const selected = renewPlan === pKey;
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => setRenewPlan(pKey)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${selected
                            ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{cfg.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Hạn mức tối đa {cfg.maxVehicles} xe
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          {cfg.monthlyFee.toLocaleString('vi-VN')} đ/tháng
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Thời hạn gia hạn
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { months: 1, label: '1 tháng' },
                    { months: 6, label: '6 tháng' },
                    { months: 12, label: '12 tháng' }
                  ].map((opt) => (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setRenewMonths(opt.months)}
                      className={`py-2 rounded-lg border text-xs font-bold cursor-pointer ${renewMonths === opt.months
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">
                  Tổng thanh toán kỳ gia hạn:
                </span>
                <span className="text-sm font-mono font-bold text-emerald-800">
                  {(PLAN_CONFIGS[renewPlan].monthlyFee * renewMonths).toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenewModalOpen(false);
                    setRenewTenant(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPaymentPage}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục phương thức thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
