import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Car,
  LogOut,
  ArrowRight,
  UserCircle,
  Plus,
  X,
  History,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Ban,
  AlertCircle,
  Upload,
  Users,
  Video,
  Image as ImageIcon,
  Eye,
  Clock,
  Wallet,
  LayoutGrid,
  Receipt,
  BarChart3,
  Globe
} from 'lucide-react';
import {
  readAdminAuditLogs,
  recordAdminAction,
  formatAuditTime
} from './adminAudit';
import type { AdminAuditLog } from './adminAudit';
import type { AdminRole } from './adminAccounts';
import AdminBillingManagement, {
  SharedRenewalModal,
  syncUnifiedPlatformData,
  commitUnifiedPlatformData,
  computeUnifiedPlatformMetrics,
  settleTenantRemainingBalance,
  validatePartialDueDate,
  getPackagePrice,
  readAdminLang,
  toggleAdminLang,
  translateFromViEn,
  ADMIN_LANG_CHANGE_EVENT,
  PLATFORM_SYNC_EVENT,
  EXPIRING_SOON_DAYS,
  MAX_PARTIAL_SETTLE_DAYS,
  RENTAL_PACKAGES,
  SERVICE_TIERS,
  compressImageToDataURL
} from './AdminBillingManagement';
import type {
  AdminLang,
  UnifiedTenantRecord,
  TenantLifecycleStatus,
  ServiceTier,
  ContractEvidenceItem,
  BillingInvoice
} from './AdminBillingManagement';
import AdminDashboard from './AdminDashboard';
import AdminAccountList from './AdminAccountList';
import AdminDevices from './AdminDevices';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED';
export type SubscriptionPlan = 'PKG_6M' | 'PKG_12M';
export type TenantRecord = UnifiedTenantRecord;

export interface LinkedInventoryDevice {
  id: string;
  imei: string;
  serial: string;
  type: string;
  received: string;
  status: string;
  tenantId: string;
  vehicle: string;
  history: { time: string; detail: string }[];
}

interface PackageConfig {
  key: SubscriptionPlan;
  packageId: 'pkg-6m' | 'pkg-12m';
  label: string;
  shortLabel: string;
  durationMonths: 6 | 12;
  price: number;
  description: string;
}

const INVENTORY_STORAGE_KEY = 'sys_admin_inventory_demo_v1';

const DEFAULT_DEMO_DEVICES: LinkedInventoryDevice[] = [
  {
    id: 'demo-1',
    imei: '356938035643809',
    serial: 'CAM-DL-001',
    type: 'Camera',
    received: '2026-10-15',
    status: 'Đang sử dụng',
    tenantId: 'COMPANY_A',
    vehicle: '29A-111.11',
    history: [
      {
        time: '2026-10-16T09:00:00',
        detail: 'Đã liên kết với Demo CTY A · xe 29A-111.11'
      }
    ]
  },
  {
    id: 'demo-2',
    imei: '356938035643817',
    serial: 'GPS-DL-002',
    type: 'Định vị GPS',
    received: '2026-11-01',
    status: 'Tồn kho',
    tenantId: '',
    vehicle: '',
    history: [{ time: '2026-11-01T09:00:00', detail: 'Nhập thiết bị vào kho' }]
  },
  {
    id: 'demo-3',
    imei: '356938035643825',
    serial: 'CAM-DL-003',
    type: 'Camera',
    received: '2026-11-05',
    status: 'Bảo hành',
    tenantId: 'COMPANY_B',
    vehicle: '43A-112.22',
    history: [
      { time: '2026-11-10T09:00:00', detail: 'Chuyển thiết bị sang bảo hành' }
    ]
  }
];

const readInventoryDevices = (): LinkedInventoryDevice[] => {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_DEVICES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d: any) => ({
      ...d,
      type:
        d.type === 'AI Camera'
          ? 'Camera'
          : d.type === 'GPS Tracker' || d.type === 'DL GPS'
            ? 'Định vị GPS'
            : d.type,
      status: d.status === 'Trong kho' ? 'Tồn kho' : d.status
    }));
  } catch {
    return [];
  }
};

const ROLE_LABELS_VI: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Quản trị hệ thống',
  SUPPORT_ADMIN: 'Hỗ trợ kỹ thuật',
  BILLING_ADMIN: 'Quản lý thanh toán'
};

const ROLE_LABELS_EN: Record<AdminRole, string> = {
  SUPER_ADMIN: 'System Admin',
  SUPPORT_ADMIN: 'Support Admin',
  BILLING_ADMIN: 'Billing Admin'
};

export const PACKAGE_CONFIGS: Record<SubscriptionPlan, PackageConfig> = {
  PKG_6M: {
    key: 'PKG_6M',
    packageId: RENTAL_PACKAGES[0].id,
    label: RENTAL_PACKAGES[0].name,
    shortLabel: RENTAL_PACKAGES[0].name,
    durationMonths: 6,
    price: RENTAL_PACKAGES[0].price,
    description: RENTAL_PACKAGES[0].description
  },
  PKG_12M: {
    key: 'PKG_12M',
    packageId: RENTAL_PACKAGES[1].id,
    label: RENTAL_PACKAGES[1].name,
    shortLabel: RENTAL_PACKAGES[1].name,
    durationMonths: 12,
    price: RENTAL_PACKAGES[1].price,
    description: RENTAL_PACKAGES[1].description
  }
};

const getTierPlanPrice = (tier: ServiceTier, plan: SubscriptionPlan): number =>
  getPackagePrice(tier, plan === 'PKG_12M' ? 12 : 6);

const PHONE_REGEX = /^0\d{9}$/;
const CODE_REGEX = /^[A-Z0-9]{4,12}$/;

const addDaysISO = (baseDateStr: string, days: number): string => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().split('T')[0];
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
};

const addMonthsISO = (baseDateStr: string, months: 6 | 12): string => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().split('T')[0];
  base.setMonth(base.getMonth() + months);
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

const getEffectiveLifecycle = (
  tenant: TenantRecord
): TenantLifecycleStatus => {
  if (tenant.status === 'SUSPENDED') return 'SUSPENDED';
  if (tenant.lifecycleStatus) return tenant.lifecycleStatus;
  const rem = tenant.remainingAmount ?? 0;
  if (!tenant.advanceNextCycleAmount && (tenant.paidAmount ?? 0) > 0 && rem > 0) {
    return 'PARTIAL_PAID';
  }
  const days = getRemainingDays(tenant.expiresAt);
  if (days < 0) return 'SUSPENDED';
  if (days <= EXPIRING_SOON_DAYS) return 'EXPIRING_SOON';
  return 'ACTIVE';
};

