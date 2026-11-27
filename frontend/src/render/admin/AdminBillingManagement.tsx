import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  FileText,
  X,
  RefreshCw,
  Trash2,
  Upload,
  Image as ImageIcon,
  Eye,
  Wallet,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  Printer,
  Store,
  CreditCard,
} from 'lucide-react';
import { recordAdminAction } from './adminAudit';
import { vi } from '../../locales/vi';
import { en } from '../../locales/en';

// ==========================================
// 1. SHARED TYPES & CONSTANTS (DÙNG CHUNG CHO CẢ 3 TRANG)
// ==========================================

export type AdminLang = 'vi' | 'en';
export const ADMIN_LANG_STORAGE_KEY = 'sys_admin_lang_v1';
export const ADMIN_LANG_CHANGE_EVENT = 'drivelinker:admin-lang-change';

export const readAdminLang = (): AdminLang => {
  try {
    return localStorage.getItem(ADMIN_LANG_STORAGE_KEY) === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
};

export const toggleAdminLang = (): AdminLang => {
  const next: AdminLang = readAdminLang() === 'vi' ? 'en' : 'vi';
  try {
    localStorage.setItem(ADMIN_LANG_STORAGE_KEY, next);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(ADMIN_LANG_CHANGE_EVENT, { detail: next }));
  return next;
};

export const translateFromViEn = (
  lang: AdminLang,
  key: string,
  params?: Record<string, string | number>
): string => {
  const dict: any = lang === 'en' ? en : vi;
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') {
      cur = undefined;
      break;
    }
    cur = cur[p];
  }
  let text = typeof cur === 'string' ? cur : key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
};

export type PackageDuration = 6 | 12;
export type ServiceTier = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type TenantLifecycleStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'PARTIAL_PAID'
  | 'SUSPENDED';

export type RenewalChannel = 'QR_TRANSFER' | 'COUNTER_CONTRACT';

export interface ServiceTierOption {
  key: ServiceTier;
  label: string;
  description: string;
  prices: Record<PackageDuration, number>;
}

export interface RentalPackageOption {
  id: 'pkg-6m' | 'pkg-12m';
  planKey: 'PKG_6M' | 'PKG_12M';
  duration: PackageDuration;
  name: string;
  price: number;
  description: string;
}

export interface ContractEvidenceItem {
  id: string;
  type: 'INITIAL' | 'RENEWAL' | 'BILLING';
  title: string;
  tierLabel: string;
  packageName: string;
  amount: number;
  startDate: string;
  endDate: string;
  imageUrl: string;
  uploadedAt: string;
  note?: string;
}

export interface BillingInvoice {
  id: string;
  invoiceCode: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tier: ServiceTier;
  tierName: string;
  packageId: 'pkg-6m' | 'pkg-12m';
  packageName: string;
  duration: PackageDuration;
  totalAmount: number;
  paidAmount: number;
  remainingDueDate?: string;
  isAdvanceForNextCycle?: boolean;
  startDate: string;
  endDate: string;
  dueDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'INVOICE';
  proofImage?: string;
  note?: string;
  updatedAt: string;
}

export interface UnifiedTenantRecord {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED';
  lifecycleStatus?: TenantLifecycleStatus;
  isPartialPayment?: boolean;
  paidAmount?: number;
  remainingAmount?: number;
  remainingDueDate?: string;
  advanceNextCycleAmount?: number;
  advanceNextCycleDueDate?: string;
  daysUntilExpiry?: number;
  tier: ServiceTier;
  plan: 'PKG_6M' | 'PKG_12M';
  packagePrice: number;
  monthlyFee: number;
  activatedAt: string;
  expiresAt: string;
  evidenceHistory?: ContractEvidenceItem[];
  notes?: string;
  updatedAt?: string;
}

export interface ExecuteRenewalParams {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  sourceInvoiceCode?: string;
  tier: ServiceTier;
  duration: PackageDuration;
  startDate: string;
  dueDate?: string;
  paymentMethod: 'BANK_TRANSFER' | 'INVOICE';
  paidAmount: number;
  remainingDueDate?: string;
  proofImage: string;
  note?: string;
}

export interface UnifiedPlatformMetrics {
  totalTenants: number;
  activeCount: number;
  suspendedCount: number;
  expiringSoonCount: number;
  partialCount: number;
  newTenantsList: UnifiedTenantRecord[];
  newTenantsCount: number;
  totalVehicles: number;
  totalPackageValue: number;
  monthlyPackageRevenue: number;
  arpu: number;
  activeTenants: UnifiedTenantRecord[];
  currentCycleDebtInvoices: BillingInvoice[];
  overdueInvoices: BillingInvoice[];
  currentPartialInvoices: BillingInvoice[];
  advanceNextCycleInvoices: BillingInvoice[];
  totalOverdueDebt: number;
  totalCurrentPartialRemaining: number;
  totalRemainingAll: number;
  totalAdvancePaidNextCycle: number;
  totalAdvanceRemainingNextCycle: number;
  totalCommittedInvoices: number;
  totalCollected: number;
  count6M: number;
  count12M: number;
  totalDevices: number;
  inUseDevices: number;
  inStockDevices: number;
  issueDevices: number;
  cameraCount: number;
  gpsCount: number;
}

export const SERVICE_TIERS: Record<ServiceTier, ServiceTierOption> = {
  BASIC: {
    key: 'BASIC',
    label: 'Cơ bản',
    description: 'Giám sát GPS, lộ trình & quản lý đội xe tiêu chuẩn',
    prices: {
      6: 9000000,
      12: 16200000,
    },
  },
  PRO: {
    key: 'PRO',
    label: 'Chuyên nghiệp',
    description: 'Đầy đủ giám sát AI Camera, cảnh báo & báo cáo nâng cao',
    prices: {
      6: 15000000,
      12: 27000000,
    },
  },
  ENTERPRISE: {
    key: 'ENTERPRISE',
    label: 'Cao cấp',
    description: 'Vận hành quy mô lớn, API mở rộng & ưu tiên hỗ trợ suốt ngày đêm',
    prices: {
      6: 24000000,
      12: 43200000,
    },
  },
};

export const getPackagePrice = (
  tier: ServiceTier = 'PRO',
  duration: PackageDuration = 6
): number => {
  const tierConfig = SERVICE_TIERS[tier] || SERVICE_TIERS.PRO;
  return tierConfig.prices[duration] ?? SERVICE_TIERS.PRO.prices[6];
};

export const RENTAL_PACKAGES: RentalPackageOption[] = [
  {
    id: 'pkg-6m',
    planKey: 'PKG_6M',
    duration: 6,
    name: 'Gói 6 tháng',
    price: SERVICE_TIERS.PRO.prices[6],
    description: 'Sử dụng trọn gói hệ thống quản lý & giám sát trong 6 tháng',
  },
  {
    id: 'pkg-12m',
    planKey: 'PKG_12M',
    duration: 12,
    name: 'Gói 12 tháng',
    price: SERVICE_TIERS.PRO.prices[12],
    description: 'Sử dụng trọn gói trong 12 tháng (tiết kiệm 10% so với gói 6 tháng)',
  },
];

export const BILLING_STORAGE_KEY = 'sys_platform_billing';
export const TENANTS_STORAGE_KEY = 'sys_tenants';
export const PLATFORM_SYNC_EVENT = 'drivelinker:platform-sync';
export const EXPIRING_SOON_DAYS = 7;
export const MAX_PARTIAL_SETTLE_DAYS = 30;

// ==========================================
// 2. SHARED HELPERS & REAL-TIME SYNC ENGINE
// ==========================================

export const compressImageToDataURL = (
  file: File,
  maxWidth = 1100,
  quality = 0.75
): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof reader.result === 'string' ? reader.result : '');
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });

const calculateEndDate = (startDateStr: string, months: PackageDuration): string => {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (Number.isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr || new Date().toISOString().split('T')[0]);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const getDaysRemainingISO = (targetDateStr?: string): number => {
  if (!targetDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return 999;
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const validatePartialDueDate = (
  dueDateStr: string,
  maxEndDateStr?: string,
  baseDateStr?: string
): string | null => {
  const todayStr = baseDateStr || new Date().toISOString().split('T')[0];
  if (!dueDateStr) {
    return 'Vui lòng chọn ngày hẹn trả đủ phần còn lại.';
  }
  if (dueDateStr < todayStr) {
    return 'Ngày hẹn trả đủ không được nằm trong quá khứ.';
  }
  const maxAllowedByPolicy = addDays(todayStr, MAX_PARTIAL_SETTLE_DAYS);
  const ceilingDate =
    maxEndDateStr && maxEndDateStr < maxAllowedByPolicy
      ? maxEndDateStr
      : maxAllowedByPolicy;

  if (dueDateStr > ceilingDate) {
    return `Thời hạn trả đủ tối đa ${MAX_PARTIAL_SETTLE_DAYS} ngày (không vượt quá ${formatDateVN(ceilingDate)}).`;
  }
  return null;
};

const formatVND = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    Math.max(0, amount || 0)
  );

const formatDateVN = (isoDate?: string): string => {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const normalizeTier = (rawTier: any): ServiceTier => {
  if (rawTier === 'BASIC' || rawTier === 'PRO' || rawTier === 'ENTERPRISE') {
    return rawTier;
  }
  return 'PRO';
};

export type InvoicePaymentState =
  | 'PAID'
  | 'PARTIAL'
  | 'EXPIRING_SOON'
  | 'PENDING'
  | 'OVERDUE';

export const getInvoicePaymentState = (
  inv: BillingInvoice,
  todayStr?: string
): InvoicePaymentState => {
  const refToday = todayStr || new Date().toISOString().split('T')[0];
  const total = inv.totalAmount || 0;
  const paid = Math.max(0, inv.paidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const daysToEnd = getDaysRemainingISO(inv.endDate);
  const effectiveDue = inv.remainingDueDate || inv.dueDate;
  const isDueOverdue = Boolean(effectiveDue && effectiveDue < refToday && remaining > 0);
  const isContractExpired = daysToEnd < 0;

  if (isContractExpired || isDueOverdue) {
    return 'OVERDUE';
  }

  if (paid > 0 && remaining > 0) {
    return 'PARTIAL';
  }

  const daysToDue = effectiveDue ? getDaysRemainingISO(effectiveDue) : 999;
  if (
    daysToEnd <= EXPIRING_SOON_DAYS ||
    (remaining > 0 && daysToDue <= EXPIRING_SOON_DAYS)
  ) {
    return 'EXPIRING_SOON';
  }

  if (remaining === 0 && total > 0) {
    return 'PAID';
  }

  return 'PENDING';
};

export const getOverdueAmountForInvoice = (inv: BillingInvoice): number => {
  const pkgPrice =
    typeof inv.totalAmount === 'number' && inv.totalAmount > 0
      ? inv.totalAmount
      : getPackagePrice(inv.tier || 'PRO', inv.duration || 6);
  const paid = Math.max(0, Number(inv.paidAmount) || 0);
  const remaining = Math.max(0, pkgPrice - paid);
  return remaining > 0 ? remaining : pkgPrice;
};

export const getReceivableAmountForInvoice = (
  inv: BillingInvoice,
  todayStr?: string
): number => {
  const state = getInvoicePaymentState(inv, todayStr);
  const pkgPrice =
    typeof inv.totalAmount === 'number' && inv.totalAmount > 0
      ? inv.totalAmount
      : getPackagePrice(inv.tier || 'PRO', inv.duration || 6);
  const paid = Math.max(0, Number(inv.paidAmount) || 0);
  const remaining = Math.max(0, pkgPrice - paid);

  if (state === 'OVERDUE') {
    return getOverdueAmountForInvoice(inv);
  }
  return remaining;
};

const evaluateTenantLifecycle = (params: {
  rawStatus?: 'ACTIVE' | 'SUSPENDED';
  expiresAt: string;
  totalAmount: number;
  paidAmount: number;
  remainingDueDate?: string;
  isAdvanceForNextCycle?: boolean;
}): {
  status: 'ACTIVE' | 'SUSPENDED';
  lifecycleStatus: TenantLifecycleStatus;
  isPartialPayment: boolean;
  remainingAmount: number;
  daysUntilExpiry: number;
} => {
  const todayStr = new Date().toISOString().split('T')[0];
  const daysUntilExpiry = getDaysRemainingISO(params.expiresAt);
  const remainingAmount = Math.max(0, (params.totalAmount || 0) - (params.paidAmount || 0));
  const isPartialPayment =
    !params.isAdvanceForNextCycle &&
    (params.paidAmount || 0) > 0 &&
    remainingAmount > 0;
  const isExpired = daysUntilExpiry < 0;
  const isPartialOverdue =
    isPartialPayment &&
    Boolean(params.remainingDueDate && params.remainingDueDate < todayStr);
  const isUnpaidAtDue =
    !params.isAdvanceForNextCycle &&
    remainingAmount > 0 &&
    !isPartialPayment &&
    daysUntilExpiry <= 0;

  if (isExpired || isPartialOverdue || isUnpaidAtDue) {
    return {
      status: 'SUSPENDED',
      lifecycleStatus: 'SUSPENDED',
      isPartialPayment,
      remainingAmount,
      daysUntilExpiry,
    };
  }

  if (isPartialPayment) {
    return {
      status: 'ACTIVE',
      lifecycleStatus: 'PARTIAL_PAID',
      isPartialPayment: true,
      remainingAmount,
      daysUntilExpiry,
    };
  }

  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
    return {
      status: 'ACTIVE',
      lifecycleStatus: 'EXPIRING_SOON',
      isPartialPayment: false,
      remainingAmount,
      daysUntilExpiry,
    };
  }

  return {
    status: 'ACTIVE',
    lifecycleStatus: 'ACTIVE',
    isPartialPayment: false,
    remainingAmount,
    daysUntilExpiry,
  };
};

const pickLatestInvoice = (
  currentBest: BillingInvoice | undefined,
  candidate: BillingInvoice
): BillingInvoice => {
  if (!currentBest) return candidate;
  const bestKey = `${currentBest.endDate || ''}__${currentBest.updatedAt || ''}`;
  const candKey = `${candidate.endDate || ''}__${candidate.updatedAt || ''}`;
  return candKey >= bestKey ? candidate : currentBest;
};

const buildDefaultUnifiedData = (): {
  tenants: UnifiedTenantRecord[];
  invoices: BillingInvoice[];
} => {
  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();
  const pkg6 = RENTAL_PACKAGES[0];
  const proPrice6 = getPackagePrice('PRO', 6);
  const basicPrice6 = getPackagePrice('BASIC', 6);

  const companyAStart = addDays(today, -175);
  const companyAEnd = addDays(today, 5);

  const companyBEnd = addDays(today, -5);
  const companyBStart = addDays(companyBEnd, -180);

  const companyCStart = addDays(today, -30);
  const companyCEnd = calculateEndDate(companyCStart, 6);
  const companyCRemainingDue = addDays(today, 14);

  const rawTenants: UnifiedTenantRecord[] = [
    {
      id: 'COMPANY_A',
      name: 'Demo CTY A',
      code: 'CTYA26',
      ownerName: 'Trần Văn A',
      phone: '0901234567',
      email: 'vanhanh@ctya-rental.vn',
      address: '123 Nguyễn Văn Linh, Đà Nẵng',
      status: 'ACTIVE',
      tier: 'PRO',
      plan: 'PKG_6M',
      packagePrice: proPrice6,
      monthlyFee: Math.round(proPrice6 / 6),
      activatedAt: companyAStart,
      expiresAt: companyAEnd,
      evidenceHistory: [],
      notes: 'Gói 6 tháng sắp đến hạn (còn 5 ngày)',
      updatedAt: nowIso,
    },
    {
      id: 'COMPANY_B',
      name: 'Demo CTY B',
      code: 'CTYB26',
      ownerName: 'Lê Thị B',
      phone: '0912345678',
      email: 'contact@ctyb-fleet.vn',
      address: '456 Lê Duẩn, Hà Nội',
      status: 'SUSPENDED',
      tier: 'BASIC',
      plan: 'PKG_6M',
      packagePrice: basicPrice6,
      monthlyFee: Math.round(basicPrice6 / 6),
      activatedAt: companyBStart,
      expiresAt: companyBEnd,
      evidenceHistory: [],
      notes: 'Quá hạn gói 6 tháng -> tự động tạm ngưng',
      updatedAt: nowIso,
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
      tier: 'PRO',
      plan: 'PKG_6M',
      packagePrice: proPrice6,
      monthlyFee: Math.round(proPrice6 / 6),
      activatedAt: companyCStart,
      expiresAt: companyCEnd,
      evidenceHistory: [],
      notes: 'Đã trả trước 8.000.000 ₫ cho gói hiện tại, hẹn trả đủ trong 14 ngày',
      updatedAt: nowIso,
    },
  ];

  const rawInvoices: BillingInvoice[] = [
    {
      id: 'inv-001',
      invoiceCode: 'INV-2026-001',
      tenantId: 'COMPANY_A',
      tenantName: 'Demo CTY A',
      tenantCode: 'CTYA26',
      tier: 'PRO',
      tierName: SERVICE_TIERS.PRO.label,
      packageId: pkg6.id,
      packageName: pkg6.name,
      duration: 6,
      totalAmount: proPrice6,
      paidAmount: proPrice6,
      startDate: companyAStart,
      endDate: companyAEnd,
      dueDate: addDays(companyAStart, 7),
      paymentMethod: 'BANK_TRANSFER',
      note: 'Gói 6 tháng sắp đến hạn gia hạn',
      updatedAt: nowIso,
    },
    {
      id: 'inv-002',
      invoiceCode: 'INV-2026-002',
      tenantId: 'COMPANY_B',
      tenantName: 'Demo CTY B',
      tenantCode: 'CTYB26',
      tier: 'BASIC',
      tierName: SERVICE_TIERS.BASIC.label,
      packageId: pkg6.id,
      packageName: pkg6.name,
      duration: 6,
      totalAmount: basicPrice6,
      paidAmount: 0,
      startDate: companyBStart,
      endDate: companyBEnd,
      dueDate: companyBEnd,
      paymentMethod: 'BANK_TRANSFER',
      note: 'Đến hạn nhưng chưa thanh toán -> Tạm ngưng',
      updatedAt: nowIso,
    },
    {
      id: 'inv-003',
      invoiceCode: 'INV-2026-003',
      tenantId: 'COMPANY_C',
      tenantName: 'Demo CTY C',
      tenantCode: 'CTYC26',
      tier: 'PRO',
      tierName: SERVICE_TIERS.PRO.label,
      packageId: pkg6.id,
      packageName: pkg6.name,
      duration: 6,
      totalAmount: proPrice6,
      paidAmount: 8000000,
      remainingDueDate: companyCRemainingDue,
      isAdvanceForNextCycle: false,
      startDate: companyCStart,
      endDate: companyCEnd,
      dueDate: addDays(companyCStart, 7),
      paymentMethod: 'BANK_TRANSFER',
      note: 'Đã trả trước 8.000.000 ₫, hẹn trả đủ trong 14 ngày',
      updatedAt: nowIso,
    },
  ];

  return { tenants: rawTenants, invoices: rawInvoices };
};

export const syncUnifiedPlatformData = (): {
  tenants: UnifiedTenantRecord[];
  invoices: BillingInvoice[];
} => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const fallbackIso = '2026-01-01T00:00:00.000Z';
    const rawTenants = JSON.parse(localStorage.getItem(TENANTS_STORAGE_KEY) || '[]');
    const rawInvoices = JSON.parse(localStorage.getItem(BILLING_STORAGE_KEY) || '[]');

    const hasTenants = Array.isArray(rawTenants) && rawTenants.length > 0;
    const hasInvoices = Array.isArray(rawInvoices) && rawInvoices.length > 0;

    if (!hasTenants && !hasInvoices) {
      const seeded = buildDefaultUnifiedData();
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(seeded.tenants));
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(seeded.invoices));
      return syncUnifiedPlatformData();
    }

    const normalizedInvoices: BillingInvoice[] = [];
    const latestCurrentInvoiceByCode = new Map<string, BillingInvoice>();
    const latestCurrentInvoiceById = new Map<string, BillingInvoice>();
    const latestAnyInvoiceByCode = new Map<string, BillingInvoice>();
    const latestAnyInvoiceById = new Map<string, BillingInvoice>();

    if (hasInvoices) {
      rawInvoices.forEach((item: any, idx: number) => {
        const duration: PackageDuration =
          item.duration === 12 || item.durationMonths === 12 || item.planKey === 'PKG_12M'
            ? 12
            : 6;
        const pkg = duration === 12 ? RENTAL_PACKAGES[1] : RENTAL_PACKAGES[0];
        const tier = normalizeTier(item.tier);
        const totalAmount =
          typeof item.totalAmount === 'number' && item.totalAmount > 0
            ? item.totalAmount
            : getPackagePrice(tier, duration);
        const rawPaid = Math.max(0, Number(item.paidAmount) || 0);
        const paidAmount = Math.min(totalAmount, rawPaid);
        const start = item.startDate || addDays(today, -30);
        const end = item.endDate || calculateEndDate(start, duration);
        const code = String(item.tenantCode || `DN${idx + 1}`).toUpperCase();
        const tid = String(item.tenantId || code);
        const isAdvanceForNextCycle = Boolean(item.isAdvanceForNextCycle);

        const normalizedInv: BillingInvoice = {
          id: item.id || `inv-${idx + 1}`,
          invoiceCode: item.invoiceCode || `INV-2026-${String(idx + 1).padStart(3, '0')}`,
          tenantId: tid,
          tenantName: item.tenantName || `Doanh nghiệp ${code}`,
          tenantCode: code,
          tier,
          tierName: item.tierName || SERVICE_TIERS[tier].label,
          packageId: pkg.id,
          packageName: item.packageName || pkg.name,
          duration,
          totalAmount,
          paidAmount,
          remainingDueDate:
            paidAmount > 0 && paidAmount < totalAmount
              ? item.remainingDueDate || addDays(today, 14)
              : undefined,
          isAdvanceForNextCycle,
          startDate: start,
          endDate: end,
          dueDate: item.dueDate || addDays(start, 7),
          paymentMethod: item.paymentMethod === 'INVOICE' ? 'INVOICE' : 'BANK_TRANSFER',
          proofImage: item.proofImage || undefined,
          note: item.note,
          updatedAt: item.updatedAt || fallbackIso,
        };

        normalizedInvoices.push(normalizedInv);
        latestAnyInvoiceByCode.set(
          code,
          pickLatestInvoice(latestAnyInvoiceByCode.get(code), normalizedInv)
        );
        latestAnyInvoiceById.set(
          tid,
          pickLatestInvoice(latestAnyInvoiceById.get(tid), normalizedInv)
        );

        if (!isAdvanceForNextCycle) {
          latestCurrentInvoiceByCode.set(
            code,
            pickLatestInvoice(latestCurrentInvoiceByCode.get(code), normalizedInv)
          );
          latestCurrentInvoiceById.set(
            tid,
            pickLatestInvoice(latestCurrentInvoiceById.get(tid), normalizedInv)
          );
        }
      });
    }

    const unifiedTenants: UnifiedTenantRecord[] = [];
    const matchedTenantKeys = new Set<string>();
    const canonicalEndDateByTenant = new Map<string, string>();

    const sourceTenants = hasTenants ? rawTenants : [];
    sourceTenants.forEach((t: any, idx: number) => {
      const code = String(t.code || `CTY${260 + idx}`).toUpperCase();
      const id = String(t.id || `COMPANY_${idx + 1}`);
      matchedTenantKeys.add(id);
      matchedTenantKeys.add(code);

      const currentCycleInv =
        latestCurrentInvoiceById.get(id) ||
        latestCurrentInvoiceByCode.get(code) ||
        latestAnyInvoiceById.get(id) ||
        latestAnyInvoiceByCode.get(code);

      const canonicalEndDate =
        t.expiresAt ||
        currentCycleInv?.endDate ||
        calculateEndDate(t.activatedAt || addDays(today, -30), 6);

      canonicalEndDateByTenant.set(id, canonicalEndDate);
      canonicalEndDateByTenant.set(code, canonicalEndDate);

      const planKey: 'PKG_6M' | 'PKG_12M' =
        t.plan === 'PKG_12M' || t.plan === 'ENTERPRISE'
          ? 'PKG_12M'
          : currentCycleInv?.duration === 12
            ? 'PKG_12M'
            : 'PKG_6M';

      const tier = normalizeTier(t.tier || currentCycleInv?.tier);
      const duration: PackageDuration = planKey === 'PKG_12M' ? 12 : 6;
      const totalAmount =
        typeof t.packagePrice === 'number' && t.packagePrice > 0
          ? t.packagePrice
          : currentCycleInv?.totalAmount && currentCycleInv.totalAmount > 0
            ? currentCycleInv.totalAmount
            : getPackagePrice(tier, duration);

      const activatedAt =
        t.activatedAt || currentCycleInv?.startDate || addDays(today, -30);

      const advanceInv = normalizedInvoices.find(
        (inv) =>
          (inv.tenantId === id || inv.tenantCode.toUpperCase() === code) &&
          Boolean(inv.isAdvanceForNextCycle)
      );
      const advanceNextCycleAmount =
        typeof t.advanceNextCycleAmount === 'number' && t.advanceNextCycleAmount > 0
          ? t.advanceNextCycleAmount
          : advanceInv
            ? advanceInv.paidAmount
            : 0;
      const advanceNextCycleDueDate =
        t.advanceNextCycleDueDate || advanceInv?.remainingDueDate || undefined;

      const rawPaidAmount = currentCycleInv
        ? currentCycleInv.paidAmount
        : typeof t.paidAmount === 'number'
          ? t.paidAmount
          : t.status === 'SUSPENDED'
            ? 0
            : totalAmount;
      const paidAmount = Math.min(totalAmount, Math.max(0, rawPaidAmount));
      const remainingDueDate =
        paidAmount > 0 && paidAmount < totalAmount
          ? currentCycleInv?.remainingDueDate || t.remainingDueDate || addDays(today, 14)
          : undefined;

      const rawStatus: 'ACTIVE' | 'SUSPENDED' =
        t.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';

      const lifecycle = evaluateTenantLifecycle({
        rawStatus,
        expiresAt: canonicalEndDate,
        totalAmount,
        paidAmount,
        remainingDueDate,
        isAdvanceForNextCycle: false,
      });

      const existingHistory: ContractEvidenceItem[] = Array.isArray(t.evidenceHistory)
        ? t.evidenceHistory
        : [];
      const tenantDisplayName =
        t.name || currentCycleInv?.tenantName || `Doanh nghiệp #${idx + 1}`;

      unifiedTenants.push({
        id,
        name: tenantDisplayName,
        code,
        ownerName: t.ownerName || 'Chưa cập nhật',
        phone: t.phone || '',
        email: t.email || '',
        address: t.address || 'Chưa cập nhật',
        status: lifecycle.status,
        lifecycleStatus: lifecycle.lifecycleStatus,
        isPartialPayment: lifecycle.isPartialPayment,
        paidAmount,
        remainingAmount: lifecycle.remainingAmount,
        remainingDueDate,
        advanceNextCycleAmount,
        advanceNextCycleDueDate,
        daysUntilExpiry: lifecycle.daysUntilExpiry,
        tier,
        plan: planKey,
        packagePrice: totalAmount,
        monthlyFee: Math.round(totalAmount / duration),
        activatedAt,
        expiresAt: canonicalEndDate,
        evidenceHistory: existingHistory,
        notes: t.notes || '',
        updatedAt: t.updatedAt || currentCycleInv?.updatedAt || fallbackIso,
      });
    });

    const reconciledInvoices: BillingInvoice[] = normalizedInvoices.map((inv) => {
      if (inv.isAdvanceForNextCycle) return inv;
      const matchedEnd =
        canonicalEndDateByTenant.get(inv.tenantId) ||
        canonicalEndDateByTenant.get(inv.tenantCode.toUpperCase());
      if (!matchedEnd || matchedEnd === inv.endDate) return inv;
      return {
        ...inv,
        endDate: matchedEnd,
      };
    });

    const finalInvoices =
      reconciledInvoices.length > 0
        ? reconciledInvoices
        : unifiedTenants.map((t, idx) => ({
          id: `inv-sync-${t.id}`,
          invoiceCode: `INV-2026-${String(idx + 1).padStart(3, '0')}`,
          tenantId: t.id,
          tenantName: t.name,
          tenantCode: t.code,
          tier: t.tier,
          tierName: SERVICE_TIERS[t.tier].label,
          packageId: t.plan === 'PKG_12M' ? ('pkg-12m' as const) : ('pkg-6m' as const),
          packageName:
            t.plan === 'PKG_12M' ? RENTAL_PACKAGES[1].name : RENTAL_PACKAGES[0].name,
          duration: (t.plan === 'PKG_12M' ? 12 : 6) as PackageDuration,
          totalAmount: t.packagePrice,
          paidAmount: t.paidAmount ?? t.packagePrice,
          remainingDueDate: t.remainingDueDate,
          isAdvanceForNextCycle: Boolean(t.advanceNextCycleAmount),
          startDate: t.activatedAt,
          endDate: t.expiresAt,
          dueDate: addDays(t.activatedAt, 7),
          paymentMethod: 'BANK_TRANSFER' as const,
          proofImage:
            t.evidenceHistory && t.evidenceHistory.length > 0
              ? t.evidenceHistory[0].imageUrl
              : undefined,
          note: 'Đồng bộ từ danh sách doanh nghiệp',
          updatedAt: t.updatedAt || fallbackIso,
        }));

    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(unifiedTenants));
    localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(finalInvoices));

    return { tenants: unifiedTenants, invoices: finalInvoices };
  } catch {
    return buildDefaultUnifiedData();
  }
};