export default function AdminTenantList() {
  const navigate = useNavigate();

  const [adminLang, setAdminLang] = useState<AdminLang>(() => readAdminLang());
  const tr = (key: string, params?: Record<string, string | number>) =>
    translateFromViEn(adminLang, key, params);

  useEffect(() => {
    const onLang = () => setAdminLang(readAdminLang());
    window.addEventListener(ADMIN_LANG_CHANGE_EVENT, onLang);
    window.addEventListener('storage', onLang);
    return () => {
      window.removeEventListener(ADMIN_LANG_CHANGE_EVENT, onLang);
      window.removeEventListener('storage', onLang);
    };
  }, []);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'tenants' | 'billing' | 'dashboard' | 'accounts' | 'devices'
  >('overview');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});
  const [devices, setDevices] = useState<LinkedInventoryDevice[]>([]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{
    title: string;
    subtitle: string;
    imageUrl: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'EXPIRING' | 'PARTIAL' | 'SUSPENDED'
  >('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | SubscriptionPlan>('ALL');

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
    tier: ServiceTier;
    plan: SubscriptionPlan;
    activatedAt: string;
    expiresAt: string;
    paidAmount: string;
    remainingDueDate: string;
    contractImage: string;
    notes: string;
  }>({
    name: '',
    code: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    tier: 'PRO',
    plan: 'PKG_6M',
    activatedAt: new Date().toISOString().split('T')[0],
    expiresAt: addMonthsISO(new Date().toISOString().split('T')[0], 6),
    paidAmount: String(getTierPlanPrice('PRO', 'PKG_6M')),
    remainingDueDate: addDaysISO(new Date().toISOString().split('T')[0], 14),
    contractImage: '',
    notes: ''
  });

  const [renewTenant, setRenewTenant] = useState<TenantRecord | null>(null);

  const adminName = sessionStorage.getItem('sys_core_admin_name') || 'Nguyễn Nhật Long';
  const adminUsername = sessionStorage.getItem('sys_core_username') || '';
  const rawSessionRole = sessionStorage.getItem('sys_core_role') as AdminRole | null;
  const roleMap = adminLang === 'en' ? ROLE_LABELS_EN : ROLE_LABELS_VI;
  const roleBadgeText =
    rawSessionRole && roleMap[rawSessionRole]
      ? roleMap[rawSessionRole]
      : roleMap.SUPER_ADMIN;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const getTierDisplayName = (tier: ServiceTier) => {
    if (tier === 'BASIC') return tr('admin.tierBasic');
    if (tier === 'ENTERPRISE') return tr('admin.tierEnterprise');
    return tr('admin.tierPro');
  };

  const getPlanDisplayName = (plan: SubscriptionPlan) =>
    plan === 'PKG_12M' ? tr('admin.pkg12m') : tr('admin.pkg6m');

  const logAction = (action: string, details: string) => {
    recordAdminAction(
      action,
      details,
      adminUsername ? { username: adminUsername, fullName: adminName } : undefined
    );
    setAuditLogs(readAdminAuditLogs());
    window.dispatchEvent(new CustomEvent(PLATFORM_SYNC_EVENT));
  };

  const loadData = () => {
    const synced = syncUnifiedPlatformData();
    setTenants(synced.tenants);
    setInvoices(synced.invoices);

    setSelectedTenant((prev) =>
      prev ? synced.tenants.find((t) => t.id === prev.id) || null : null
    );

    const counts: Record<string, number> = {};
    synced.tenants.forEach((tenant) => {
      const tenantVehiclesRaw = localStorage.getItem(`sys_vehicles_${tenant.id}`);
      if (tenantVehiclesRaw) {
        try {
          const vList = JSON.parse(tenantVehiclesRaw);
          counts[tenant.id] = Array.isArray(vList) ? vList.length : 0;
        } catch {
          counts[tenant.id] = 0;
        }
      } else {
        counts[tenant.id] =
          tenant.id === 'COMPANY_A'
            ? 5
            : tenant.id === 'COMPANY_B'
              ? 2
              : tenant.id === 'COMPANY_C'
                ? 1
                : 0;
      }
    });
    setVehicleCountMap(counts);
    setDevices(readInventoryDevices());
    setAuditLogs(readAdminAuditLogs());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener(PLATFORM_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(PLATFORM_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeSection]);

  const devicesByTenant = useMemo(() => {
    const map: Record<string, LinkedInventoryDevice[]> = {};
    devices.forEach((d) => {
      if (!d.tenantId) return;
      if (!map[d.tenantId]) map[d.tenantId] = [];
      map[d.tenantId].push(d);
    });
    return map;
  }, [devices]);

  const persistAll = (nextTenants: TenantRecord[], nextInvoices: BillingInvoice[]) => {
    const synced = commitUnifiedPlatformData(nextTenants, nextInvoices);
    setTenants(synced.tenants);
    setInvoices(synced.invoices);
  };

  const handleImpersonate = (tenantId: string, tenantName: string) => {
    logAction(
      adminLang === 'en' ? 'ACCESS' : 'TRUY CẬP',
      adminLang === 'en'
        ? `Impersonated enterprise portal: ${tenantName}`
        : `Nhập vai quản trị vào hệ thống: ${tenantName}`
    );

    localStorage.setItem('isAdminImpersonating', 'true');
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('tenantName', tenantName);
    localStorage.setItem('userRole', 'SUPER_ADMIN_VIEW');
    navigate('/overview');
  };

  const handleLogout = () => {
    logAction(
      adminLang === 'en' ? 'LOGOUT' : 'ĐĂNG XUẤT',
      adminLang === 'en' ? 'Signed out of admin session' : 'Kết thúc phiên làm việc'
    );
    sessionStorage.removeItem('sys_core_role');
    sessionStorage.removeItem('sys_core_admin_name');
    sessionStorage.removeItem('sys_core_username');
    navigate('/overview/admin/login');
  };

  const metrics = useMemo(() => {
    const base = computeUnifiedPlatformMetrics(
      tenants,
      invoices,
      vehicleCountMap,
      devices
    );
    const expiring15Days = tenants.filter((t) => {
      const days = getRemainingDays(t.expiresAt);
      return t.status === 'ACTIVE' && days >= 0 && days <= 15;
    }).length;

    return {
      total: base.totalTenants,
      active: base.activeCount,
      suspended: base.suspendedCount,
      expiringSoon: base.expiringSoonCount,
      expiring15Days,
      partialCount: base.partialCount,
      totalRegisteredVehicles: base.totalVehicles,
      totalActivePackageRevenue: base.totalPackageValue,
      monthlyEquivalentTotal: base.monthlyPackageRevenue,
      count6M: base.count6M,
      count12M: base.count12M,
      linkedDevicesCount: devices.filter((d) => Boolean(d.tenantId)).length,
      activeLinkedDevicesCount: base.inUseDevices
    };
  }, [tenants, invoices, vehicleCountMap, devices]);

  const filteredTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tenants.filter((t) => {
      const lifecycle = getEffectiveLifecycle(t);
      const days = getRemainingDays(t.expiresAt);

      if (statusFilter === 'EXPIRING') {
        if (!(t.status === 'ACTIVE' && days >= 0 && days <= EXPIRING_SOON_DAYS)) {
          return false;
        }
      } else if (statusFilter === 'PARTIAL') {
        if (lifecycle !== 'PARTIAL_PAID') return false;
      } else if (statusFilter === 'SUSPENDED') {
        if (t.status !== 'SUSPENDED') return false;
      } else if (statusFilter === 'ACTIVE') {
        if (t.status !== 'ACTIVE') return false;
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
    setEditingTenant(null);
    setFormError('');
    setFormValues({
      name: '',
      code: `CTY${Math.floor(100 + Math.random() * 900)}`,
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      tier: 'PRO',
      plan: 'PKG_6M',
      activatedAt: todayStr,
      expiresAt: addMonthsISO(todayStr, 6),
      paidAmount: String(getTierPlanPrice('PRO', 'PKG_6M')),
      remainingDueDate: addDaysISO(todayStr, 14),
      contractImage: '',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (tenant: TenantRecord) => {
    const currentTier = tenant.tier || 'PRO';
    const currentPrice =
      tenant.packagePrice || getTierPlanPrice(currentTier, tenant.plan);
    const currentPaid =
      typeof tenant.paidAmount === 'number'
        ? Math.min(currentPrice, tenant.paidAmount)
        : tenant.status === 'SUSPENDED'
          ? 0
          : currentPrice;

    setEditingTenant(tenant);
    setFormError('');
    setFormValues({
      name: tenant.name,
      code: tenant.code,
      ownerName: tenant.ownerName,
      phone: tenant.phone,
      email: tenant.email || '',
      address: tenant.address,
      tier: currentTier,
      plan: tenant.plan,
      activatedAt: tenant.activatedAt,
      expiresAt: tenant.expiresAt,
      paidAmount: String(currentPaid),
      remainingDueDate: tenant.remainingDueDate || addDaysISO(todayStr, 14),
      contractImage: '',
      notes: tenant.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleSelectPlanInForm = (newPlan: SubscriptionPlan) => {
    const cfg = PACKAGE_CONFIGS[newPlan];
    setFormValues((prev) => {
      const prevNum = Number(prev.paidAmount.replace(/[^0-9]/g, '')) || 0;
      const oldPrice = getTierPlanPrice(prev.tier, prev.plan);
      const nextPrice = getTierPlanPrice(prev.tier, newPlan);
      const nextPaid =
        prevNum === oldPrice || prevNum === 0 ? String(nextPrice) : prev.paidAmount;
      return {
        ...prev,
        plan: newPlan,
        expiresAt: addMonthsISO(prev.activatedAt, cfg.durationMonths),
        paidAmount: nextPaid
      };
    });
  };

  const handleSelectTierInForm = (newTier: ServiceTier) => {
    setFormValues((prev) => {
      const prevNum = Number(prev.paidAmount.replace(/[^0-9]/g, '')) || 0;
      const oldPrice = getTierPlanPrice(prev.tier, prev.plan);
      const nextPrice = getTierPlanPrice(newTier, prev.plan);
      const nextPaid =
        prevNum === oldPrice || prevNum === 0 ? String(nextPrice) : prev.paidAmount;
      return {
        ...prev,
        tier: newTier,
        paidAmount: nextPaid
      };
    });
  };

  const handleFormContractImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageToDataURL(file);
    setFormValues((prev) => ({ ...prev, contractImage: compressed }));
    if (formError) setFormError('');
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formValues.name.trim();
    const cleanCode = formValues.code.trim().toUpperCase();
    const cleanOwner = formValues.ownerName.trim();
    const cleanPhone = formValues.phone.replace(/\D/g, '');
    const cleanAddress = formValues.address.trim();

    if (cleanName.length < 2) {
      setFormError(
        adminLang === 'en'
          ? 'Please enter an enterprise name (at least 2 characters).'
          : 'Vui lòng nhập tên doanh nghiệp, tối thiểu 2 ký tự.'
      );
      return;
    }
    if (!CODE_REGEX.test(cleanCode)) {
      setFormError(
        adminLang === 'en'
          ? 'Enterprise code must be 4–12 uppercase letters or numbers, e.g. CTYA26.'
          : 'Mã doanh nghiệp phải gồm 4–12 ký tự chữ in hoa hoặc số, ví dụ CTYA26.'
      );
      return;
    }
    const isDuplicateCode = tenants.some(
      (t) => t.code.toUpperCase() === cleanCode && t.id !== editingTenant?.id
    );
    if (isDuplicateCode) {
      setFormError(
        adminLang === 'en'
          ? `Enterprise code "${cleanCode}" already exists.`
          : `Mã doanh nghiệp "${cleanCode}" đã tồn tại trên hệ thống.`
      );
      return;
    }
    if (cleanOwner.length < 2) {
      setFormError(
        adminLang === 'en'
          ? 'Please enter the owner or legal representative name.'
          : 'Vui lòng nhập tên chủ doanh nghiệp / người đại diện.'
      );
      return;
    }
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setFormError(
        adminLang === 'en'
          ? 'Phone number must be 10 digits starting with 0.'
          : 'Số điện thoại liên hệ phải gồm đúng 10 chữ số và bắt đầu bằng số 0.'
      );
      return;
    }
    if (
      formValues.activatedAt &&
      formValues.expiresAt &&
      formValues.expiresAt < formValues.activatedAt
    ) {
      setFormError(
        adminLang === 'en'
          ? 'Expiration date cannot be earlier than activation date.'
          : 'Ngày hết hạn gói dịch vụ không được trước ngày kích hoạt.'
      );
      return;
    }

    const pkgCfg = PACKAGE_CONFIGS[formValues.plan];
    const pkgPrice = getTierPlanPrice(formValues.tier, formValues.plan);
    const rawPaidNum = Number(formValues.paidAmount.replace(/[^0-9]/g, ''));
    if (Number.isNaN(rawPaidNum) || rawPaidNum < 0) {
      setFormError(
        adminLang === 'en' ? 'Invalid paid amount.' : 'Số tiền đã thu không hợp lệ.'
      );
      return;
    }
    if (rawPaidNum > pkgPrice) {
      setFormError(
        adminLang === 'en'
          ? `Paid amount cannot exceed plan total (${pkgPrice.toLocaleString('vi-VN')} ₫).`
          : `Số tiền đã thu không được vượt quá giá trọn gói (${pkgPrice.toLocaleString('vi-VN')} ₫).`
      );
      return;
    }

    const remainingAmount = Math.max(0, pkgPrice - rawPaidNum);
    const isPartial = rawPaidNum > 0 && remainingAmount > 0;
    if (isPartial) {
      const dueErr = validatePartialDueDate(
        formValues.remainingDueDate,
        formValues.expiresAt,
        todayStr
      );
      if (dueErr) {
        setFormError(dueErr);
        return;
      }
    }

    if (!editingTenant && !formValues.contractImage) {
      setFormError(
        adminLang === 'en'
          ? 'Please upload a contract proof image for verification.'
          : 'Vui lòng tải lên ảnh minh chứng hợp đồng để lưu hồ sơ đối soát.'
      );
      return;
    }

    const tierOpt = SERVICE_TIERS[formValues.tier];
    const monthlyEquivalent = Math.round(pkgPrice / pkgCfg.durationMonths);
    const currentInvoices = syncUnifiedPlatformData().invoices;
    const nowIso = new Date().toISOString();
    const resolvedRemainingDue = isPartial ? formValues.remainingDueDate : undefined;

    if (editingTenant) {
      const nextHistory: ContractEvidenceItem[] = [
        ...(editingTenant.evidenceHistory || [])
      ];
      if (formValues.contractImage) {
        nextHistory.unshift({
          id: `ev-${Date.now()}`,
          type: 'INITIAL',
          title: 'Bổ sung minh chứng hợp đồng',
          tierLabel: tierOpt.label,
          packageName: pkgCfg.label,
          amount: pkgPrice,
          startDate: formValues.activatedAt,
          endDate: formValues.expiresAt,
          imageUrl: formValues.contractImage,
          uploadedAt: nowIso
        });
      }

      const updatedTenants = tenants.map((t) =>
        t.id === editingTenant.id
          ? {
            ...t,
            name: cleanName,
            code: cleanCode,
            ownerName: cleanOwner,
            phone: cleanPhone,
            email: formValues.email.trim(),
            address: cleanAddress || tr('admin.unassigned'),
            status: 'ACTIVE' as TenantStatus,
            paidAmount: rawPaidNum,
            remainingAmount,
            remainingDueDate: resolvedRemainingDue,
            tier: formValues.tier,
            plan: formValues.plan,
            packagePrice: pkgPrice,
            monthlyFee: monthlyEquivalent,
            activatedAt: formValues.activatedAt,
            expiresAt: formValues.expiresAt,
            evidenceHistory: nextHistory,
            notes: formValues.notes.trim(),
            updatedAt: nowIso
          }
          : t
      );

      const matchingInvs = currentInvoices.filter(
        (inv) =>
          inv.tenantId === editingTenant.id ||
          inv.tenantCode.toUpperCase() === editingTenant.code.toUpperCase()
      );
      const latestInvId =
        matchingInvs.length > 0
          ? matchingInvs.reduce((a, b) =>
            `${b.endDate}__${b.updatedAt}` >= `${a.endDate}__${a.updatedAt}` ? b : a
          ).id
          : null;

      const updatedInvoices: BillingInvoice[] = currentInvoices.map((inv) => {
        if (inv.id !== latestInvId) return inv;
        return {
          ...inv,
          tenantName: cleanName,
          tenantCode: cleanCode,
          tier: formValues.tier,
          tierName: tierOpt.label,
          packageId: pkgCfg.packageId,
          packageName: pkgCfg.label,
          duration: pkgCfg.durationMonths,
          totalAmount: pkgPrice,
          paidAmount: rawPaidNum,
          remainingDueDate: resolvedRemainingDue,
          startDate: formValues.activatedAt,
          endDate: formValues.expiresAt,
          proofImage: formValues.contractImage || inv.proofImage,
          updatedAt: nowIso
        };
      });

      persistAll(updatedTenants, updatedInvoices);
      logAction(
        adminLang === 'en' ? 'UPDATE' : 'CẬP NHẬT',
        `Cập nhật doanh nghiệp: ${cleanName} • Mã: ${cleanCode} • Hạng ${tierOpt.label} (${pkgCfg.label}) • Đã thu ${rawPaidNum.toLocaleString('vi-VN')} ₫ / ${pkgPrice.toLocaleString('vi-VN')} ₫`
      );
    } else {
      const newId = `COMPANY_${Date.now()}`;
      const initialEvidence: ContractEvidenceItem = {
        id: `ev-${Date.now()}`,
        type: 'INITIAL',
        title: 'Hợp đồng đăng ký mới',
        tierLabel: tierOpt.label,
        packageName: pkgCfg.label,
        amount: pkgPrice,
        startDate: formValues.activatedAt,
        endDate: formValues.expiresAt,
        imageUrl: formValues.contractImage,
        uploadedAt: nowIso
      };

      const newTenant: TenantRecord = {
        id: newId,
        name: cleanName,
        code: cleanCode,
        ownerName: cleanOwner,
        phone: cleanPhone,
        email: formValues.email.trim(),
        address: cleanAddress || tr('admin.unassigned'),
        status: 'ACTIVE',
        paidAmount: rawPaidNum,
        remainingAmount,
        remainingDueDate: resolvedRemainingDue,
        tier: formValues.tier,
        plan: formValues.plan,
        packagePrice: pkgPrice,
        monthlyFee: monthlyEquivalent,
        activatedAt: formValues.activatedAt,
        expiresAt: formValues.expiresAt,
        evidenceHistory: [initialEvidence],
        notes: formValues.notes.trim(),
        updatedAt: nowIso
      };

      const newInvoice: BillingInvoice = {
        id: `inv-${Date.now()}`,
        invoiceCode: `INV-2026-${String(currentInvoices.length + 1).padStart(3, '0')}`,
        tenantId: newId,
        tenantName: cleanName,
        tenantCode: cleanCode,
        tier: formValues.tier,
        tierName: tierOpt.label,
        packageId: pkgCfg.packageId,
        packageName: pkgCfg.label,
        duration: pkgCfg.durationMonths,
        totalAmount: pkgPrice,
        paidAmount: rawPaidNum,
        remainingDueDate: resolvedRemainingDue,
        startDate: formValues.activatedAt,
        endDate: formValues.expiresAt,
        dueDate: addDaysISO(formValues.activatedAt, 7),
        paymentMethod: 'BANK_TRANSFER',
        proofImage: formValues.contractImage,
        note: `Hợp đồng mới hạng ${tierOpt.label} (${pkgCfg.label})`,
        updatedAt: nowIso
      };

      persistAll([...tenants, newTenant], [newInvoice, ...currentInvoices]);
      setVehicleCountMap((prev) => ({ ...prev, [newId]: 0 }));
      logAction(
        adminLang === 'en' ? 'CREATE' : 'THÊM MỚI',
        `Tạo doanh nghiệp: ${cleanName} • Mã: ${cleanCode} • Hạng ${tierOpt.label} (${pkgCfg.label}) • Đã thu ${rawPaidNum.toLocaleString('vi-VN')} ₫ / ${pkgPrice.toLocaleString('vi-VN')} ₫`
      );
    }

    setIsFormModalOpen(false);
  };

  const handleQuickStatusChange = (
    tenant: TenantRecord,
    nextStatus: TenantStatus
  ) => {
    const nowIso = new Date().toISOString();
    const updatedTenants = tenants.map((t) =>
      t.id === tenant.id ? { ...t, status: nextStatus, updatedAt: nowIso } : t
    );
    const currentInvoices = syncUnifiedPlatformData().invoices.map((inv) =>
      inv.tenantId === tenant.id ||
        inv.tenantCode.toUpperCase() === tenant.code.toUpperCase()
        ? { ...inv, updatedAt: nowIso }
        : inv
    );
    persistAll(updatedTenants, currentInvoices);
    logAction(
      adminLang === 'en' ? 'STATUS' : 'TRẠNG THÁI',
      `Chuyển ${tenant.name} • ${tenant.code} sang ${nextStatus === 'ACTIVE' ? tr('admin.statusActive') : tr('admin.statusSuspended')
      }`
    );
  };

  const handleSettleRemaining = (tenant: TenantRecord) => {
    const remaining = Math.max(0, tenant.remainingAmount ?? 0);
    if (remaining <= 0) return;

    const ok = settleTenantRemainingBalance(tenant.id);
    if (ok) {
      loadData();
      logAction(
        adminLang === 'en' ? 'PAYMENT' : 'THU TIỀN',
        `Thu đủ phần còn lại ${remaining.toLocaleString('vi-VN')} ₫ cho ${tenant.name} • ${tenant.code}`
      );
    }
  };

  const handleDeleteTenant = (tenant: TenantRecord) => {
    const linked = devicesByTenant[tenant.id] || [];
    const confirmMsg =
      adminLang === 'en'
        ? linked.length > 0
          ? `Enterprise "${tenant.name}" (${tenant.code}) has ${linked.length} linked device(s). Delete enterprise, related invoices, and release devices to stock?`
          : `Delete enterprise "${tenant.name}" (${tenant.code}) and related rental invoices?`
        : linked.length > 0
          ? `Doanh nghiệp "${tenant.name}" • Mã ${tenant.code} đang liên kết ${linked.length} thiết bị Camera/Định vị GPS. Xác nhận xóa doanh nghiệp, các phiếu công nợ liên quan và tháo liên kết các thiết bị về Tồn kho?`
          : `Xác nhận xóa doanh nghiệp "${tenant.name}" • Mã ${tenant.code} và các phiếu gói thuê liên quan khỏi hệ thống?`;

    if (!window.confirm(confirmMsg)) return;

    if (linked.length > 0) {
      const currentInventory = readInventoryDevices();
      const updatedInventory = currentInventory.map((d) =>
        d.tenantId === tenant.id
          ? {
            ...d,
            tenantId: '',
            vehicle: '',
            status:
              d.status === 'Đang sử dụng' || d.status === 'Đang lắp đặt'
                ? 'Tồn kho'
                : d.status,
            history: [
              {
                time: new Date().toISOString(),
                detail: `Tự động tháo liên kết do xóa doanh nghiệp ${tenant.name}`
              },
              ...(Array.isArray(d.history) ? d.history : [])
            ]
          }
          : d
      );
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
      setDevices(updatedInventory);
    }

    const currentInvoices = syncUnifiedPlatformData().invoices;
    const nextInvoices = currentInvoices.filter(
      (i) =>
        i.tenantId !== tenant.id &&
        i.tenantCode.toUpperCase() !== tenant.code.toUpperCase()
    );
    const nextTenants = tenants.filter((t) => t.id !== tenant.id);

    persistAll(nextTenants, nextInvoices);
    logAction(
      adminLang === 'en' ? 'DELETE' : 'XÓA',
      `Xóa doanh nghiệp: ${tenant.name} • Mã: ${tenant.code}`
    );
  };

  const renderStatusBadge = (tenant: TenantRecord) => {
    const lifecycle = getEffectiveLifecycle(tenant);
    const remainingDebt = Math.max(0, tenant.remainingAmount ?? 0);
    const advanceNext = Math.max(0, tenant.advanceNextCycleAmount ?? 0);
    const days = getRemainingDays(tenant.expiresAt);
    const isExpiringSoon =
      tenant.status === 'ACTIVE' && days >= 0 && days <= EXPIRING_SOON_DAYS;

    const countdownLabel =
      days === 0
        ? tr('admin.statusToday')
        : tr('admin.statusDaysLeft', { days: Math.max(0, days) });

    if (lifecycle === 'SUSPENDED') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            {tr('admin.statusSuspended')}
          </span>
          {advanceNext > 0 && (
            <span className="text-[10px] font-medium text-sky-700 tabular-nums">
              {adminLang === 'en' ? 'Paid ahead next cycle' : 'Đã trả trước kỳ sau'}:{' '}
              {advanceNext.toLocaleString('vi-VN')} ₫
            </span>
          )}
        </div>
      );
    }

    if (lifecycle === 'PARTIAL_PAID') {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {tr('admin.statusActive')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800 tabular-nums">
            <Wallet className="w-3 h-3 text-amber-600" />
            {tr('admin.statusPartial')} · {remainingDebt.toLocaleString('vi-VN')} ₫
          </span>
          {isExpiringSoon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-800 tabular-nums">
              <Clock className="w-3 h-3 text-sky-600" />
              {countdownLabel}
            </span>
          )}
          {tenant.remainingDueDate && (
            <span className="text-[10px] font-medium text-amber-700 tabular-nums">
              {adminLang === 'en' ? 'Due full' : 'Hẹn trả đủ'}: {formatDateVN(tenant.remainingDueDate)}
            </span>
          )}
        </div>
      );
    }

    if (lifecycle === 'EXPIRING_SOON' || isExpiringSoon) {
      return (
        <div className="inline-flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {tr('admin.statusActive')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-800 tabular-nums">
            <Clock className="w-3 h-3 text-sky-600" />
            {countdownLabel}
          </span>
          {advanceNext > 0 && (
            <span className="text-[10px] font-medium text-emerald-700 tabular-nums">
              {adminLang === 'en' ? 'Paid ahead next cycle' : 'Đã trả trước kỳ sau'}:{' '}
              {advanceNext.toLocaleString('vi-VN')} ₫
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="inline-flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {tr('admin.statusActive')}
        </span>
        {advanceNext > 0 && (
          <span className="text-[10px] font-medium text-emerald-700 tabular-nums">
            {adminLang === 'en' ? 'Paid ahead next cycle' : 'Đã trả trước kỳ sau'}:{' '}
            {advanceNext.toLocaleString('vi-VN')} ₫
          </span>
        )}
      </div>
    );
  };

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-rose-500 focus:outline-none';

  const currentPageTitle =
    activeSection === 'overview'
      ? tr('admin.overviewMenu')
      : activeSection === 'billing'
        ? tr('admin.tabBilling')
        : activeSection === 'dashboard'
          ? tr('admin.tabDashboard')
          : activeSection === 'accounts'
            ? tr('admin.accountsMenu')
            : activeSection === 'devices'
              ? tr('admin.devicesMenu')
              : tr('admin.tabTenants');

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col font-sans">
      <header className="h-12 bg-white border-b border-slate-200/90 px-4 lg:px-6 flex items-center justify-end shrink-0">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-800">{adminName}</span>
          <span className="text-slate-300">·</span>
          <span className="font-semibold text-rose-600">{roleBadgeText}</span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-60 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0">
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-base leading-tight truncate">
                  DriveLinker
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                  {tr('admin.brandSub')}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {tr('admin.systemGroup')}
              </div>

              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'overview'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>{tr('admin.overviewMenu')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('tenants')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'tenants'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{tr('admin.tabTenants')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('accounts')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'accounts'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>{tr('admin.accountsMenu')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('billing')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'billing'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Receipt className="w-4 h-4 shrink-0" />
                <span>{tr('admin.tabBilling')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('dashboard')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'dashboard'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>{tr('admin.tabDashboard')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('devices')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${activeSection === 'devices'
                  ? 'bg-rose-50/90 text-rose-600'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>{tr('admin.devicesMenu')}</span>
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{tr('nav.logout')}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 px-6 lg:px-8 py-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
                {activeSection === 'overview' ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : activeSection === 'accounts' ? (
                  <Users className="w-4 h-4" />
                ) : activeSection === 'devices' ? (
                  <Video className="w-4 h-4" />
                ) : activeSection === 'billing' ? (
                  <Receipt className="w-4 h-4" />
                ) : activeSection === 'dashboard' ? (
                  <BarChart3 className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {currentPageTitle}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tr('admin.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAdminLang(toggleAdminLang())}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={adminLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              >
                <Globe className="w-3.5 h-3.5 text-rose-600" />
                <span>{adminLang === 'vi' ? 'VI → EN' : 'EN → VI'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditLogs(readAdminAuditLogs());
                  setIsHistoryModalOpen(true);
                }}
                className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>{tr('admin.historyBtn')}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[11px] text-slate-600 tabular-nums">
                  {auditLogs.length}
                </span>
              </button>

              {(activeSection === 'tenants' || activeSection === 'overview') && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr('admin.addNewBtn')}</span>
                </button>
              )}

              <div className="h-9 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-900">{adminName}</div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {roleBadgeText}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title={tr('nav.logout')}
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeSection === 'tenants' && (
            <div className="flex items-center justify-end">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${viewMode === 'table'
                    ? 'bg-[#0B1324] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tr('admin.viewTable')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${viewMode === 'cards'
                    ? 'bg-[#0B1324] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tr('admin.viewCards')}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'dashboard' ? (
            <AdminDashboard onNavigateSection={(sec) => setActiveSection(sec)} />
          ) : activeSection === 'billing' ? (
            <AdminBillingManagement />
          ) : activeSection === 'accounts' ? (
            <AdminAccountList embedded />
          ) : activeSection === 'devices' ? (
            <AdminDevices embedded />
          ) : activeSection === 'overview' ? (
            <main className="space-y-5">
              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {tr('admin.sectionOverview')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tr('admin.sectionOverviewSub')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('tenants')}
                    className="bg-white rounded-xl border border-slate-200/90 p-5 text-left hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardTenants')}</span>
                      <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                      {metrics.total}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {tr('admin.cardTenantsSub')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuditLogs(readAdminAuditLogs());
                      setIsHistoryModalOpen(true);
                    }}
                    className="bg-white rounded-xl border border-slate-200/90 p-5 text-left hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardActivity')}</span>
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                      {auditLogs.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {tr('admin.cardActivitySub')}
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardTotalTenants')}</span>
                      <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                      {metrics.total}
                    </div>
                    <div className="text-xs mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-600 font-semibold">
                        {metrics.active} {tr('admin.statusActive').toLowerCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-700 font-medium">
                        {metrics.partialCount} {tr('admin.statusPartial').toLowerCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-rose-600 font-medium">
                        {metrics.suspended} {tr('admin.statusSuspended').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardMonthlyPkg')}</span>
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">
                      {metrics.monthlyEquivalentTotal.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                      {tr('admin.cardMonthlyPkgSub', { count: metrics.active })}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardFleetScale')}</span>
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Car className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                      {metrics.totalRegisteredVehicles}{' '}
                      <span className="text-sm font-normal text-slate-400">
                        / {Math.max(100, metrics.total * 20)}{' '}
                        {adminLang === 'en' ? 'vehicles' : 'xe'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 tabular-nums">
                      {adminLang === 'en'
                        ? `${metrics.linkedDevicesCount} linked device(s) (${metrics.activeLinkedDevicesCount} active)`
                        : `${metrics.linkedDevicesCount} thiết bị liên kết (${metrics.activeLinkedDevicesCount} đang hoạt động)`}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{tr('admin.cardExpiryWarn')}</span>
                      <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 mt-2 tabular-nums">
                      {metrics.expiring15Days}{' '}
                      <span className="text-sm font-normal text-slate-500">
                        {adminLang === 'en' ? 'enterprises' : 'đơn vị'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      {tr('admin.cardExpiryWarnSub')}
                    </div>
                  </div>
                </div>
              </section>
            </main>
          ) : (
            <main className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { key: 'ALL', label: tr('admin.filterAll'), count: metrics.total },
                      { key: 'ACTIVE', label: tr('admin.statusActive'), count: metrics.active },
                      { key: 'EXPIRING', label: tr('admin.statusExpiring'), count: metrics.expiringSoon },
                      { key: 'PARTIAL', label: tr('admin.statusPartial'), count: metrics.partialCount },
                      { key: 'SUSPENDED', label: tr('admin.statusSuspended'), count: metrics.suspended }
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${active
                          ? 'bg-[#0B1324] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                          }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-initial justify-end">
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value as 'ALL' | SubscriptionPlan)}
                    className="h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-rose-500"
                  >
                    <option value="ALL">{tr('admin.filterAllPlans')}</option>
                    <option value="PKG_6M">{tr('admin.pkg6m')}</option>
                    <option value="PKG_12M">{tr('admin.pkg12m')}</option>
                  </select>

                  <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={tr('admin.searchTenantPlaceholder')}
                      className="h-9 w-full pl-9 pr-3 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTenants.map((t) => {
                    const registeredCount = vehicleCountMap[t.id] || 0;
                    const linkedCount = (devicesByTenant[t.id] || []).length;
                    const evidenceCount = (t.evidenceHistory || []).length;
                    const isPartial = getEffectiveLifecycle(t) === 'PARTIAL_PAID';

                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-xl border border-slate-200/90 overflow-hidden flex flex-col justify-between shadow-2xs"
                      >
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600">
                                  {t.code}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{t.address}</p>
                            </div>
                            {renderStatusBadge(t)}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-400 block">{tr('admin.colTierPlan')}</span>
                              <span className="font-semibold text-slate-800">
                                {getTierDisplayName(t.tier || 'PRO')} · {getPlanDisplayName(t.plan)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{tr('admin.colFleetDocs')}</span>
                              <span className="font-semibold text-slate-800 tabular-nums">
                                {registeredCount} {adminLang === 'en' ? 'veh' : 'xe'} · {linkedCount}{' '}
                                {adminLang === 'en' ? 'dev' : 'TB'} · {evidenceCount}{' '}
                                {adminLang === 'en' ? 'docs' : 'ảnh HĐ'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{tr('admin.expiresLabel')}</span>
                              <span className="font-semibold text-slate-800 tabular-nums">
                                {formatDateVN(t.expiresAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`border-t border-slate-100 bg-slate-50 grid ${isPartial ? 'grid-cols-4' : 'grid-cols-3'
                            } divide-x divide-slate-200 text-xs font-semibold`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedTenant(t)}
                            className="py-2.5 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {tr('common.details')} ({evidenceCount})
                          </button>
                          {isPartial && (
                            <button
                              type="button"
                              onClick={() => handleSettleRemaining(t)}
                              className="py-2.5 text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              {tr('admin.settleDebtBtn')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRenewTenant(t)}
                            className="py-2.5 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {tr('admin.renewBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImpersonate(t.id, t.name)}
                            className="py-2.5 text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>{tr('admin.accessBtn')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1060px] text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="py-3.5 px-5">{tr('admin.colTenant')}</th>
                          <th className="py-3.5 px-4">{tr('admin.colOwner')}</th>
                          <th className="py-3.5 px-4">{tr('admin.colTierPlan')}</th>
                          <th className="py-3.5 px-4">{tr('admin.colFleetDocs')}</th>
                          <th className="py-3.5 px-4">{tr('common.status')}</th>
                          <th className="py-3.5 px-5 text-right">{tr('admin.colActions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTenants.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                              {tr('fleet.noVehiclesFiltered')}
                            </td>
                          </tr>
                        ) : (
                          filteredTenants.map((tenant) => {
                            const displayPrice =
                              tenant.packagePrice ||
                              getTierPlanPrice(tenant.tier || 'PRO', tenant.plan);
                            const registeredCount = vehicleCountMap[tenant.id] || 0;
                            const linkedList = devicesByTenant[tenant.id] || [];
                            const evidenceList = tenant.evidenceHistory || [];
                            const remainingDays = getRemainingDays(tenant.expiresAt);
                            const isPartial = getEffectiveLifecycle(tenant) === 'PARTIAL_PAID';

                            return (
                              <tr
                                key={tenant.id}
                                className="hover:bg-slate-50/70 transition-colors align-middle"
                              >
                                <td className="py-4 px-5 max-w-[260px]">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">
                                      {tenant.name}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-600">
                                      {tenant.code}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 truncate">
                                    {tenant.address || tr('admin.unassigned')}
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="font-medium text-slate-800">
                                    {tenant.ownerName}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                    {tenant.phone || tr('admin.unassigned')}
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                    <span className="px-2 py-0.5 rounded bg-[#0B1324] text-white text-[11px] font-semibold">
                                      {getTierDisplayName(tenant.tier || 'PRO')}
                                    </span>
                                    <span>{getPlanDisplayName(tenant.plan)}</span>
                                    <span className="text-xs font-normal text-slate-500 tabular-nums">
                                      · {displayPrice.toLocaleString('vi-VN')} ₫
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 tabular-nums">
                                    {tr('admin.expiresLabel')}: {formatDateVN(tenant.expiresAt)}
                                    {remainingDays < 0 ? (
                                      <span className="ml-1.5 text-rose-600 font-semibold">
                                        · {tr('admin.overdueDays', { days: Math.abs(remainingDays) })}
                                      </span>
                                    ) : remainingDays === 0 ? (
                                      <span className="ml-1.5 text-amber-700 font-semibold">
                                        · {tr('admin.statusToday')}
                                      </span>
                                    ) : remainingDays <= EXPIRING_SOON_DAYS ? (
                                      <span className="ml-1.5 text-amber-700 font-semibold">
                                        · {tr('admin.daysRemainingShort', { days: remainingDays })}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="text-xs font-medium text-slate-800 tabular-nums">
                                    {registeredCount} {adminLang === 'en' ? 'vehicles' : 'xe'} ·{' '}
                                    {linkedList.length}{' '}
                                    {adminLang === 'en' ? 'devices' : 'thiết bị'}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTenant(tenant)}
                                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>
                                      {evidenceList.length > 0
                                        ? tr('admin.contractImgCount', { count: evidenceList.length })
                                        : tr('admin.noContractImg')}
                                    </span>
                                  </button>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  {renderStatusBadge(tenant)}
                                </td>

                                <td className="py-4 px-5 whitespace-nowrap text-right">
                                  <div className="inline-flex items-center justify-end gap-2">
                                    {isPartial && (
                                      <button
                                        type="button"
                                        onClick={() => handleSettleRemaining(tenant)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                                      >
                                        {tr('admin.settleDebtBtn')}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleImpersonate(tenant.id, tenant.name)}
                                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <span>{tr('admin.accessBtn')}</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setRenewTenant(tenant)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      {tr('admin.renewBtn')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedTenant(tenant)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                      {tr('common.details')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openEditModal(tenant)}
                                      title={tr('common.edit')}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>

                                    {tenant.status !== 'SUSPENDED' ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickStatusChange(tenant, 'SUSPENDED')
                                        }
                                        title={tr('admin.statusSuspended')}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickStatusChange(tenant, 'ACTIVE')
                                        }
                                        title={tr('admin.statusActive')}
                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTenant(tenant)}
                                      title={tr('common.delete')}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
            </main>
          )}
        </div>
      </div>

      {/* MODAL GIA HẠN DÙNG CHUNG */}
      <SharedRenewalModal
        isOpen={Boolean(renewTenant)}
        onClose={() => setRenewTenant(null)}
        tenantId={renewTenant?.id || ''}
        tenantName={renewTenant?.name || ''}
        tenantCode={renewTenant?.code || ''}
        currentExpiresAt={renewTenant?.expiresAt}
        initialTier={renewTenant?.tier || 'PRO'}
        initialDuration={renewTenant?.plan === 'PKG_12M' ? 12 : 6}
        onCompleted={({ tenants: nextTenants, newInvoice }) => {
          setTenants(nextTenants);
          logAction(
            adminLang === 'en' ? 'RENEW' : 'GIA HẠN',
            `Tạo phiếu ${newInvoice.invoiceCode} gia hạn kỳ mới ${newInvoice.tierName} · ${newInvoice.packageName} (${newInvoice.totalAmount.toLocaleString('vi-VN')} ₫) cho ${newInvoice.tenantName}`
          );
        }}
      />

      {/* MODAL LỊCH SỬ THAO TÁC */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-slate-900 text-base">
                {adminLang === 'en' ? 'System Audit Logs' : 'Lịch sử thao tác hệ thống'}
              </h2>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">{adminLang === 'en' ? 'Time' : 'Thời gian'}</th>
                    <th className="px-6 py-3">{adminLang === 'en' ? 'Admin' : 'Quản trị viên'}</th>
                    <th className="px-6 py-3">{adminLang === 'en' ? 'Action' : 'Thao tác'}</th>
                    <th className="px-6 py-3">{tr('common.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        {tr('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {formatAuditTime(log)}
                        </td>
                        <td className="px-6 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {log.admin || adminName}
                        </td>
                        <td className="px-6 py-3 text-xs whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-600">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                {tr('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT DOANH NGHIỆP */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {selectedTenant.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {adminLang === 'en' ? 'Code' : 'Mã doanh nghiệp'}: {selectedTenant.code} · ID:{' '}
                    {selectedTenant.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <dt className="text-xs text-slate-500">{tr('common.status')}</dt>
                  <dd className="mt-1">{renderStatusBadge(selectedTenant)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    {adminLang === 'en' ? 'Service Tier' : 'Hạng gói dịch vụ'}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {getTierDisplayName(selectedTenant.tier || 'PRO')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    {adminLang === 'en' ? 'Rental Plan' : 'Gói thuê trọn gói'}
                  </dt>
                  <dd className="mt-1 font-semibold text-rose-600 tabular-nums">
                    {getPlanDisplayName(selectedTenant.plan)} —{' '}
                    {(
                      selectedTenant.packagePrice ||
                      getTierPlanPrice(selectedTenant.tier || 'PRO', selectedTenant.plan)
                    ).toLocaleString('vi-VN')}{' '}
                    ₫
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{tr('admin.colOwner')}</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {selectedTenant.ownerName || tr('admin.unassigned')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    {adminLang === 'en' ? 'Phone' : 'Số điện thoại'}
                  </dt>
                  <dd className="mt-1 font-medium text-slate-800 tabular-nums">
                    {selectedTenant.phone || tr('admin.unassigned')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">{tr('admin.expiresLabel')}</dt>
                  <dd className="mt-1 font-medium text-slate-800 tabular-nums">
                    {formatDateVN(selectedTenant.activatedAt)} →{' '}
                    {formatDateVN(selectedTenant.expiresAt)}
                  </dd>
                </div>
              </dl>

              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {tr('admin.contractImgCount', {
                      count: (selectedTenant.evidenceHistory || []).length
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedTenant;
                      setSelectedTenant(null);
                      setRenewTenant(target);
                    }}
                    className="font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    + {tr('admin.renewBtn')}
                  </button>
                </div>

                {(selectedTenant.evidenceHistory || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    {tr('admin.noContractImg')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedTenant.evidenceHistory || []).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              title: `${ev.title} · ${selectedTenant.name}`,
                              subtitle: `${ev.tierLabel} · ${ev.packageName}`,
                              imageUrl: ev.imageUrl
                            })
                          }
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 group cursor-pointer"
                        >
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-4 h-4" />
                          </span>
                        </button>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="font-semibold text-slate-900 truncate">
                            {ev.tierLabel} · {ev.packageName}
                          </div>
                          <div className="text-slate-600 mt-1 tabular-nums">
                            {formatDateVN(ev.startDate)} → {formatDateVN(ev.endDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = selectedTenant;
                  setSelectedTenant(null);
                  openEditModal(target);
                }}
                className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                {tr('common.edit')}
              </button>
              <button
                type="button"
                onClick={() => handleImpersonate(selectedTenant.id, selectedTenant.name)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{tr('admin.accessBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA DOANH NGHIỆP */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-900 text-base">
                {editingTenant
                  ? `${tr('common.edit')} · ${editingTenant.code}`
                  : tr('admin.addNewBtn')}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Enterprise Name *' : 'Tên doanh nghiệp *'}
                  </label>
                  <input
                    required
                    type="text"
                    value={formValues.name}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, name: e.target.value }));
                      if (formError) setFormError('');
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Enterprise Code *' : 'Mã doanh nghiệp *'}
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
                    className={`${inputClass} uppercase font-semibold`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Representative *' : 'Người đại diện *'}
                  </label>
                  <input
                    required
                    type="text"
                    value={formValues.ownerName}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, ownerName: e.target.value }));
                      if (formError) setFormError('');
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Phone' : 'Số điện thoại'}
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
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Email' : 'Thư điện tử'}
                  </label>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {adminLang === 'en' ? 'Address' : 'Địa chỉ trụ sở'}
                </label>
                <input
                  type="text"
                  value={formValues.address}
                  onChange={(e) => {
                    setFormValues((prev) => ({ ...prev, address: e.target.value }));
                    if (formError) setFormError('');
                  }}
                  className={inputClass}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {getTierDisplayName(formValues.tier)}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(PACKAGE_CONFIGS).map((pkg) => {
                      const isSelected = formValues.plan === pkg.key;
                      const tierPkgPrice = getTierPlanPrice(formValues.tier, pkg.key);
                      return (
                        <button
                          key={pkg.key}
                          type="button"
                          onClick={() => handleSelectPlanInForm(pkg.key)}
                          className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${isSelected
                            ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {getPlanDisplayName(pkg.key)}
                            </span>
                            <span className="text-xs font-bold text-rose-600 tabular-nums">
                              {tierPkgPrice.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{pkg.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {adminLang === 'en' ? 'Tier' : 'Hạng gói dịch vụ'}
                    </label>
                    <select
                      value={formValues.tier}
                      onChange={(e) =>
                        handleSelectTierInForm(e.target.value as ServiceTier)
                      }
                      className={inputClass}
                    >
                      {Object.values(SERVICE_TIERS).map((tierOpt) => (
                        <option key={tierOpt.key} value={tierOpt.key}>
                          {getTierDisplayName(tierOpt.key)} (
                          {getTierPlanPrice(tierOpt.key, formValues.plan).toLocaleString('vi-VN')} ₫)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {adminLang === 'en' ? 'Start Date' : 'Ngày kích hoạt'}
                    </label>
                    <input
                      type="date"
                      value={formValues.activatedAt}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        const months = PACKAGE_CONFIGS[formValues.plan].durationMonths;
                        setFormValues((prev) => ({
                          ...prev,
                          activatedAt: nextStart,
                          expiresAt: addMonthsISO(nextStart, months)
                        }));
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {adminLang === 'en' ? 'Expiry Date' : 'Ngày hết hạn'}
                    </label>
                    <input
                      type="date"
                      min={formValues.activatedAt}
                      value={formValues.expiresAt}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, expiresAt: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {(() => {
                  const pkgPrice = getTierPlanPrice(formValues.tier, formValues.plan);
                  const parsedPaid = Math.max(
                    0,
                    Number(formValues.paidAmount.replace(/[^0-9]/g, '')) || 0
                  );
                  const clampedPaid = Math.min(pkgPrice, parsedPaid);
                  const remaining = Math.max(0, pkgPrice - clampedPaid);
                  const maxDue =
                    formValues.expiresAt &&
                      formValues.expiresAt < addDaysISO(todayStr, MAX_PARTIAL_SETTLE_DAYS)
                      ? formValues.expiresAt
                      : addDaysISO(todayStr, MAX_PARTIAL_SETTLE_DAYS);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {adminLang === 'en' ? 'Paid Amount (VND)' : 'Số tiền đã thu (đồng)'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={pkgPrice}
                          value={formValues.paidAmount}
                          onChange={(e) => {
                            setFormValues((prev) => ({
                              ...prev,
                              paidAmount: e.target.value
                            }));
                            if (formError) setFormError('');
                          }}
                          className={inputClass}
                        />
                        <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                          {remaining > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {tr('admin.statusPartial')}: {remaining.toLocaleString('vi-VN')} ₫
                            </span>
                          ) : clampedPaid === 0 ? (
                            <span className="font-semibold text-rose-600">
                              {adminLang === 'en' ? 'Unpaid' : 'Chưa thu tiền'}
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-700">
                              {adminLang === 'en' ? 'Paid in full' : 'Đã thu đủ'}
                            </span>
                          )}
                        </p>
                      </div>

                      {remaining > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {adminLang === 'en'
                              ? `Full Settlement Due (max ${MAX_PARTIAL_SETTLE_DAYS}d) *`
                              : `Ngày hẹn trả đủ (tối đa ${MAX_PARTIAL_SETTLE_DAYS} ngày) *`}
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            max={maxDue}
                            value={formValues.remainingDueDate}
                            onChange={(e) => {
                              setFormValues((prev) => ({
                                ...prev,
                                remainingDueDate: e.target.value
                              }));
                              if (formError) setFormError('');
                            }}
                            className={inputClass}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {adminLang === 'en'
                      ? 'Contract Proof Image'
                      : 'Hình ảnh minh chứng hợp đồng'}{' '}
                    {editingTenant ? '' : '*'}
                  </label>
                  {formValues.contractImage ? (
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                      <img
                        src={formValues.contractImage}
                        alt="Contract"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormValues((prev) => ({ ...prev, contractImage: '' }))
                        }
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        {tr('common.delete')}
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-white transition-colors cursor-pointer text-center">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {adminLang === 'en'
                          ? 'Upload contract proof image'
                          : 'Tải lên hình ảnh hợp đồng thuê dịch vụ'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFormContractImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {tr('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHÓNG TO ẢNH */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{lightboxImage.title}</h4>
                  <p className="text-xs text-slate-500">{lightboxImage.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[78vh] overflow-auto">
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.title}
                className="max-w-full max-h-[72vh] rounded-lg object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}