export const computeUnifiedPlatformMetrics = (
  tenants: UnifiedTenantRecord[],
  invoices: BillingInvoice[],
  vehicleCountMap: Record<string, number> = {},
  devices: { id: string; type: string; status: string; tenantId?: string }[] = []
): UnifiedPlatformMetrics => {
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE');
  const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED');
  const expiringSoonTenants = activeTenants.filter((t) => {
    const d = getDaysRemainingISO(t.expiresAt);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  });
  const partialTenants = tenants.filter((t) => {
    if (t.status === 'SUSPENDED') return false;
    if (t.lifecycleStatus) return t.lifecycleStatus === 'PARTIAL_PAID';
    return (
      !t.advanceNextCycleAmount &&
      (t.paidAmount ?? 0) > 0 &&
      (t.remainingAmount ?? 0) > 0
    );
  });

  const newTenantsList = tenants.filter(
    (t) => t.activatedAt && t.activatedAt >= thirtyDaysAgoStr
  );

  const totalVehicles = tenants.reduce(
    (sum, t) => sum + (vehicleCountMap[t.id] || 0),
    0
  );

  const totalPackageValue = activeTenants.reduce(
    (sum, t) => sum + (t.packagePrice || 0),
    0
  );

  // Quy đổi doanh thu từng gói đang hoạt động theo số tháng kỳ hạn (6 hoặc 12 tháng)
  const monthlyPackageRevenue = activeTenants.reduce((sum, t) => {
    const months: PackageDuration = t.plan === 'PKG_12M' ? 12 : 6;
    const pkgVal =
      typeof t.packagePrice === 'number' && t.packagePrice > 0
        ? t.packagePrice
        : getPackagePrice(t.tier || 'PRO', months);
    return sum + Math.round(pkgVal / months);
  }, 0);

  const arpu =
    activeTenants.length > 0 ? Math.round(totalPackageValue / activeTenants.length) : 0;

  const activeTenantIds = new Set(activeTenants.map((t) => t.id));
  const activeTenantCodes = new Set(
    activeTenants.map((t) => t.code.toUpperCase())
  );

  const currentCycleInvoices = invoices.filter((inv) => !inv.isAdvanceForNextCycle);
  const advanceNextCycleInvoices = invoices.filter((inv) =>
    Boolean(inv.isAdvanceForNextCycle)
  );

  const overdueInvoices = currentCycleInvoices.filter(
    (inv) => getInvoicePaymentState(inv, todayStr) === 'OVERDUE'
  );

  const currentPartialInvoices = currentCycleInvoices.filter(
    (inv) => getInvoicePaymentState(inv, todayStr) === 'PARTIAL'
  );

  const currentCycleDebtInvoices = currentCycleInvoices.filter((inv) => {
    const st = getInvoicePaymentState(inv, todayStr);
    return st === 'OVERDUE' || st === 'PARTIAL';
  });

  const totalOverdueDebt = overdueInvoices.reduce(
    (sum, inv) => sum + getOverdueAmountForInvoice(inv),
    0
  );

  const totalCurrentPartialRemaining = currentPartialInvoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0
  );

  const totalRemainingAll = currentCycleInvoices.reduce(
    (sum, inv) => sum + getReceivableAmountForInvoice(inv, todayStr),
    0
  );

  const totalAdvancePaidNextCycle = advanceNextCycleInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.paidAmount || 0),
    0
  );

  const totalAdvanceRemainingNextCycle = advanceNextCycleInvoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0
  );

  const activeInvoices = invoices.filter(
    (inv) =>
      activeTenantIds.has(inv.tenantId) ||
      activeTenantCodes.has(inv.tenantCode.toUpperCase())
  );

  const totalCommittedInvoices = activeInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount || 0),
    0
  );

  const totalCollected = activeInvoices.reduce(
    (sum, inv) => sum + (inv.paidAmount || 0),
    0
  );

  const count6M = invoices.filter((item) => item.duration === 6).length;
  const count12M = invoices.filter((item) => item.duration === 12).length;

  const totalDevices = devices.length;
  const inUseDevices = devices.filter((d) => d.status === 'Đang sử dụng').length;
  const inStockDevices = devices.filter((d) => d.status === 'Tồn kho').length;
  const issueDevices = devices.filter((d) =>
    ['Lỗi', 'Bảo hành', 'Lỗi/Bảo hành'].includes(d.status)
  ).length;
  const cameraCount = devices.filter((d) => d.type === 'Camera').length;
  const gpsCount = devices.filter((d) => d.type !== 'Camera').length;

  return {
    totalTenants,
    activeCount: activeTenants.length,
    suspendedCount: suspendedTenants.length,
    expiringSoonCount: expiringSoonTenants.length,
    partialCount: partialTenants.length,
    newTenantsList,
    newTenantsCount: newTenantsList.length,
    totalVehicles,
    totalPackageValue,
    monthlyPackageRevenue,
    arpu,
    activeTenants,
    currentCycleDebtInvoices,
    overdueInvoices,
    currentPartialInvoices,
    advanceNextCycleInvoices,
    totalOverdueDebt,
    totalCurrentPartialRemaining,
    totalRemainingAll,
    totalAdvancePaidNextCycle,
    totalAdvanceRemainingNextCycle,
    totalCommittedInvoices,
    totalCollected,
    count6M,
    count12M,
    totalDevices,
    inUseDevices,
    inStockDevices,
    issueDevices,
    cameraCount,
    gpsCount
  };
};

export const commitUnifiedPlatformData = (
  nextTenants: UnifiedTenantRecord[],
  nextInvoices: BillingInvoice[]
): {
  tenants: UnifiedTenantRecord[];
  invoices: BillingInvoice[];
} => {
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(nextTenants));
  localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(nextInvoices));
  const synced = syncUnifiedPlatformData();
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(synced.tenants));
  localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(synced.invoices));
  window.dispatchEvent(new CustomEvent(PLATFORM_SYNC_EVENT));
  window.dispatchEvent(new Event('storage'));
  return synced;
};

export const settleTenantRemainingBalance = (tenantId: string): boolean => {
  try {
    const synced = syncUnifiedPlatformData();
    const targetTenant = synced.tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return false;

    const nowIso = new Date().toISOString();
    const nextTenants = synced.tenants.map((t) => {
      if (t.id !== targetTenant.id) return t;
      const lifecycle = evaluateTenantLifecycle({
        rawStatus: 'ACTIVE',
        expiresAt: t.expiresAt,
        totalAmount: t.packagePrice,
        paidAmount: t.packagePrice,
        remainingDueDate: undefined,
        isAdvanceForNextCycle: false,
      });
      return {
        ...t,
        status: lifecycle.status,
        lifecycleStatus: lifecycle.lifecycleStatus,
        isPartialPayment: false,
        paidAmount: t.packagePrice,
        remainingAmount: 0,
        remainingDueDate: undefined,
        advanceNextCycleAmount: 0,
        advanceNextCycleDueDate: undefined,
        daysUntilExpiry: lifecycle.daysUntilExpiry,
        updatedAt: nowIso,
      };
    });

    const tenantInvoices = synced.invoices.filter(
      (inv) =>
        inv.tenantId === targetTenant.id ||
        inv.tenantCode.toUpperCase() === targetTenant.code.toUpperCase()
    );
    const latestInv = tenantInvoices.reduce<BillingInvoice | undefined>(
      (acc, cur) => pickLatestInvoice(acc, cur),
      undefined
    );

    const nextInvoices = synced.invoices.map((inv) => {
      if (!latestInv || inv.id !== latestInv.id) return inv;
      return {
        ...inv,
        paidAmount: inv.totalAmount,
        remainingDueDate: undefined,
        isAdvanceForNextCycle: false,
        updatedAt: nowIso,
      };
    });

    commitUnifiedPlatformData(nextTenants, nextInvoices);
    return true;
  } catch {
    return false;
  }
};

export const applyRenewalCycleShared = (params: ExecuteRenewalParams): {
  tenants: UnifiedTenantRecord[];
  invoices: BillingInvoice[];
  newInvoice: BillingInvoice;
} => {
  const synced = syncUnifiedPlatformData();
  const nowIso = new Date().toISOString();

  const totalAmount = getPackagePrice(params.tier, params.duration);
  const paidAmount = Math.min(totalAmount, Math.max(0, params.paidAmount));
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const isAdvanceForNextCycle = paidAmount > 0 && remainingAmount > 0;
  const remainingDueDate = isAdvanceForNextCycle ? params.remainingDueDate : undefined;
  const computedEndDate = calculateEndDate(params.startDate, params.duration);
  const tierOpt = SERVICE_TIERS[params.tier];
  const pkg = params.duration === 12 ? RENTAL_PACKAGES[1] : RENTAL_PACKAGES[0];
  const cleanCode = params.tenantCode.trim().toUpperCase();

  const newInvoice: BillingInvoice = {
    id: `inv-${Date.now()}`,
    invoiceCode: `INV-2026-${String(synced.invoices.length + 1).padStart(3, '0')}`,
    tenantId: params.tenantId,
    tenantName: params.tenantName.trim(),
    tenantCode: cleanCode,
    tier: params.tier,
    tierName: tierOpt.label,
    packageId: pkg.id,
    packageName: pkg.name,
    duration: params.duration,
    totalAmount,
    paidAmount,
    remainingDueDate,
    isAdvanceForNextCycle,
    startDate: params.startDate,
    endDate: computedEndDate,
    dueDate: params.dueDate || addDays(params.startDate, 7),
    paymentMethod: params.paymentMethod,
    proofImage: params.proofImage,
    note:
      params.note?.trim() ||
      `Gia hạn kỳ mới ${pkg.name} (${formatDateVN(params.startDate)} → ${formatDateVN(computedEndDate)})`,
    updatedAt: nowIso,
  };

  const nextInvoices = [newInvoice, ...synced.invoices];

  const renewalEvidence: ContractEvidenceItem = {
    id: `ev-${Date.now()}`,
    type: 'RENEWAL',
    title: `Minh chứng gia hạn (${newInvoice.invoiceCode})`,
    tierLabel: tierOpt.label,
    packageName: pkg.name,
    amount: totalAmount,
    startDate: params.startDate,
    endDate: computedEndDate,
    imageUrl: params.proofImage,
    uploadedAt: nowIso,
    note: params.note?.trim() || undefined,
  };

  const nextTenants = synced.tenants.map((t) => {
    const isMatch =
      t.id === params.tenantId || t.code.toUpperCase() === cleanCode;
    if (!isMatch) return t;

    const nextExpiresAt = computedEndDate;
    const nextLifecycle = evaluateTenantLifecycle({
      rawStatus: 'ACTIVE',
      expiresAt: nextExpiresAt,
      totalAmount,
      paidAmount,
      remainingDueDate,
      isAdvanceForNextCycle,
    });

    return {
      ...t,
      tier: params.tier,
      plan: pkg.planKey,
      packagePrice: totalAmount,
      monthlyFee: Math.round(totalAmount / params.duration),
      activatedAt: params.startDate,
      expiresAt: nextExpiresAt,
      status: nextLifecycle.status,
      lifecycleStatus: nextLifecycle.lifecycleStatus,
      isPartialPayment: nextLifecycle.isPartialPayment,
      paidAmount: isAdvanceForNextCycle ? t.paidAmount : paidAmount,
      remainingAmount: isAdvanceForNextCycle ? 0 : remainingAmount,
      remainingDueDate: isAdvanceForNextCycle ? undefined : remainingDueDate,
      advanceNextCycleAmount: isAdvanceForNextCycle ? paidAmount : 0,
      advanceNextCycleDueDate: isAdvanceForNextCycle ? remainingDueDate : undefined,
      daysUntilExpiry: nextLifecycle.daysUntilExpiry,
      evidenceHistory: [renewalEvidence, ...(t.evidenceHistory || [])],
      updatedAt: nowIso,
    };
  });

  const committed = commitUnifiedPlatformData(nextTenants, nextInvoices);
  return {
    tenants: committed.tenants,
    invoices: committed.invoices,
    newInvoice,
  };
};

// ==========================================
// 3. SHARED RENEWAL MODAL
// ==========================================

export interface SharedRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  currentExpiresAt?: string;
  initialTier?: ServiceTier;
  initialDuration?: PackageDuration;
  sourceInvoiceCode?: string;
  onCompleted: (result: {
    tenants: UnifiedTenantRecord[];
    invoices: BillingInvoice[];
    newInvoice: BillingInvoice;
  }) => void;
}

export const SharedRenewalModal: React.FC<SharedRenewalModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  tenantCode,
  currentExpiresAt,
  initialTier = 'PRO',
  initialDuration = 6,
  sourceInvoiceCode,
  onCompleted,
}) => {
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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultStart = useMemo(
    () =>
      currentExpiresAt && currentExpiresAt > todayStr
        ? currentExpiresAt
        : todayStr,
    [currentExpiresAt, todayStr]
  );

  const [step, setStep] = useState<'SELECT' | 'PORTAL'>('SELECT');
  const [channel, setChannel] = useState<RenewalChannel>('QR_TRANSFER');

  const [selectedTier, setSelectedTier] = useState<ServiceTier>(initialTier);
  const [selectedDuration, setSelectedDuration] =
    useState<PackageDuration>(initialDuration);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>(
    'FULL'
  );
  const [partialPaidInput, setPartialPaidInput] = useState<string>('3000000');
  const [remainingDueDateInput, setRemainingDueDateInput] = useState<string>(() =>
    addDays(todayStr, 14)
  );

  const [portalRefCode, setPortalRefCode] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [counterStaffName, setCounterStaffName] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'CODE' | 'CONTENT' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const start =
      currentExpiresAt && currentExpiresAt > todayStr
        ? currentExpiresAt
        : todayStr;
    const end = calculateEndDate(start, initialDuration);
    const max14 = addDays(todayStr, 14);
    const stamp = Date.now().toString().slice(-6);
    const cleanCode = (tenantCode || 'DN').toUpperCase();
    const adminSession =
      sessionStorage.getItem('sys_core_admin_name') || 'Nguyễn Nhật Long';

    setStep('SELECT');
    setChannel('QR_TRANSFER');
    setSelectedTier(initialTier);
    setSelectedDuration(initialDuration);
    setStartDate(start);
    setPaymentMode('FULL');
    setPartialPaidInput('3000000');
    setRemainingDueDateInput(end && end < max14 ? end : max14);
    setPortalRefCode(`DLQR${stamp}`);
    setContractNumber(`HDGH-${cleanCode}-${stamp}`);
    setCounterStaffName(adminSession);
    setProofImage('');
    setNote(sourceInvoiceCode ? `Gia hạn kỳ mới (${sourceInvoiceCode})` : '');
    setFormError('');
    setCopiedField(null);
  }, [
    isOpen,
    currentExpiresAt,
    initialTier,
    initialDuration,
    sourceInvoiceCode,
    tenantCode,
    todayStr,
  ]);

  const activePackage = useMemo(() => {
    const basePkg =
      RENTAL_PACKAGES.find((pkg) => pkg.duration === selectedDuration) ||
      RENTAL_PACKAGES[0];
    return {
      ...basePkg,
      price: getPackagePrice(selectedTier, selectedDuration),
    };
  }, [selectedTier, selectedDuration]);

  const computedEndDate = useMemo(
    () => calculateEndDate(startDate, selectedDuration),
    [startDate, selectedDuration]
  );

  const maxAllowedPartialDate = useMemo(() => {
    const policyMax = addDays(todayStr, MAX_PARTIAL_SETTLE_DAYS);
    if (computedEndDate && computedEndDate < policyMax) {
      return computedEndDate;
    }
    return policyMax;
  }, [todayStr, computedEndDate]);

  const financialSummary = useMemo(() => {
    let paidAmount = activePackage.price;
    if (paymentMode === 'UNPAID') {
      paidAmount = 0;
    } else if (paymentMode === 'PARTIAL') {
      const parsed = Number(partialPaidInput.replace(/[^0-9]/g, '')) || 0;
      paidAmount = Math.min(activePackage.price, Math.max(0, parsed));
    }
    const remainingAmount = Math.max(0, activePackage.price - paidAmount);
    return {
      totalAmount: activePackage.price,
      paidAmount,
      remainingAmount,
    };
  }, [activePackage.price, paymentMode, partialPaidInput]);

  if (!isOpen) return null;

  const transferContent = `GIAHAN ${tenantCode} ${selectedDuration}T ${portalRefCode}`;

  const handleCopyText = (text: string, field: 'CODE' | 'CONTENT') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const validateSelectionStep = (): boolean => {
    if (!startDate) {
      setFormError(
        adminLang === 'en'
          ? 'Please select a start date.'
          : 'Vui lòng chọn ngày bắt đầu hiệu lực kỳ mới.'
      );
      return false;
    }
    if (paymentMode === 'PARTIAL') {
      if (
        financialSummary.paidAmount <= 0 ||
        financialSummary.paidAmount >= financialSummary.totalAmount
      ) {
        setFormError(
          adminLang === 'en'
            ? `Partial amount must be between 1 and ${formatVND(financialSummary.totalAmount)}.`
            : `Số tiền trả trước phải lớn hơn 0 và nhỏ hơn ${formatVND(financialSummary.totalAmount)}.`
        );
        return false;
      }
      const dueErr = validatePartialDueDate(
        remainingDueDateInput,
        computedEndDate,
        todayStr
      );
      if (dueErr) {
        setFormError(dueErr);
        return false;
      }
    }
    setFormError('');
    return true;
  };

  const handleGoToPortal = () => {
    if (!validateSelectionStep()) return;
    setStep('PORTAL');
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageToDataURL(file);
    setProofImage(compressed);
    if (formError) setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSelectionStep()) {
      setStep('SELECT');
      return;
    }

    if (channel === 'QR_TRANSFER' && !portalRefCode.trim()) {
      setFormError(
        adminLang === 'en'
          ? 'Please enter a payment reference code.'
          : 'Vui lòng nhập hoặc giữ mã thanh toán để đối soát.'
      );
      return;
    }

    if (channel === 'COUNTER_CONTRACT' && !contractNumber.trim()) {
      setFormError(
        adminLang === 'en'
          ? 'Please enter a counter contract number.'
          : 'Vui lòng nhập số hợp đồng / phụ lục gia hạn tại quầy.'
      );
      return;
    }

    if (!proofImage) {
      setFormError(
        adminLang === 'en'
          ? 'Please upload proof image.'
          : 'Vui lòng tải lên ảnh minh chứng.'
      );
      return;
    }

    const remainingDueDate =
      paymentMode === 'PARTIAL' && financialSummary.remainingAmount > 0
        ? remainingDueDateInput
        : undefined;

    const channelPrefix =
      channel === 'COUNTER_CONTRACT'
        ? `[Tại quầy · Hợp đồng: ${contractNumber.trim().toUpperCase()}${counterStaffName.trim() ? ` · Nhân viên: ${counterStaffName.trim()}` : ''
        }]`
        : `[Chuyển khoản · Mã thanh toán: ${portalRefCode.trim().toUpperCase()}]`;

    const combinedNote = `${channelPrefix} ${note.trim()}`.trim();

    const result = applyRenewalCycleShared({
      tenantId,
      tenantName,
      tenantCode,
      sourceInvoiceCode,
      tier: selectedTier,
      duration: selectedDuration,
      startDate,
      dueDate: addDays(startDate, 7),
      paymentMethod: channel === 'COUNTER_CONTRACT' ? 'INVOICE' : 'BANK_TRANSFER',
      paidAmount: financialSummary.paidAmount,
      remainingDueDate,
      proofImage,
      note: combinedNote,
    });

    onCompleted(result);
    onClose();
  };

  const getTierTitle = (tier: ServiceTier) => {
    if (tier === 'BASIC') return tr('admin.tierBasic');
    if (tier === 'ENTERPRISE') return tr('admin.tierEnterprise');
    return tr('admin.tierPro');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {step === 'SELECT'
                  ? adminLang === 'en'
                    ? 'Renew Rental Cycle'
                    : 'Gia hạn kỳ thuê mới'
                  : channel === 'COUNTER_CONTRACT'
                    ? adminLang === 'en'
                      ? 'Counter Renewal Contract Portal'
                      : 'Cổng tạo hợp đồng gia hạn tại quầy'
                    : adminLang === 'en'
                      ? 'Payment Reference Portal'
                      : 'Cổng mã thanh toán chuyển khoản'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {tenantName} ({tenantCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          {step === 'SELECT' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {adminLang === 'en' ? 'Service Tier' : 'Hạng gói dịch vụ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(SERVICE_TIERS).map((tierOpt) => {
                    const isSelected = selectedTier === tierOpt.key;
                    return (
                      <button
                        key={tierOpt.key}
                        type="button"
                        onClick={() => setSelectedTier(tierOpt.key)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isSelected
                            ? 'bg-[#0B1324] text-white border-[#0B1324]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <div>{getTierTitle(tierOpt.key)}</div>
                        <div
                          className={`text-[10px] font-normal mt-0.5 tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                        >
                          {formatVND(tierOpt.prices[selectedDuration])}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {adminLang === 'en' ? 'Rental Duration' : 'Chọn gói thời hạn'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RENTAL_PACKAGES.map((pkg) => {
                    const isSelected = pkg.duration === selectedDuration;
                    const tierPkgPrice = getPackagePrice(selectedTier, pkg.duration);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedDuration(pkg.duration)}
                        className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${isSelected
                            ? 'border-rose-600 bg-rose-50/40 ring-1 ring-rose-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                      >
                        <div className="text-sm font-bold text-slate-900">
                          {pkg.duration === 12 ? tr('admin.pkg12m') : tr('admin.pkg6m')}
                        </div>
                        <div className="text-sm font-bold text-rose-600 mt-1 tabular-nums">
                          {formatVND(tierPkgPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Start Date' : 'Ngày bắt đầu hiệu lực'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Channel' : 'Hình thức thực hiện'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChannel('QR_TRANSFER')}
                      className={`h-10 px-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${channel === 'QR_TRANSFER'
                          ? 'bg-[#0B1324] text-white border-[#0B1324]'
                          : 'bg-white text-slate-700 border-slate-300'
                        }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>{adminLang === 'en' ? 'Payment Code' : 'Mã thanh toán'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('COUNTER_CONTRACT')}
                      className={`h-10 px-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${channel === 'COUNTER_CONTRACT'
                          ? 'bg-[#0B1324] text-white border-[#0B1324]'
                          : 'bg-white text-slate-700 border-slate-300'
                        }`}
                    >
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span>{adminLang === 'en' ? 'At Counter' : 'Tại quầy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {adminLang === 'en' ? 'Payment Status' : 'Tình trạng thanh toán'}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('FULL')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'FULL'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Paid in Full' : 'Trả đủ trọn gói'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('PARTIAL')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'PARTIAL'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Partial Payment' : 'Trả trước 1 phần'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UNPAID')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'UNPAID'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Unpaid' : 'Chưa thanh toán'}
                  </button>
                </div>

                {paymentMode === 'PARTIAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {adminLang === 'en' ? 'Prepaid Amount *' : 'Số tiền trả trước *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={activePackage.price - 1}
                        value={partialPaidInput}
                        onChange={(e) => {
                          setPartialPaidInput(e.target.value);
                          if (formError) setFormError('');
                        }}
                        className="h-10 w-full px-3 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {adminLang === 'en'
                          ? `Settlement Due (max ${MAX_PARTIAL_SETTLE_DAYS}d) *`
                          : `Ngày hẹn trả đủ (tối đa ${MAX_PARTIAL_SETTLE_DAYS} ngày) *`}
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        max={maxAllowedPartialDate}
                        value={remainingDueDateInput}
                        onChange={(e) => {
                          setRemainingDueDateInput(e.target.value);
                          if (formError) setFormError('');
                        }}
                        className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleGoToPortal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{tr('common.confirm')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setStep('SELECT');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-rose-600 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{adminLang === 'en' ? 'Back' : 'Quay lại'}</span>
                </button>
              </div>

              {channel === 'QR_TRANSFER' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <QrCode className="w-8 h-8 text-slate-800" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <code className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-900">
                          {portalRefCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyText(portalRefCode, 'CODE')}
                          className="p-1 rounded border border-slate-200 bg-white text-slate-600 cursor-pointer"
                        >
                          {copiedField === 'CODE' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-slate-600 truncate">{transferContent}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {contractNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{tr('contracts.printPdf')}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value.toUpperCase())}
                      className="h-10 px-3 text-sm font-semibold uppercase border border-slate-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={counterStaffName}
                      onChange={(e) => setCounterStaffName(e.target.value)}
                      className="h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                {proofImage ? (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={proofImage}
                      alt="Proof"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setProofImage('')}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      {tr('common.delete')}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/70 transition-colors cursor-pointer text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">
                      {adminLang === 'en'
                        ? 'Upload proof image *'
                        : 'Tải lên ảnh minh chứng *'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  {tr('common.save')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT: AdminBillingManagement
// ==========================================

export const AdminBillingManagement: React.FC = () => {
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

  const [invoices, setInvoices] = useState<BillingInvoice[]>(
    () => syncUnifiedPlatformData().invoices
  );
  const [tenantList, setTenantList] = useState<UnifiedTenantRecord[]>(
    () => syncUnifiedPlatformData().tenants
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<'ALL' | PackageDuration>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoicePaymentState>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renewalTargetInv, setRenewalTargetInv] = useState<BillingInvoice | null>(null);
  const [previewProofImage, setPreviewProofImage] = useState<{
    title: string;
    subtitle: string;
    imageUrl: string;
  } | null>(null);

  const [partialTopUpInv, setPartialTopUpInv] = useState<BillingInvoice | null>(null);
  const [topUpAmountInput, setTopUpAmountInput] = useState<string>('');
  const [topUpNextDueDate, setTopUpNextDueDate] = useState<string>('');
  const [topUpError, setTopUpError] = useState<string>('');

  const [selectedTenantId, setSelectedTenantId] = useState<string>('CUSTOM');
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [selectedTier, setSelectedTier] = useState<ServiceTier>('PRO');
  const [selectedDuration, setSelectedDuration] = useState<PackageDuration>(6);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() =>
    addDays(new Date().toISOString().split('T')[0], 7)
  );
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'INVOICE'>('BANK_TRANSFER');
  const [proofImage, setProofImage] = useState<string>('');

  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [partialPaidInput, setPartialPaidInput] = useState<string>('5000000');
  const [remainingDueDateInput, setRemainingDueDateInput] = useState<string>(() =>
    addDays(new Date().toISOString().split('T')[0], 14)
  );

  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const adminName = sessionStorage.getItem('sys_core_admin_name') || 'Nguyễn Nhật Long';
  const adminUsername = sessionStorage.getItem('sys_core_username') || '';

  const logBillingAction = (action: string, details: string) => {
    recordAdminAction(
      action,
      details,
      adminUsername ? { username: adminUsername, fullName: adminName } : undefined
    );
  };

  useEffect(() => {
    const handleSync = () => {
      const synced = syncUnifiedPlatformData();
      setInvoices(synced.invoices);
      setTenantList(synced.tenants);
    };
    window.addEventListener(PLATFORM_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(PLATFORM_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const persistAll = (nextInvoices: BillingInvoice[], nextTenants: UnifiedTenantRecord[]) => {
    const synced = commitUnifiedPlatformData(nextTenants, nextInvoices);
    setInvoices(synced.invoices);
    setTenantList(synced.tenants);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const activePackage = useMemo(() => {
    const basePkg =
      RENTAL_PACKAGES.find((pkg) => pkg.duration === selectedDuration) ||
      RENTAL_PACKAGES[0];
    return {
      ...basePkg,
      price: getPackagePrice(selectedTier, selectedDuration),
    };
  }, [selectedDuration, selectedTier]);

  const computedEndDate = useMemo(
    () => calculateEndDate(startDate, selectedDuration),
    [startDate, selectedDuration]
  );

  const maxAllowedPartialDate = useMemo(() => {
    const policyMax = addDays(todayStr, MAX_PARTIAL_SETTLE_DAYS);
    if (computedEndDate && computedEndDate < policyMax) {
      return computedEndDate;
    }
    return policyMax;
  }, [todayStr, computedEndDate]);

  const unifiedMetrics = useMemo(
    () => computeUnifiedPlatformMetrics(tenantList, invoices),
    [tenantList, invoices]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const matchesSearch =
        item.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenantCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDuration = durationFilter === 'ALL' || item.duration === durationFilter;
      const itemState = getInvoicePaymentState(item, todayStr);
      const matchesStatus = statusFilter === 'ALL' || itemState === statusFilter;
      return matchesSearch && matchesDuration && matchesStatus;
    });
  }, [invoices, searchTerm, durationFilter, statusFilter, todayStr]);

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];

    if (tenantList.length > 0) {
      const first = tenantList[0];
      setSelectedTenantId(first.id);
      setTenantName(first.name);
      setTenantCode(first.code);
      setSelectedTier(first.tier || 'PRO');
    } else {
      setSelectedTenantId('CUSTOM');
      setTenantName('');
      setTenantCode('');
      setSelectedTier('PRO');
    }

    setSelectedDuration(6);
    setStartDate(today);
    setDueDate(addDays(today, 7));
    setPaymentMethod('BANK_TRANSFER');
    setProofImage('');
    setPaymentMode('FULL');
    setPartialPaidInput('5000000');
    setRemainingDueDateInput(addDays(today, 14));
    setNote('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSelectExistingTenant = (value: string) => {
    setSelectedTenantId(value);
    if (value === 'CUSTOM') {
      setTenantName('');
      setTenantCode('');
      setSelectedTier('PRO');
      return;
    }
    const found = tenantList.find((t) => t.id === value);
    if (found) {
      setTenantName(found.name);
      setTenantCode(found.code);
      setSelectedTier(found.tier || 'PRO');
    }
  };

  const handleProofImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageToDataURL(file);
    setProofImage(compressed);
    if (formError) setFormError('');
  };

  const resolvePaidAmountFromForm = (pkgPrice: number): {
    paidAmount: number;
    remainingDueDate?: string;
    error?: string;
  } => {
    if (paymentMode === 'FULL') {
      return { paidAmount: pkgPrice, remainingDueDate: undefined };
    }
    if (paymentMode === 'UNPAID') {
      return { paidAmount: 0, remainingDueDate: undefined };
    }
    const parsedPartial = Number(partialPaidInput.replace(/[^0-9]/g, ''));
    if (!parsedPartial || parsedPartial <= 0) {
      return {
        paidAmount: 0,
        error:
          adminLang === 'en'
            ? 'Please enter a valid prepaid amount.'
            : 'Vui lòng nhập số tiền trả trước hợp lệ (lớn hơn 0).',
      };
    }
    if (parsedPartial >= pkgPrice) {
      return {
        paidAmount: 0,
        error:
          adminLang === 'en'
            ? 'Prepaid amount must be less than package total.'
            : `Số tiền trả trước phải nhỏ hơn giá trọn gói (${formatVND(pkgPrice)}).`,
      };
    }
    const dueErr = validatePartialDueDate(
      remainingDueDateInput,
      computedEndDate,
      todayStr
    );
    if (dueErr) {
      return { paidAmount: 0, error: dueErr };
    }
    return {
      paidAmount: parsedPartial,
      remainingDueDate: remainingDueDateInput,
    };
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      setFormError(
        adminLang === 'en' ? 'Please enter enterprise name.' : 'Vui lòng nhập tên doanh nghiệp.'
      );
      return;
    }
    if (!tenantCode.trim()) {
      setFormError(
        adminLang === 'en' ? 'Please enter enterprise code.' : 'Vui lòng nhập mã doanh nghiệp.'
      );
      return;
    }
    if (!startDate) {
      setFormError(
        adminLang === 'en' ? 'Please select start date.' : 'Vui lòng chọn ngày bắt đầu hiệu lực.'
      );
      return;
    }
    if (!proofImage) {
      setFormError(
        adminLang === 'en' ? 'Please upload proof image.' : 'Vui lòng tải lên hình ảnh minh chứng.'
      );
      return;
    }

    const paymentCheck = resolvePaidAmountFromForm(activePackage.price);
    if (paymentCheck.error) {
      setFormError(paymentCheck.error);
      return;
    }

    const nowIso = new Date().toISOString();
    const { paidAmount, remainingDueDate } = paymentCheck;
    const remainingAmount = Math.max(0, activePackage.price - paidAmount);
    const tierOpt = SERVICE_TIERS[selectedTier];
    const cleanCode = tenantCode.trim().toUpperCase();
    const resolvedTenantId =
      selectedTenantId !== 'CUSTOM' ? selectedTenantId : `COMPANY_${Date.now()}`;

    const newEvidence: ContractEvidenceItem = {
      id: `ev-${Date.now()}`,
      type: 'INITIAL',
      title: 'Hợp đồng đăng ký gói thuê',
      tierLabel: tierOpt.label,
      packageName: activePackage.name,
      amount: activePackage.price,
      startDate,
      endDate: computedEndDate,
      imageUrl: proofImage,
      uploadedAt: nowIso,
      note: note.trim() || undefined,
    };

    const lifecycle = evaluateTenantLifecycle({
      rawStatus: 'ACTIVE',
      expiresAt: computedEndDate,
      totalAmount: activePackage.price,
      paidAmount,
      remainingDueDate,
      isAdvanceForNextCycle: false,
    });

    const newCode = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      invoiceCode: newCode,
      tenantId: resolvedTenantId,
      tenantName: tenantName.trim(),
      tenantCode: cleanCode,
      tier: selectedTier,
      tierName: tierOpt.label,
      packageId: activePackage.id,
      packageName: activePackage.name,
      duration: activePackage.duration,
      totalAmount: activePackage.price,
      paidAmount,
      remainingDueDate,
      isAdvanceForNextCycle: false,
      startDate,
      endDate: computedEndDate,
      dueDate: dueDate || addDays(startDate, 7),
      paymentMethod,
      proofImage,
      note: note.trim() || undefined,
      updatedAt: nowIso,
    };
    const nextInvoices = [newInvoice, ...invoices];

    const tenantExists = tenantList.some(
      (t) => t.id === resolvedTenantId || t.code.toUpperCase() === cleanCode
    );
    const nextTenants = tenantExists
      ? tenantList.map((t) =>
        t.id === resolvedTenantId || t.code.toUpperCase() === cleanCode
          ? {
            ...t,
            tier: selectedTier,
            plan: activePackage.planKey,
            status: lifecycle.status,
            lifecycleStatus: lifecycle.lifecycleStatus,
            isPartialPayment: lifecycle.isPartialPayment,
            paidAmount,
            remainingAmount,
            remainingDueDate,
            daysUntilExpiry: lifecycle.daysUntilExpiry,
            packagePrice: activePackage.price,
            monthlyFee: Math.round(activePackage.price / activePackage.duration),
            activatedAt: startDate,
            expiresAt: computedEndDate,
            evidenceHistory: [newEvidence, ...(t.evidenceHistory || [])],
            updatedAt: nowIso,
          }
          : t
      )
      : [
        ...tenantList,
        {
          id: resolvedTenantId,
          name: tenantName.trim(),
          code: cleanCode,
          ownerName: 'Chưa cập nhật',
          phone: '',
          email: '',
          address: 'Chưa cập nhật',
          status: lifecycle.status,
          lifecycleStatus: lifecycle.lifecycleStatus,
          isPartialPayment: lifecycle.isPartialPayment,
          paidAmount,
          remainingAmount,
          remainingDueDate,
          daysUntilExpiry: lifecycle.daysUntilExpiry,
          tier: selectedTier,
          plan: activePackage.planKey,
          packagePrice: activePackage.price,
          monthlyFee: Math.round(activePackage.price / activePackage.duration),
          activatedAt: startDate,
          expiresAt: computedEndDate,
          evidenceHistory: [newEvidence],
          notes: '',
          updatedAt: nowIso,
        },
      ];

    persistAll(nextInvoices, nextTenants);
    logBillingAction(
      adminLang === 'en' ? 'BILLING' : 'THANH TOÁN',
      `Lập phiếu ${newCode} cho ${tenantName.trim()}`
    );
    setIsModalOpen(false);
  };

  const handleConfirmPaid = (inv: BillingInvoice) => {
    const nowIso = new Date().toISOString();
    const pkg = inv.duration === 12 ? RENTAL_PACKAGES[1] : RENTAL_PACKAGES[0];
    const pkgPrice = inv.totalAmount || getPackagePrice(inv.tier || 'PRO', inv.duration);
    const nextInvoices = invoices.map((item) =>
      item.id === inv.id
        ? {
          ...item,
          totalAmount: pkgPrice,
          paidAmount: pkgPrice,
          remainingDueDate: undefined,
          isAdvanceForNextCycle: false,
          updatedAt: nowIso,
        }
        : item
    );

    const lifecycle = evaluateTenantLifecycle({
      rawStatus: 'ACTIVE',
      expiresAt: inv.endDate,
      totalAmount: pkgPrice,
      paidAmount: pkgPrice,
      remainingDueDate: undefined,
      isAdvanceForNextCycle: false,
    });

    const nextTenants = tenantList.map((t) => {
      if (
        t.id !== inv.tenantId &&
        t.code.toUpperCase() !== inv.tenantCode.toUpperCase()
      ) {
        return t;
      }
      return {
        ...t,
        tier: inv.tier || t.tier || 'PRO',
        plan: pkg.planKey,
        status: lifecycle.status,
        lifecycleStatus: lifecycle.lifecycleStatus,
        isPartialPayment: false,
        paidAmount: pkgPrice,
        remainingAmount: 0,
        remainingDueDate: undefined,
        advanceNextCycleAmount: 0,
        advanceNextCycleDueDate: undefined,
        daysUntilExpiry: lifecycle.daysUntilExpiry,
        packagePrice: pkgPrice,
        monthlyFee: Math.round(pkgPrice / pkg.duration),
        expiresAt: inv.endDate,
        updatedAt: nowIso,
      };
    });

    persistAll(nextInvoices, nextTenants);
    logBillingAction(
      adminLang === 'en' ? 'COLLECT' : 'THU TIỀN',
      `Xác nhận thu đủ ${formatVND(pkgPrice)} (${inv.invoiceCode}) từ ${inv.tenantName}`
    );
  };

  const openPartialTopUpModal = (inv: BillingInvoice) => {
    const rem = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
    const defaultNext =
      inv.endDate && inv.endDate < addDays(todayStr, 7)
        ? inv.endDate
        : addDays(todayStr, 7);
    setPartialTopUpInv(inv);
    setTopUpAmountInput(String(rem));
    setTopUpNextDueDate(inv.remainingDueDate || defaultNext);
    setTopUpError('');
  };

  const handleConfirmPartialTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partialTopUpInv) return;

    const currentRemaining = Math.max(
      0,
      (partialTopUpInv.totalAmount || 0) - (partialTopUpInv.paidAmount || 0)
    );
    const addPaid = Number(topUpAmountInput.replace(/[^0-9]/g, ''));

    if (!addPaid || addPaid <= 0) {
      setTopUpError(
        adminLang === 'en'
          ? 'Enter a valid amount.'
          : 'Vui lòng nhập số tiền thanh toán thêm lớn hơn 0.'
      );
      return;
    }
    if (addPaid > currentRemaining) {
      setTopUpError(
        adminLang === 'en'
          ? `Amount cannot exceed remaining balance (${formatVND(currentRemaining)}).`
          : `Số tiền thu thêm không được vượt quá số còn nợ (${formatVND(currentRemaining)}).`
      );
      return;
    }

    const nextPaidAmount = Math.min(
      partialTopUpInv.totalAmount,
      (partialTopUpInv.paidAmount || 0) + addPaid
    );
    const nextRemaining = Math.max(0, partialTopUpInv.totalAmount - nextPaidAmount);
    const nextRemainingDueDate =
      nextRemaining > 0 ? topUpNextDueDate : undefined;

    if (nextRemaining > 0) {
      const dueErr = validatePartialDueDate(
        nextRemainingDueDate || '',
        partialTopUpInv.endDate,
        todayStr
      );
      if (dueErr) {
        setTopUpError(dueErr);
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const pkgPrice =
      partialTopUpInv.totalAmount ||
      getPackagePrice(partialTopUpInv.tier || 'PRO', partialTopUpInv.duration);

    const nextInvoices = invoices.map((item) =>
      item.id === partialTopUpInv.id
        ? {
          ...item,
          paidAmount: nextPaidAmount,
          remainingDueDate: nextRemainingDueDate,
          isAdvanceForNextCycle:
            nextRemaining > 0 ? Boolean(item.isAdvanceForNextCycle) : false,
          updatedAt: nowIso,
        }
        : item
    );

    const lifecycle = evaluateTenantLifecycle({
      rawStatus: 'ACTIVE',
      expiresAt: partialTopUpInv.endDate,
      totalAmount: partialTopUpInv.totalAmount,
      paidAmount: nextPaidAmount,
      remainingDueDate: nextRemainingDueDate,
      isAdvanceForNextCycle: Boolean(partialTopUpInv.isAdvanceForNextCycle),
    });

    const nextTenants = tenantList.map((t) => {
      if (
        t.id !== partialTopUpInv.tenantId &&
        t.code.toUpperCase() !== partialTopUpInv.tenantCode.toUpperCase()
      ) {
        return t;
      }
      return {
        ...t,
        status: lifecycle.status,
        lifecycleStatus: lifecycle.lifecycleStatus,
        isPartialPayment: lifecycle.isPartialPayment,
        paidAmount: nextPaidAmount,
        remainingAmount: nextRemaining,
        remainingDueDate: nextRemainingDueDate,
        daysUntilExpiry: lifecycle.daysUntilExpiry,
        packagePrice: pkgPrice,
        monthlyFee: Math.round(pkgPrice / partialTopUpInv.duration),
        updatedAt: nowIso,
      };
    });

    persistAll(nextInvoices, nextTenants);
    logBillingAction(
      adminLang === 'en' ? 'COLLECT' : 'THU TIỀN',
      `Thu thêm ${formatVND(addPaid)} cho ${partialTopUpInv.tenantName} (${partialTopUpInv.invoiceCode})`
    );
    setPartialTopUpInv(null);
  };

  const handleDeleteInvoice = (inv: BillingInvoice) => {
    const sameTenantInvoices = invoices.filter(
      (item) =>
        item.tenantId === inv.tenantId ||
        item.tenantCode.toUpperCase() === inv.tenantCode.toUpperCase()
    );
    const isLastInvoiceOfTenant = sameTenantInvoices.length <= 1;

    const confirmMsg =
      adminLang === 'en'
        ? `Delete invoice ${inv.invoiceCode} for ${inv.tenantName}?`
        : `Xác nhận xóa phiếu ${inv.invoiceCode} của ${inv.tenantName}?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    const nextInvoices = invoices.filter((item) => item.id !== inv.id);
    const nextTenants = isLastInvoiceOfTenant
      ? tenantList.filter(
        (t) =>
          t.id !== inv.tenantId &&
          t.code.toUpperCase() !== inv.tenantCode.toUpperCase()
      )
      : tenantList;

    persistAll(nextInvoices, nextTenants);
    logBillingAction(
      adminLang === 'en' ? 'DELETE' : 'XÓA',
      `Xóa phiếu ${inv.invoiceCode} của ${inv.tenantName}`
    );
  };

  const renderStatusBadge = (inv: BillingInvoice) => {
    const state = getInvoicePaymentState(inv, todayStr);
    if (state === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {adminLang === 'en' ? 'Paid' : 'Đã thanh toán'}
        </span>
      );
    }
    if (state === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Wallet className="w-3.5 h-3.5 text-amber-600" />
          {inv.isAdvanceForNextCycle
            ? adminLang === 'en'
              ? 'Paid Ahead Next Cycle'
              : 'Trả trước kỳ mới'
            : tr('admin.statusPartial')}
        </span>
      );
    }
    if (state === 'EXPIRING_SOON') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          {tr('admin.statusExpiring')}
        </span>
      );
    }
    if (state === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          <AlertCircle className="w-3.5 h-3.5" />
          {adminLang === 'en' ? 'Overdue' : 'Quá hạn'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        <Clock className="w-3.5 h-3.5" />
        {adminLang === 'en' ? 'Pending' : 'Chờ thanh toán'}
      </span>
    );
  };

  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-6 space-y-5 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {adminLang === 'en' ? 'Register New Plan' : 'Đăng ký gói thuê mới'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">
            {adminLang === 'en' ? 'Collected' : 'Đã thực thu'}
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatVND(unifiedMetrics.totalCollected)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            {adminLang === 'en' ? 'Remaining' : 'Còn phải thu'}:{' '}
            {formatVND(unifiedMetrics.totalRemainingAll)}
          </span>
        </div>

        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">
            {tr('admin.cardMonthlyPkg')}
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {formatVND(unifiedMetrics.monthlyPackageRevenue)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            {unifiedMetrics.count6M} × 6M · {unifiedMetrics.count12M} × 12M
          </span>
        </div>

        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">
            {adminLang === 'en' ? 'Active Plan Value' : 'Tổng giá trị gói hoạt động'}
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatVND(unifiedMetrics.totalPackageValue)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            {unifiedMetrics.activeCount} {tr('admin.statusActive').toLowerCase()}
          </span>
        </div>

        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">
            {adminLang === 'en' ? 'Overdue Debt' : 'Công nợ quá hạn'}
          </span>
          <p
            className={`text-2xl font-bold mt-1 tabular-nums ${unifiedMetrics.totalOverdueDebt > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
          >
            {formatVND(unifiedMetrics.totalOverdueDebt)}
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            {unifiedMetrics.overdueInvoices.length}{' '}
            {adminLang === 'en' ? 'overdue invoice(s)' : 'phiếu quá hạn'}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tr('common.search')}
            className="h-9 w-full pl-9 pr-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={durationFilter}
            onChange={(e) =>
              setDurationFilter(
                e.target.value === 'ALL'
                  ? 'ALL'
                  : (Number(e.target.value) as PackageDuration)
              )
            }
            className="h-9 px-3 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">{tr('admin.filterAllPlans')}</option>
            <option value={6}>{tr('admin.pkg6m')}</option>
            <option value={12}>{tr('admin.pkg12m')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | InvoicePaymentState)}
            className="h-9 px-3 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">{tr('fleet.filterAllStatus')}</option>
            <option value="PAID">{adminLang === 'en' ? 'Paid' : 'Đã thanh toán'}</option>
            <option value="PARTIAL">{tr('admin.statusPartial')}</option>
            <option value="EXPIRING_SOON">{tr('admin.statusExpiring')}</option>
            <option value="PENDING">{adminLang === 'en' ? 'Pending' : 'Chờ thanh toán'}</option>
            <option value="OVERDUE">{adminLang === 'en' ? 'Overdue' : 'Quá hạn'}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="py-3.5 px-5">{adminLang === 'en' ? 'Invoice' : 'Mã phiếu'}</th>
                <th className="py-3.5 px-4">{tr('admin.colTenant')}</th>
                <th className="py-3.5 px-4">{tr('admin.colTierPlan')}</th>
                <th className="py-3.5 px-4">{adminLang === 'en' ? 'Term & Due' : 'Hiệu lực & Hẹn trả đủ'}</th>
                <th className="py-3.5 px-4 text-right">{adminLang === 'en' ? 'Paid / Total' : 'Đã trả / Tổng gói'}</th>
                <th className="py-3.5 px-4">{adminLang === 'en' ? 'Proof' : 'Minh chứng'}</th>
                <th className="py-3.5 px-4">{tr('common.status')}</th>
                <th className="py-3.5 px-5 text-right">{tr('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-sm">
                    {tr('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invState = getInvoicePaymentState(inv, todayStr);
                  const remaining = getReceivableAmountForInvoice(inv, todayStr);
                  const isUnpaid = remaining > 0;
                  const isPartial =
                    invState === 'PARTIAL' ||
                    ((inv.paidAmount || 0) > 0 &&
                      Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)) > 0);
                  const tierLabel =
                    inv.tier === 'BASIC'
                      ? tr('admin.tierBasic')
                      : inv.tier === 'ENTERPRISE'
                        ? tr('admin.tierEnterprise')
                        : tr('admin.tierPro');

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-700">
                        {inv.invoiceCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.tenantName}</div>
                        <div className="text-xs text-slate-500">{inv.tenantCode}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#0B1324] text-white">
                            {tierLabel}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {inv.duration === 12 ? tr('admin.pkg12m') : tr('admin.pkg6m')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDateVN(inv.startDate)} → {formatDateVN(inv.endDate)}
                          </span>
                        </div>
                        {isPartial && inv.remainingDueDate && (
                          <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
                            {adminLang === 'en' ? 'Due full' : 'Hẹn trả đủ'}: {formatDateVN(inv.remainingDueDate)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        <div className="font-bold text-slate-900">
                          {formatVND(inv.paidAmount)} / {formatVND(inv.totalAmount)}
                        </div>
                        {remaining > 0 && (
                          <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                            {adminLang === 'en' ? 'Balance' : 'Còn nợ'}: {formatVND(remaining)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.proofImage ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewProofImage({
                                title: `${inv.tenantName} · ${inv.invoiceCode}`,
                                subtitle: `${tierLabel} · ${inv.duration === 12 ? tr('admin.pkg12m') : tr('admin.pkg6m')}`,
                                imageUrl: inv.proofImage!,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-600" />
                            <span>{adminLang === 'en' ? 'View' : 'Xem ảnh'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">{tr('admin.noContractImg')}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(inv)}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {isPartial && (
                            <button
                              type="button"
                              onClick={() => openPartialTopUpModal(inv)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                            >
                              {adminLang === 'en' ? 'Collect Part' : 'Thu thêm'}
                            </button>
                          )}
                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPaid(inv)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              {tr('admin.settleDebtBtn')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRenewalTargetInv(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{tr('admin.renewBtn')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv)}
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

      {/* MODAL GIA HẠN DÙNG CHUNG */}
      <SharedRenewalModal
        isOpen={Boolean(renewalTargetInv)}
        onClose={() => setRenewalTargetInv(null)}
        tenantId={renewalTargetInv?.tenantId || ''}
        tenantName={renewalTargetInv?.tenantName || ''}
        tenantCode={renewalTargetInv?.tenantCode || ''}
        currentExpiresAt={renewalTargetInv?.endDate}
        initialTier={renewalTargetInv?.tier || 'PRO'}
        initialDuration={renewalTargetInv?.duration || 6}
        sourceInvoiceCode={renewalTargetInv?.invoiceCode}
        onCompleted={({ tenants: nextTenants, invoices: nextInvoices, newInvoice }) => {
          setTenantList(nextTenants);
          setInvoices(nextInvoices);
          logBillingAction(
            adminLang === 'en' ? 'RENEW' : 'GIA HẠN',
            `Tạo phiếu ${newInvoice.invoiceCode} gia hạn cho ${newInvoice.tenantName}`
          );
        }}
      />

      {/* MODAL ĐĂNG KÝ GÓI THUÊ MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {adminLang === 'en' ? 'Register New Plan' : 'Đăng ký gói thuê dịch vụ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              {tenantList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr('admin.colTenant')}
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => handleSelectExistingTenant(e.target.value)}
                    className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {tenantList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                    <option value="CUSTOM">+ {tr('admin.addNewBtn')}</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Enterprise Name *' : 'Tên doanh nghiệp *'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={selectedTenantId !== 'CUSTOM'}
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="h-10 w-full pl-9 pr-3 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Code *' : 'Mã doanh nghiệp *'}
                  </label>
                  <input
                    type="text"
                    disabled={selectedTenantId !== 'CUSTOM'}
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                    className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg uppercase font-semibold disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {adminLang === 'en' ? 'Service Tier' : 'Hạng gói dịch vụ'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(SERVICE_TIERS).map((tierOpt) => {
                    const isSelected = selectedTier === tierOpt.key;
                    const label =
                      tierOpt.key === 'BASIC'
                        ? tr('admin.tierBasic')
                        : tierOpt.key === 'ENTERPRISE'
                          ? tr('admin.tierEnterprise')
                          : tr('admin.tierPro');
                    return (
                      <button
                        key={tierOpt.key}
                        type="button"
                        onClick={() => setSelectedTier(tierOpt.key)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isSelected
                            ? 'bg-[#0B1324] text-white border-[#0B1324]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <div>{label}</div>
                        <div
                          className={`text-[10px] font-normal mt-0.5 tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                        >
                          {formatVND(tierOpt.prices[selectedDuration])}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {adminLang === 'en' ? 'Rental Duration' : 'Chọn gói thời hạn'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RENTAL_PACKAGES.map((pkg) => {
                    const isSelected = pkg.duration === selectedDuration;
                    const tierPkgPrice = getPackagePrice(selectedTier, pkg.duration);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedDuration(pkg.duration)}
                        className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${isSelected
                            ? 'border-rose-600 bg-rose-50/40 ring-1 ring-rose-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                      >
                        <div className="text-sm font-bold text-slate-900">
                          {pkg.duration === 12 ? tr('admin.pkg12m') : tr('admin.pkg6m')}
                        </div>
                        <div className="text-sm font-bold text-rose-600 mt-1 tabular-nums">
                          {formatVND(tierPkgPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Start Date' : 'Ngày bắt đầu hiệu lực'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDueDate(addDays(e.target.value, 7));
                    }}
                    className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adminLang === 'en' ? 'Payment Method' : 'Hình thức thanh toán'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as 'BANK_TRANSFER' | 'INVOICE')
                    }
                    className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="BANK_TRANSFER">
                      {adminLang === 'en' ? 'Bank Transfer' : 'Chuyển khoản ngân hàng'}
                    </option>
                    <option value="INVOICE">
                      {adminLang === 'en' ? 'Credit Invoice' : 'Xuất hóa đơn công nợ'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {adminLang === 'en' ? 'Payment Status' : 'Tình trạng thanh toán'}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('FULL')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'FULL'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Paid in Full' : 'Trả đủ trọn gói'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('PARTIAL')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'PARTIAL'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Partial Payment' : 'Trả trước 1 phần'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UNPAID')}
                    className={`py-2 px-2.5 rounded-lg border font-semibold cursor-pointer ${paymentMode === 'UNPAID'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-300'
                      }`}
                  >
                    {adminLang === 'en' ? 'Unpaid' : 'Chưa thanh toán'}
                  </button>
                </div>

                {paymentMode === 'PARTIAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {adminLang === 'en' ? 'Prepaid Amount *' : 'Số tiền trả trước *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={activePackage.price - 1}
                        value={partialPaidInput}
                        onChange={(e) => {
                          setPartialPaidInput(e.target.value);
                          if (formError) setFormError('');
                        }}
                        className="h-10 w-full px-3 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {adminLang === 'en'
                          ? `Settlement Due (max ${MAX_PARTIAL_SETTLE_DAYS}d) *`
                          : `Ngày hẹn trả đủ (tối đa ${MAX_PARTIAL_SETTLE_DAYS} ngày) *`}
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        max={maxAllowedPartialDate}
                        value={remainingDueDateInput}
                        onChange={(e) => {
                          setRemainingDueDateInput(e.target.value);
                          if (formError) setFormError('');
                        }}
                        className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                {proofImage ? (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={proofImage}
                      alt="Proof"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setProofImage('')}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      {tr('common.delete')}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/70 transition-colors cursor-pointer text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">
                      {adminLang === 'en'
                        ? 'Upload proof image *'
                        : 'Tải lên ảnh minh chứng hợp đồng *'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  {tr('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {partialTopUpInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {partialTopUpInv.tenantName}
              </h3>
              <button
                type="button"
                onClick={() => setPartialTopUpInv(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPartialTopUp} className="p-6 space-y-4">
              {topUpError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {topUpError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {adminLang === 'en' ? 'Amount to Collect *' : 'Số tiền thanh toán đợt này *'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={topUpAmountInput}
                  onChange={(e) => {
                    setTopUpAmountInput(e.target.value);
                    if (topUpError) setTopUpError('');
                  }}
                  className="h-10 w-full px-3 text-sm font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {adminLang === 'en'
                    ? `Next Settlement Due (max ${MAX_PARTIAL_SETTLE_DAYS}d)`
                    : `Ngày hẹn trả đủ phần còn lại (tối đa ${MAX_PARTIAL_SETTLE_DAYS} ngày)`}
                </label>
                <input
                  type="date"
                  min={todayStr}
                  max={
                    partialTopUpInv.endDate &&
                      partialTopUpInv.endDate < addDays(todayStr, MAX_PARTIAL_SETTLE_DAYS)
                      ? partialTopUpInv.endDate
                      : addDays(todayStr, MAX_PARTIAL_SETTLE_DAYS)
                  }
                  value={topUpNextDueDate}
                  onChange={(e) => {
                    setTopUpNextDueDate(e.target.value);
                    if (topUpError) setTopUpError('');
                  }}
                  className="h-10 w-full px-3 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPartialTopUpInv(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  {tr('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewProofImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4"
          onClick={() => setPreviewProofImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {previewProofImage.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {previewProofImage.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProofImage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[78vh] overflow-auto">
              <img
                src={previewProofImage.imageUrl}
                alt={previewProofImage.title}
                className="max-w-full max-h-[72vh] rounded-lg object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminBillingManagement;
