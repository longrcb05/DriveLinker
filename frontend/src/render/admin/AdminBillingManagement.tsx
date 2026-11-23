import React, { useState, useEffect, useMemo } from 'react';
import {
    Receipt,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Lock,
    Unlock,
    CreditCard,
    Banknote,
    Building2,
    Car,
    FileCheck2,
    Eye,
    X,
    AlertCircle,
    ShieldCheck,
    Wallet,
    Calendar,
    FileText,
    Upload,
    Sparkles,
    Calculator
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { TenantRecord, TenantStatus, SubscriptionPlan } from './AdminTenantList';

export type PaymentStatus = 'PAID' | 'UNPAID' | 'OVERDUE';
export type BillingMode = 'PACKAGE' | 'PER_VEHICLE';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH';
export type TxVerifyStatus = 'CONFIRMED' | 'PENDING';
export type PaidPlanKey = Exclude<SubscriptionPlan, 'TRIAL_14D'>;

export interface PaymentTransaction {
    id: string;
    amount: number;
    method: PaymentMethod;
    transactionCode: string;
    voucherCode: string;
    voucherImage?: string;
    paidAt: string;
    verifyStatus: TxVerifyStatus;
    verifiedBy?: string;
    verifiedAt?: string;
    note?: string;
}

export interface BillingInvoice {
    id: string;
    invoiceCode: string;
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    billingPeriod: string;
    billingMode: BillingMode;
    planKey?: PaidPlanKey;
    planName: string;
    durationMonths: number;
    discountPercent: number;
    vehicleCount: number;
    includedVehicles?: number;
    overageVehicles?: number;
    overageAmount?: number;
    unitPricePerVehicle: number;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    createdAt: string;
    transactions: PaymentTransaction[];
}

interface CoreAuditLog {
    id: number;
    time: string;
    admin: string;
    action: string;
    details: string;
}

interface PaidPackageSpec {
    key: PaidPlanKey;
    labelVi: string;
    labelEn: string;
    monthlyFee: number;
    maxVehicles: number;
}

interface DurationOption {
    months: number;
    labelVi: string;
    labelEn: string;
    discountPercent: number;
}

const AUDIT_STORAGE_KEY = 'sys_core_audit_logs';
const OVERAGE_RATE_PER_VEHICLE = 120000; // 120.000đ / xe vượt hạn mức / tháng

const PAID_PACKAGES: Record<PaidPlanKey, PaidPackageSpec> = {
    STARTER: {
        key: 'STARTER',
        labelVi: 'Starter (Cơ bản)',
        labelEn: 'Starter',
        monthlyFee: 990000,
        maxVehicles: 15
    },
    PRO: {
        key: 'PRO',
        labelVi: 'Professional (Chuyên nghiệp)',
        labelEn: 'Professional',
        monthlyFee: 2490000,
        maxVehicles: 50
    },
    ENTERPRISE: {
        key: 'ENTERPRISE',
        labelVi: 'Enterprise (Doanh nghiệp lớn)',
        labelEn: 'Enterprise',
        monthlyFee: 4990000,
        maxVehicles: 200
    }
};

const DURATION_OPTIONS: DurationOption[] = [
    { months: 1, labelVi: '1 tháng', labelEn: '1 Month', discountPercent: 0 },
    { months: 3, labelVi: '3 tháng (Quý)', labelEn: '3 Months', discountPercent: 5 },
    { months: 6, labelVi: '6 tháng', labelEn: '6 Months', discountPercent: 10 },
    { months: 12, labelVi: '12 tháng (Năm)', labelEn: '12 Months', discountPercent: 15 }
];

// Biểu phí bậc thang theo quy mô đội xe thực tế (Pay-as-you-go)
const getPerVehicleTierRate = (vehicleCount: number): { rate: number; tierLabel: string } => {
    if (vehicleCount <= 10) {
        return { rate: 150000, tierLabel: 'Bậc 1 (1–10 xe)' };
    }
    if (vehicleCount <= 30) {
        return { rate: 130000, tierLabel: 'Bậc 2 (11–30 xe)' };
    }
    return { rate: 110000, tierLabel: 'Bậc 3 (Trên 30 xe)' };
};

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

const computePaymentStatus = (invoice: BillingInvoice): PaymentStatus => {
    const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    if (remaining <= 0) return 'PAID';
    const today = new Date().toISOString().split('T')[0];
    if (invoice.dueDate && invoice.dueDate < today) return 'OVERDUE';
    return 'UNPAID';
};

const buildSeedInvoices = (): BillingInvoice[] => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

    return [
        {
            id: 'INV-1001',
            invoiceCode: 'HD-DV-202611-01',
            tenantId: 'COMPANY_A',
            tenantName: 'Demo CTY A',
            tenantCode: 'CTYA26',
            billingPeriod: `${currentMonth} (1T)`,
            billingMode: 'PACKAGE',
            planKey: 'PRO',
            planName: 'Professional (Chuyên nghiệp)',
            durationMonths: 1,
            discountPercent: 0,
            vehicleCount: 18,
            includedVehicles: 50,
            overageVehicles: 0,
            overageAmount: 0,
            unitPricePerVehicle: 130000,
            totalAmount: 2490000,
            paidAmount: 2490000,
            dueDate: addDaysISO(today, 10),
            createdAt: addDaysISO(today, -5),
            transactions: [
                {
                    id: 'TX-9001',
                    amount: 2490000,
                    method: 'BANK_TRANSFER',
                    transactionCode: 'FT26320981234',
                    voucherCode: 'UNC-2026-0812',
                    paidAt: addDaysISO(today, -3),
                    verifyStatus: 'CONFIRMED',
                    verifiedBy: 'Nguyễn Nhật Long',
                    verifiedAt: addDaysISO(today, -3),
                    note: 'Thanh toán đầy đủ gói Pro chu kỳ 1 tháng (18/50 xe)'
                }
            ]
        },
        {
            id: 'INV-1002',
            invoiceCode: 'HD-DV-202611-02',
            tenantId: 'COMPANY_B',
            tenantName: 'Demo CTY B',
            tenantCode: 'CTYB26',
            billingPeriod: `${currentMonth} (1T)`,
            billingMode: 'PER_VEHICLE',
            planName: 'Tính theo đầu xe • Bậc 1 (1–10 xe)',
            durationMonths: 1,
            discountPercent: 0,
            vehicleCount: 10,
            unitPricePerVehicle: 150000,
            totalAmount: 1500000,
            paidAmount: 500000,
            dueDate: addDaysISO(today, 7),
            createdAt: addDaysISO(today, -4),
            transactions: [
                {
                    id: 'TX-9002',
                    amount: 500000,
                    method: 'CASH',
                    transactionCode: 'PT-TM-0045',
                    voucherCode: 'BL-2026-0045',
                    paidAt: addDaysISO(today, -2),
                    verifyStatus: 'CONFIRMED',
                    verifiedBy: 'Nguyễn Nhật Long',
                    verifiedAt: addDaysISO(today, -2),
                    note: 'Tạm ứng tiền mặt đợt 1, còn nợ 1.000.000đ'
                },
                {
                    id: 'TX-9003',
                    amount: 1000000,
                    method: 'BANK_TRANSFER',
                    transactionCode: 'VCB998172635',
                    voucherCode: 'UNC-CTYB-019',
                    paidAt: today,
                    verifyStatus: 'PENDING',
                    note: 'Doanh nghiệp chuyển khoản tất toán phần nợ còn lại, chờ duyệt'
                }
            ]
        },
        {
            id: 'INV-1003',
            invoiceCode: 'HD-DV-202610-03',
            tenantId: 'COMPANY_C',
            tenantName: 'Demo CTY C',
            tenantCode: 'CTYC26',
            billingPeriod: '10/2026 (1T)',
            billingMode: 'PACKAGE',
            planKey: 'STARTER',
            planName: 'Starter (Cơ bản)',
            durationMonths: 1,
            discountPercent: 0,
            vehicleCount: 9,
            includedVehicles: 15,
            overageVehicles: 0,
            overageAmount: 0,
            unitPricePerVehicle: 150000,
            totalAmount: 990000,
            paidAmount: 0,
            dueDate: addDaysISO(today, -6),
            createdAt: addDaysISO(today, -21),
            transactions: []
        }
    ];
};

export default function AdminBillingManagement() {
    const { language } = useLanguage();
    const isVi = language === 'vi';

    const adminName = sessionStorage.getItem('sys_core_admin_name') || 'Nguyễn Nhật Long';

    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus | 'PENDING_VERIFY'>('ALL');
    const [modeFilter, setModeFilter] = useState<'ALL' | BillingMode>('ALL');

    // State Modal Lập kỳ cước mới (theo Gói thuê + Chu kỳ tháng hoặc Đầu xe bậc thang)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [newInvoiceForm, setNewInvoiceForm] = useState<{
        tenantId: string;
        startMonth: string;
        billingMode: BillingMode;
        selectedPackage: PaidPlanKey;
        durationMonths: number;
        vehicleCount: string;
        dueDate: string;
    }>({
        tenantId: '',
        startMonth: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
        billingMode: 'PACKAGE',
        selectedPackage: 'STARTER',
        durationMonths: 1,
        vehicleCount: '5',
        dueDate: addDaysISO(new Date().toISOString().split('T')[0], 10)
    });

    // State Modal Ghi nhận giao dịch thanh toán
    const [payModalInvoice, setPayModalInvoice] = useState<BillingInvoice | null>(null);
    const [payError, setPayError] = useState('');
    const [txForm, setTxForm] = useState<{
        amount: string;
        method: PaymentMethod;
        transactionCode: string;
        voucherCode: string;
        voucherImage: string;
        paidAt: string;
        verifyNow: boolean;
        note: string;
    }>({
        amount: '',
        method: 'BANK_TRANSFER',
        transactionCode: '',
        voucherCode: '',
        voucherImage: '',
        paidAt: new Date().toISOString().split('T')[0],
        verifyNow: true,
        note: ''
    });

    const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);

    const logCoreAudit = (action: string, details: string) => {
        try {
            const newLog: CoreAuditLog = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                time: new Date().toLocaleString('vi-VN'),
                admin: adminName,
                action,
                details
            };
            const rawLogs = localStorage.getItem(AUDIT_STORAGE_KEY);
            const currentLogs: CoreAuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];
            const updatedLogs = [newLog, ...(Array.isArray(currentLogs) ? currentLogs : [])];
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error('Lỗi ghi nhật ký sys_core_audit_logs:', err);
        }
    };

    const loadData = () => {
        try {
            const rawTenants = JSON.parse(localStorage.getItem('sys_tenants') || '[]');
            const tenantList: TenantRecord[] = Array.isArray(rawTenants) ? rawTenants : [];
            setTenants(tenantList);

            const counts: Record<string, number> = {};
            tenantList.forEach((t, idx) => {
                const rawV = localStorage.getItem(`sys_vehicles_${t.id}`);
                if (rawV) {
                    const parsedV = JSON.parse(rawV);
                    counts[t.id] = Array.isArray(parsedV) ? parsedV.length : 0;
                } else {
                    counts[t.id] = idx === 0 ? 18 : idx === 1 ? 4 : 9;
                }
            });
            setVehicleCountMap(counts);

            const rawInvoices = localStorage.getItem('sys_platform_billing');
            if (rawInvoices) {
                const parsedInv = JSON.parse(rawInvoices);
                if (Array.isArray(parsedInv) && parsedInv.length > 0) {
                    setInvoices(parsedInv);
                    return;
                }
            }
            const seeded = buildSeedInvoices();
            localStorage.setItem('sys_platform_billing', JSON.stringify(seeded));
            setInvoices(seeded);
        } catch (err) {
            console.error('Lỗi tải dữ liệu công nợ nền tảng:', err);
            setInvoices(buildSeedInvoices());
        }
    };

    useEffect(() => {
        loadData();
        const onStorage = () => loadData();
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const persistInvoices = (nextInvoices: BillingInvoice[]) => {
        setInvoices(nextInvoices);
        localStorage.setItem('sys_platform_billing', JSON.stringify(nextInvoices));
        window.dispatchEvent(new Event('storage'));
    };

    const handleToggleTenantService = (
        tenantId: string,
        targetStatus: TenantStatus,
        reason?: string
    ) => {
        const targetTenant = tenants.find((t) => t.id === tenantId);
        const updatedTenants = tenants.map((t) =>
            t.id === tenantId ? { ...t, status: targetStatus } : t
        );
        setTenants(updatedTenants);
        localStorage.setItem('sys_tenants', JSON.stringify(updatedTenants));

        const tenantLabel = targetTenant
            ? `${targetTenant.name} (${targetTenant.code})`
            : tenantId;
        const suffix = reason ? ` — ${reason}` : '';

        if (targetStatus === 'SUSPENDED') {
            logCoreAudit('KHÓA DỊCH VỤ', `Khóa dịch vụ doanh nghiệp: ${tenantLabel}${suffix}`);
        } else {
            logCoreAudit('MỞ DỊCH VỤ', `Mở khóa dịch vụ doanh nghiệp: ${tenantLabel}${suffix}`);
        }

        window.dispatchEvent(new Event('storage'));
    };

    const tenantMap = useMemo(() => {
        const map: Record<string, TenantRecord> = {};
        tenants.forEach((t) => {
            map[t.id] = t;
        });
        return map;
    }, [tenants]);

    const kpi = useMemo(() => {
        let totalBilled = 0;
        let totalCollected = 0;
        let totalDebt = 0;
        let overdueCount = 0;
        let pendingVerifyCount = 0;

        invoices.forEach((inv) => {
            totalBilled += inv.totalAmount;
            totalCollected += inv.paidAmount;
            const debt = Math.max(0, inv.totalAmount - inv.paidAmount);
            totalDebt += debt;

            if (computePaymentStatus(inv) === 'OVERDUE') {
                overdueCount += 1;
            }
            const hasPendingTx = inv.transactions.some((tx) => tx.verifyStatus === 'PENDING');
            if (hasPendingTx) {
                pendingVerifyCount += 1;
            }
        });

        return {
            totalBilled,
            totalCollected,
            totalDebt,
            overdueCount,
            pendingVerifyCount
        };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return invoices.filter((inv) => {
            const status = computePaymentStatus(inv);
            const hasPending = inv.transactions.some((tx) => tx.verifyStatus === 'PENDING');

            if (statusFilter === 'PENDING_VERIFY') {
                if (!hasPending) return false;
            } else if (statusFilter !== 'ALL' && status !== statusFilter) {
                return false;
            }

            if (modeFilter !== 'ALL' && inv.billingMode !== modeFilter) {
                return false;
            }

            if (!q) return true;
            const txMatch = inv.transactions.some(
                (tx) =>
                    tx.transactionCode.toLowerCase().includes(q) ||
                    tx.voucherCode.toLowerCase().includes(q)
            );
            return (
                inv.invoiceCode.toLowerCase().includes(q) ||
                inv.tenantName.toLowerCase().includes(q) ||
                inv.tenantCode.toLowerCase().includes(q) ||
                txMatch
            );
        });
    }, [invoices, searchQuery, statusFilter, modeFilter]);

    const detailInvoice = useMemo(
        () => invoices.find((inv) => inv.id === detailInvoiceId) || null,
        [invoices, detailInvoiceId]
    );

    // Mở modal lập kỳ cước & tự đồng bộ gói + số xe thực tế của doanh nghiệp
    const openCreateInvoiceModal = () => {
        const firstTenant = tenants[0];
        const today = new Date().toISOString().split('T')[0];
        const actualVehicles = firstTenant ? vehicleCountMap[firstTenant.id] ?? 5 : 5;
        const initialPkg: PaidPlanKey =
            firstTenant && firstTenant.plan !== 'TRIAL_14D' ? firstTenant.plan : 'STARTER';

        setCreateError('');
        setNewInvoiceForm({
            tenantId: firstTenant?.id || '',
            startMonth: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
            billingMode: 'PACKAGE',
            selectedPackage: initialPkg,
            durationMonths: 1,
            vehicleCount: String(actualVehicles),
            dueDate: addDaysISO(today, 10)
        });
        setIsCreateModalOpen(true);
    };

    const handleSelectTenantInCreate = (selectedId: string) => {
        const target = tenantMap[selectedId];
        const actualVehicles = vehicleCountMap[selectedId] ?? 0;
        const mappedPkg: PaidPlanKey =
            target && target.plan !== 'TRIAL_14D' ? target.plan : 'STARTER';

        setNewInvoiceForm((prev) => ({
            ...prev,
            tenantId: selectedId,
            selectedPackage: mappedPkg,
            vehicleCount: String(actualVehicles)
        }));
    };

    // BÀI TOÁN TÍNH CƯỚC THỰC TẾ (Tự động tính chiết khấu chu kỳ, phụ trội vượt xe, và bậc thang đầu xe)
    const billingCalculation = useMemo(() => {
        const months = newInvoiceForm.durationMonths;
        const durationOpt =
            DURATION_OPTIONS.find((d) => d.months === months) || DURATION_OPTIONS[0];
        const discountRate = durationOpt.discountPercent / 100;
        const vCount = Math.max(0, Number(newInvoiceForm.vehicleCount) || 0);

        if (newInvoiceForm.billingMode === 'PACKAGE') {
            const pkg = PAID_PACKAGES[newInvoiceForm.selectedPackage];
            const baseSubtotal = pkg.monthlyFee * months;
            const discountAmount = Math.round(baseSubtotal * discountRate);
            const packageNetAmount = baseSubtotal - discountAmount;

            const overageVehicles = Math.max(0, vCount - pkg.maxVehicles);
            const overageAmount = overageVehicles * OVERAGE_RATE_PER_VEHICLE * months;
            const totalAmount = packageNetAmount + overageAmount;

            return {
                mode: 'PACKAGE' as BillingMode,
                pkg,
                months,
                discountPercent: durationOpt.discountPercent,
                discountAmount,
                baseSubtotal,
                packageNetAmount,
                vehicleCount: vCount,
                includedVehicles: pkg.maxVehicles,
                overageVehicles,
                overageAmount,
                unitRate: 0,
                tierLabel: '',
                totalAmount
            };
        }

        const { rate, tierLabel } = getPerVehicleTierRate(vCount);
        const baseSubtotal = vCount * rate * months;
        const discountAmount = Math.round(baseSubtotal * discountRate);
        const totalAmount = baseSubtotal - discountAmount;

        return {
            mode: 'PER_VEHICLE' as BillingMode,
            pkg: null,
            months,
            discountPercent: durationOpt.discountPercent,
            discountAmount,
            baseSubtotal,
            packageNetAmount: totalAmount,
            vehicleCount: vCount,
            includedVehicles: vCount,
            overageVehicles: 0,
            overageAmount: 0,
            unitRate: rate,
            tierLabel,
            totalAmount
        };
    }, [newInvoiceForm]);

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        const targetTenant = tenantMap[newInvoiceForm.tenantId];
        if (!targetTenant) {
            setCreateError(
                isVi ? 'Vui lòng chọn doanh nghiệp cần lập kỳ cước.' : 'Please select a tenant.'
            );
            return;
        }
        if (!newInvoiceForm.startMonth.trim()) {
            setCreateError(
                isVi ? 'Vui lòng nhập kỳ bắt đầu (VD: 11/2026).' : 'Please enter start billing period.'
            );
            return;
        }
        if (
            newInvoiceForm.billingMode === 'PER_VEHICLE' &&
            billingCalculation.vehicleCount <= 0
        ) {
            setCreateError(
                isVi
                    ? 'Số lượng phương tiện tính phí phải lớn hơn 0 xe.'
                    : 'Vehicle count must be greater than 0.'
            );
            return;
        }
        if (billingCalculation.totalAmount <= 0) {
            setCreateError(
                isVi
                    ? 'Tổng tiền thanh toán kỳ cước phải lớn hơn 0 VNĐ.'
                    : 'Total invoice amount must be greater than 0.'
            );
            return;
        }
        if (!newInvoiceForm.dueDate) {
            setCreateError(
                isVi ? 'Vui lòng chọn hạn thanh toán.' : 'Please select a due date.'
            );
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const periodLabel = `${newInvoiceForm.startMonth.trim()} (${billingCalculation.months}T)`;

        const created: BillingInvoice = {
            id: `INV-${Date.now()}`,
            invoiceCode: `HD-DV-${Date.now().toString().slice(-6)}`,
            tenantId: targetTenant.id,
            tenantName: targetTenant.name,
            tenantCode: targetTenant.code,
            billingPeriod: periodLabel,
            billingMode: newInvoiceForm.billingMode,
            planKey:
                newInvoiceForm.billingMode === 'PACKAGE'
                    ? newInvoiceForm.selectedPackage
                    : undefined,
            planName:
                newInvoiceForm.billingMode === 'PACKAGE' && billingCalculation.pkg
                    ? billingCalculation.pkg.labelVi
                    : `Tính theo đầu xe • ${billingCalculation.tierLabel}`,
            durationMonths: billingCalculation.months,
            discountPercent: billingCalculation.discountPercent,
            vehicleCount: billingCalculation.vehicleCount,
            includedVehicles: billingCalculation.includedVehicles,
            overageVehicles: billingCalculation.overageVehicles,
            overageAmount: billingCalculation.overageAmount,
            unitPricePerVehicle:
                newInvoiceForm.billingMode === 'PER_VEHICLE'
                    ? billingCalculation.unitRate
                    : OVERAGE_RATE_PER_VEHICLE,
            totalAmount: billingCalculation.totalAmount,
            paidAmount: 0,
            dueDate: newInvoiceForm.dueDate,
            createdAt: today,
            transactions: []
        };

        persistInvoices([created, ...invoices]);

        const basisSummary =
            newInvoiceForm.billingMode === 'PACKAGE'
                ? `Gói ${created.planName}, chu kỳ ${created.durationMonths} tháng, ${created.vehicleCount}/${created.includedVehicles} xe`
                : `${created.vehicleCount} xe × ${created.unitPricePerVehicle.toLocaleString('vi-VN')}đ/xe, chu kỳ ${created.durationMonths} tháng`;

        logCoreAudit(
            'LẬP KỲ CƯỚC',
            `Phát hành hóa đơn ${created.invoiceCode} (${basisSummary}) cho ${targetTenant.name} (${targetTenant.code}) — Tổng: ${created.totalAmount.toLocaleString('vi-VN')} ₫`
        );
        setIsCreateModalOpen(false);
    };

    const openRecordPaymentModal = (invoice: BillingInvoice) => {
        const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
        const today = new Date().toISOString().split('T')[0];
        setPayModalInvoice(invoice);
        setPayError('');
        setTxForm({
            amount: remaining > 0 ? String(remaining) : '',
            method: 'BANK_TRANSFER',
            transactionCode: '',
            voucherCode: `CT-${Date.now().toString().slice(-5)}`,
            voucherImage: '',
            paidAt: today,
            verifyNow: true,
            note: ''
        });
    };

    const handleVoucherImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setTxForm((prev) => ({ ...prev, voucherImage: reader.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSavePaymentTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModalInvoice) return;

        const amountNum = Number(txForm.amount) || 0;
        const remaining = Math.max(0, payModalInvoice.totalAmount - payModalInvoice.paidAmount);

        if (amountNum <= 0) {
            setPayError(
                isVi ? 'Số tiền thanh toán phải lớn hơn 0 VNĐ.' : 'Payment amount must be greater than 0.'
            );
            return;
        }
        if (amountNum > remaining) {
            setPayError(
                isVi
                    ? `Số tiền nhập (${amountNum.toLocaleString('vi-VN')}đ) vượt quá công nợ còn lại (${remaining.toLocaleString('vi-VN')}đ).`
                    : 'Payment amount exceeds remaining balance.'
            );
            return;
        }
        if (!txForm.transactionCode.trim()) {
            setPayError(
                isVi
                    ? txForm.method === 'BANK_TRANSFER'
                        ? 'Vui lòng nhập mã giao dịch ngân hàng.'
                        : 'Vui lòng nhập mã phiếu thu tiền mặt.'
                    : 'Please enter transaction or receipt code.'
            );
            return;
        }
        if (!txForm.voucherCode.trim()) {
            setPayError(
                isVi ? 'Vui lòng nhập số chứng từ / biên lai đối soát.' : 'Please enter voucher code.'
            );
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newTx: PaymentTransaction = {
            id: `TX-${Date.now().toString().slice(-6)}`,
            amount: amountNum,
            method: txForm.method,
            transactionCode: txForm.transactionCode.trim().toUpperCase(),
            voucherCode: txForm.voucherCode.trim().toUpperCase(),
            voucherImage: txForm.voucherImage || undefined,
            paidAt: txForm.paidAt || today,
            verifyStatus: txForm.verifyNow ? 'CONFIRMED' : 'PENDING',
            verifiedBy: txForm.verifyNow ? adminName : undefined,
            verifiedAt: txForm.verifyNow ? today : undefined,
            note: txForm.note.trim()
        };

        const nextPaidAmount = txForm.verifyNow
            ? payModalInvoice.paidAmount + amountNum
            : payModalInvoice.paidAmount;

        const updatedInvoices = invoices.map((inv) =>
            inv.id === payModalInvoice.id
                ? {
                    ...inv,
                    paidAmount: nextPaidAmount,
                    transactions: [newTx, ...inv.transactions]
                }
                : inv
        );

        persistInvoices(updatedInvoices);

        const methodText = txForm.method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt';
        if (txForm.verifyNow) {
            logCoreAudit(
                'XÁC NHẬN TT',
                `Thu & xác nhận thanh toán ${amountNum.toLocaleString('vi-VN')} ₫ (${methodText}, Mã GD: ${newTx.transactionCode}, CT: ${newTx.voucherCode}) cho ${payModalInvoice.tenantName} (${payModalInvoice.invoiceCode})`
            );
        } else {
            logCoreAudit(
                'THANH TOÁN',
                `Ghi nhận giao dịch chờ duyệt ${amountNum.toLocaleString('vi-VN')} ₫ (${methodText}, Mã GD: ${newTx.transactionCode}) cho ${payModalInvoice.tenantName} (${payModalInvoice.invoiceCode})`
            );
        }

        if (
            txForm.verifyNow &&
            nextPaidAmount >= payModalInvoice.totalAmount &&
            tenantMap[payModalInvoice.tenantId]?.status === 'SUSPENDED'
        ) {
            handleToggleTenantService(
                payModalInvoice.tenantId,
                'ACTIVE',
                `Tự động mở khóa sau khi tất toán đủ ${payModalInvoice.invoiceCode}`
            );
        }

        setPayModalInvoice(null);
    };

    const handleConfirmPendingTransaction = (invoiceId: string, txId: string) => {
        const today = new Date().toISOString().split('T')[0];
        let unlockedTenantId: string | null = null;
        let unlockedInvoiceCode = '';
        let confirmedLogDetail = '';

        const updated = invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            let addedPaid = 0;
            const nextTxs = inv.transactions.map((tx) => {
                if (tx.id === txId && tx.verifyStatus === 'PENDING') {
                    addedPaid += tx.amount;
                    const methodText = tx.method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt';
                    confirmedLogDetail = `Xác nhận thanh toán ${tx.amount.toLocaleString('vi-VN')} ₫ (${methodText}, Mã GD: ${tx.transactionCode}, CT: ${tx.voucherCode}) cho ${inv.tenantName} (${inv.invoiceCode})`;
                    return {
                        ...tx,
                        verifyStatus: 'CONFIRMED' as TxVerifyStatus,
                        verifiedBy: adminName,
                        verifiedAt: today
                    };
                }
                return tx;
            });
            const nextPaidTotal = Math.min(inv.totalAmount, inv.paidAmount + addedPaid);
            if (
                nextPaidTotal >= inv.totalAmount &&
                tenantMap[inv.tenantId]?.status === 'SUSPENDED'
            ) {
                unlockedTenantId = inv.tenantId;
                unlockedInvoiceCode = inv.invoiceCode;
            }
            return {
                ...inv,
                paidAmount: nextPaidTotal,
                transactions: nextTxs
            };
        });

        persistInvoices(updated);
        if (confirmedLogDetail) {
            logCoreAudit('XÁC NHẬN TT', confirmedLogDetail);
        }
        if (unlockedTenantId) {
            handleToggleTenantService(
                unlockedTenantId,
                'ACTIVE',
                `Tự động mở khóa sau khi tất toán đủ ${unlockedInvoiceCode}`
            );
        }
    };

    const renderPaymentStatusBadge = (status: PaymentStatus) => {
        if (status === 'PAID') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID
                </span>
            );
        }
        if (status === 'OVERDUE') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    OVERDUE
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                UNPAID
            </span>
        );
    };

    return (
        <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6 space-y-6">
            {/* HEADER TRANG */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                            {isVi
                                ? 'SYSTEM ADMIN • TÀI CHÍNH NỀN TẢNG'
                                : 'SYSTEM ADMIN • PLATFORM BILLING'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isVi
                            ? 'Quản lý Công nợ & Thanh toán Dịch vụ'
                            : 'Billing, Debt & Payment Management'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {isVi
                            ? 'Tính cước tự động theo gói thuê (1/3/6/12 tháng) kèm phụ trội vượt hạn mức xe hoặc theo quy mô đội xe bậc thang; theo dõi công nợ và khóa/mở dịch vụ.'
                            : 'Calculate fees by subscription plan & rental cycle or tiered fleet size, manage receivables, and lock/unlock tenant services.'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateInvoiceModal}
                    className="px-4 py-2.5 bg-[#0EA5E9] hover:bg-sky-600 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>{isVi ? 'Lập kỳ cước / Hóa đơn' : 'Create Billing Invoice'}</span>
                </button>
            </div>

            {/* 4 THẺ KPI CÔNG NỢ & DOANH THU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isVi ? 'Tổng phải thanh toán' : 'Total Billed'}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Receipt className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                        {kpi.totalBilled.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                        {isVi
                            ? `Tổng phát sinh trên ${invoices.length} kỳ hóa đơn`
                            : `Across ${invoices.length} billing invoices`}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isVi ? 'Đã xác nhận thu' : 'Confirmed Paid'}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 font-mono">
                        {kpi.totalCollected.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                        {isVi
                            ? `Tỷ lệ thu hồi: ${kpi.totalBilled > 0
                                ? Math.round((kpi.totalCollected / kpi.totalBilled) * 100)
                                : 0
                            }%`
                            : 'Collection rate'}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isVi ? 'Công nợ còn lại' : 'Remaining Debt'}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 font-mono">
                        {kpi.totalDebt.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                        {isVi
                            ? `${kpi.pendingVerifyCount} hóa đơn có chứng từ chờ xác nhận`
                            : `${kpi.pendingVerifyCount} invoices pending verification`}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isVi ? 'Công nợ quá hạn (OVERDUE)' : 'Overdue Invoices'}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-rose-600 font-mono">
                        {kpi.overdueCount}{' '}
                        <span className="text-sm font-sans font-semibold text-slate-600">
                            {isVi ? 'hóa đơn' : 'invoices'}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                        {isVi
                            ? 'Cần đôn đốc thanh toán hoặc tạm khóa dịch vụ'
                            : 'Requires collection or service suspension'}
                    </p>
                </div>
            </div>

            {/* THANH LỌC TRẠNG THÁI THANH TOÁN & HÌNH THỨC TÍNH PHÍ */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {(
                        [
                            { key: 'ALL', label: isVi ? 'Tất cả' : 'All' },
                            { key: 'PAID', label: 'PAID' },
                            { key: 'UNPAID', label: 'UNPAID' },
                            { key: 'OVERDUE', label: 'OVERDUE' },
                            {
                                key: 'PENDING_VERIFY',
                                label: isVi
                                    ? `Chờ xác nhận (${kpi.pendingVerifyCount})`
                                    : `Pending (${kpi.pendingVerifyCount})`
                            }
                        ] as const
                    ).map((tab) => {
                        const active = statusFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${active
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial justify-end">
                    <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value as 'ALL' | BillingMode)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-sky-500"
                    >
                        <option value="ALL">
                            {isVi ? 'Tất cả cách tính phí' : 'All Billing Modes'}
                        </option>
                        <option value="PACKAGE">
                            {isVi ? 'Tính theo gói dịch vụ' : 'Subscription Package'}
                        </option>
                        <option value="PER_VEHICLE">
                            {isVi ? 'Tính theo số lượng phương tiện' : 'Per-Vehicle Count'}
                        </option>
                    </select>

                    <div className="relative min-w-[250px] flex-1 sm:flex-initial">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                isVi
                                    ? 'Tìm mã HĐ, doanh nghiệp, mã giao dịch...'
                                    : 'Search invoice, tenant, transaction ID...'
                            }
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-sky-500"
                        />
                    </div>
                </div>
            </div>

            {/* BẢNG QUẢN LÝ CÔNG NỢ & THANH TOÁN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-3.5 px-4">
                                    {isVi ? 'Mã kỳ cước & Doanh nghiệp' : 'Invoice & Tenant'}
                                </th>
                                <th className="py-3.5 px-4">
                                    {isVi ? 'Gói thuê & Cơ sở tính phí' : 'Plan & Billing Basis'}
                                </th>
                                <th className="py-3.5 px-4">
                                    {isVi ? 'Tổng tiền / Đã trả / Còn nợ' : 'Total / Paid / Debt'}
                                </th>
                                <th className="py-3.5 px-4">
                                    {isVi ? 'Trạng thái & Hạn TT' : 'Status & Due Date'}
                                </th>
                                <th className="py-3.5 px-4">
                                    {isVi ? 'Giao dịch & Chứng từ' : 'Transactions & Vouchers'}
                                </th>
                                <th className="py-3.5 px-4 text-right">
                                    {isVi ? 'Xác nhận & Khóa/Mở DV' : 'Actions & Service Lock'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                                        {isVi
                                            ? 'Không có dữ liệu công nợ phù hợp với bộ lọc.'
                                            : 'No billing records match your filter.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => {
                                    const status = computePaymentStatus(inv);
                                    const remainingDebt = Math.max(0, inv.totalAmount - inv.paidAmount);
                                    const tenantInfo = tenantMap[inv.tenantId];
                                    const isServiceSuspended = tenantInfo?.status === 'SUSPENDED';
                                    const pendingTxs = inv.transactions.filter(
                                        (tx) => tx.verifyStatus === 'PENDING'
                                    );
                                    const months = inv.durationMonths || 1;
                                    const overageCars = inv.overageVehicles || 0;

                                    return (
                                        <tr
                                            key={inv.id}
                                            className="hover:bg-slate-50/80 transition-colors align-top"
                                        >
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="font-mono text-xs font-bold text-sky-700">
                                                    {inv.invoiceCode}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-1">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{inv.tenantName}</span>
                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
                                                        {inv.tenantCode}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1">
                                                    {isVi ? 'Kỳ cước:' : 'Period:'}{' '}
                                                    <strong className="font-mono text-slate-700">
                                                        {inv.billingPeriod}
                                                    </strong>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {inv.billingMode === 'PACKAGE' ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                                                                <Sparkles className="w-3 h-3" />
                                                                {inv.planName}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                                                {months}T
                                                            </span>
                                                            {(inv.discountPercent || 0) > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                                    -{inv.discountPercent}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-mono">
                                                            Quy mô: {inv.vehicleCount} / {inv.includedVehicles || 50} xe
                                                            {overageCars > 0 && (
                                                                <span className="ml-1.5 text-amber-700 font-bold">
                                                                    (+{overageCars} xe vượt: +
                                                                    {(inv.overageAmount || 0).toLocaleString('vi-VN')}₫)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold">
                                                                <Car className="w-3 h-3" />
                                                                {isVi ? 'Theo đầu xe' : 'Per Vehicle'}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                                                {months}T
                                                            </span>
                                                            {(inv.discountPercent || 0) > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                                    -{inv.discountPercent}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-mono font-semibold text-slate-700">
                                                            {inv.vehicleCount} xe ×{' '}
                                                            {inv.unitPricePerVehicle.toLocaleString('vi-VN')} ₫/tháng
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 whitespace-nowrap font-mono text-xs space-y-1">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-sans text-slate-500">
                                                        {isVi ? 'Phải trả:' : 'Total:'}
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {inv.totalAmount.toLocaleString('vi-VN')} ₫
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-sans text-slate-500">
                                                        {isVi ? 'Đã trả:' : 'Paid:'}
                                                    </span>
                                                    <span className="font-bold text-emerald-700">
                                                        {inv.paidAmount.toLocaleString('vi-VN')} ₫
                                                    </span>
                                                </div>
                                                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4">
                                                    <span className="font-sans font-semibold text-slate-600">
                                                        {isVi ? 'Còn nợ:' : 'Debt:'}
                                                    </span>
                                                    <span
                                                        className={`font-bold ${remainingDebt > 0 ? 'text-rose-600' : 'text-slate-400'
                                                            }`}
                                                    >
                                                        {remainingDebt.toLocaleString('vi-VN')} ₫
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div>{renderPaymentStatusBadge(status)}</div>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <span>
                                                        {isVi ? 'Hạn:' : 'Due:'}{' '}
                                                        <strong className="font-mono text-slate-700">
                                                            {formatDateVN(inv.dueDate)}
                                                        </strong>
                                                    </span>
                                                </div>
                                                <div className="mt-1.5">
                                                    {isServiceSuspended ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                            <Lock className="w-2.5 h-2.5" />
                                                            {isVi ? 'Dịch vụ đang khóa' : 'Service Locked'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            <Unlock className="w-2.5 h-2.5" />
                                                            {isVi ? 'Dịch vụ đang mở' : 'Service Active'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                {inv.transactions.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic">
                                                        {isVi ? 'Chưa có giao dịch' : 'No transactions'}
                                                    </span>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <div className="text-xs font-semibold text-slate-700">
                                                            {inv.transactions.length}{' '}
                                                            {isVi ? 'giao dịch ghi nhận' : 'recorded tx'}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-slate-500">
                                                            {isVi ? 'Mới nhất:' : 'Latest:'}{' '}
                                                            <span className="font-bold text-slate-700">
                                                                {inv.transactions[0].transactionCode}
                                                            </span>
                                                        </div>
                                                        {pendingTxs.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleConfirmPendingTransaction(inv.id, pendingTxs[0].id)
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                                            >
                                                                <FileCheck2 className="w-3 h-3" />
                                                                <span>
                                                                    {isVi
                                                                        ? `Xác nhận TT (${pendingTxs[0].amount.toLocaleString('vi-VN')}đ)`
                                                                        : 'Confirm Payment'}
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 whitespace-nowrap text-right">
                                                <div className="inline-flex flex-col items-end gap-1.5">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {remainingDebt > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openRecordPaymentModal(inv)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" />
                                                                <span>{isVi ? 'Thu tiền' : 'Record Pay'}</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setDetailInvoiceId(inv.id)}
                                                            title={
                                                                isVi
                                                                    ? 'Xem chứng từ & Lịch sử xác nhận'
                                                                    : 'View Vouchers & History'
                                                            }
                                                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>{isVi ? 'Chứng từ' : 'Vouchers'}</span>
                                                        </button>
                                                    </div>

                                                    {tenantInfo && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleTenantService(
                                                                    inv.tenantId,
                                                                    isServiceSuspended ? 'ACTIVE' : 'SUSPENDED',
                                                                    `Thao tác từ kỳ cước ${inv.invoiceCode}`
                                                                )
                                                            }
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-colors cursor-pointer ${isServiceSuspended
                                                                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                                                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                                                }`}
                                                        >
                                                            {isServiceSuspended ? (
                                                                <>
                                                                    <Unlock className="w-3 h-3" />
                                                                    <span>
                                                                        {isVi ? 'Mở khóa dịch vụ' : 'Unlock Service'}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock className="w-3 h-3" />
                                                                    <span>
                                                                        {isVi ? 'Khóa dịch vụ DN' : 'Lock Service'}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
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

            {/* MODAL 1: LẬP KỲ CƯỚC / HÓA ĐƠN MỚI (CHỌN GÓI THUÊ 1/3/6/12 THÁNG & TÍNH XE THỰC TẾ) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isVi ? 'Lập kỳ cước thanh toán mới' : 'Create New Billing Invoice'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isVi
                                        ? 'Tự động đồng bộ quy mô đội xe thực tế và áp dụng chiết khấu theo chu kỳ thuê.'
                                        : 'Auto-sync fleet size and apply rental duration discounts.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-4">
                            {createError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            {/* Doanh nghiệp + Kỳ bắt đầu + Hạn thanh toán */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Doanh nghiệp áp dụng' : 'Select Tenant'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={newInvoiceForm.tenantId}
                                        onChange={(e) => handleSelectTenantInCreate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:border-sky-500"
                                    >
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.code}) • {vehicleCountMap[t.id] || 0} xe thực tế
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Kỳ bắt đầu' : 'Start Period'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newInvoiceForm.startMonth}
                                        onChange={(e) =>
                                            setNewInvoiceForm((prev) => ({
                                                ...prev,
                                                startMonth: e.target.value
                                            }))
                                        }
                                        placeholder="11/2026"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Hạn thanh toán' : 'Due Date'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newInvoiceForm.dueDate}
                                        onChange={(e) =>
                                            setNewInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            {/* Chọn Phương thức tính phí dịch vụ */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {isVi ? 'Phương thức tính phí dịch vụ' : 'Billing Calculation Mode'}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNewInvoiceForm((prev) => ({ ...prev, billingMode: 'PACKAGE' }))
                                        }
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newInvoiceForm.billingMode === 'PACKAGE'
                                                ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="text-xs font-bold text-slate-900">
                                            {isVi
                                                ? '1. Theo gói thuê & Chu kỳ tháng'
                                                : '1. By Subscription Package'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {isVi
                                                ? 'Chọn gói Starter/Pro/Enterprise + tự tính phụ trội nếu vượt hạn mức xe'
                                                : 'Fixed package + overage if fleet exceeds plan limit'}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNewInvoiceForm((prev) => ({
                                                ...prev,
                                                billingMode: 'PER_VEHICLE'
                                            }))
                                        }
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${newInvoiceForm.billingMode === 'PER_VEHICLE'
                                                ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="text-xs font-bold text-slate-900">
                                            {isVi
                                                ? '2. Theo số lượng xe thực tế (Bậc thang)'
                                                : '2. By Tiered Fleet Size'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {isVi
                                                ? '1–10 xe: 150k • 11–30 xe: 130k • >30 xe: 110k/xe/tháng'
                                                : 'Tiered per-vehicle monthly rate'}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* CHỌN GÓI DỊCH VỤ (KHI Ở CHẾ ĐỘ PACKAGE) */}
                            {newInvoiceForm.billingMode === 'PACKAGE' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        {isVi ? 'Chọn gói dịch vụ đăng ký' : 'Select Subscription Plan'}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {(Object.values(PAID_PACKAGES) as PaidPackageSpec[]).map((pkg) => {
                                            const active = newInvoiceForm.selectedPackage === pkg.key;
                                            return (
                                                <button
                                                    key={pkg.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setNewInvoiceForm((prev) => ({
                                                            ...prev,
                                                            selectedPackage: pkg.key
                                                        }))
                                                    }
                                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${active
                                                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-900">
                                                        {isVi ? pkg.labelVi : pkg.labelEn}
                                                    </div>
                                                    <div className="text-xs font-mono font-bold text-indigo-700 mt-1">
                                                        {pkg.monthlyFee.toLocaleString('vi-VN')} ₫/tháng
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {isVi
                                                            ? `Hạn mức tối đa ${pkg.maxVehicles} xe`
                                                            : `Up to ${pkg.maxVehicles} vehicles`}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* CHỌN CHU KỲ THUÊ (1 THÁNG, 3 THÁNG, 6 THÁNG, 12 THÁNG) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {isVi
                                        ? 'Chọn chu kỳ thuê dịch vụ (tự động áp dụng chiết khấu)'
                                        : 'Select Rental Duration'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DURATION_OPTIONS.map((opt) => {
                                        const selected = newInvoiceForm.durationMonths === opt.months;
                                        return (
                                            <button
                                                key={opt.months}
                                                type="button"
                                                onClick={() =>
                                                    setNewInvoiceForm((prev) => ({
                                                        ...prev,
                                                        durationMonths: opt.months
                                                    }))
                                                }
                                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${selected
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="text-xs font-bold">
                                                    {isVi ? opt.labelVi : opt.labelEn}
                                                </div>
                                                <div
                                                    className={`text-[10px] font-bold mt-0.5 ${selected
                                                            ? 'text-emerald-300'
                                                            : opt.discountPercent > 0
                                                                ? 'text-emerald-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                >
                                                    {opt.discountPercent > 0
                                                        ? `Giảm ${opt.discountPercent}%`
                                                        : 'Nguyên giá'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ĐỐI SOÁT SỐ LƯỢNG XE THỰC TẾ */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Car className="w-4 h-4 text-indigo-600" />
                                        <span>
                                            {isVi
                                                ? 'Số lượng phương tiện chốt đối soát kỳ này'
                                                : 'Reconciled Fleet Size'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {isVi
                                            ? `Hệ thống ghi nhận ${vehicleCountMap[newInvoiceForm.tenantId] ?? 0
                                            } xe đang đăng ký trong đội xe của doanh nghiệp.`
                                            : 'Synced from tenant registered vehicles.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={newInvoiceForm.vehicleCount}
                                        onChange={(e) =>
                                            setNewInvoiceForm((prev) => ({
                                                ...prev,
                                                vehicleCount: e.target.value.replace(/\D/g, '').slice(0, 4)
                                            }))
                                        }
                                        className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-right text-slate-900 outline-none focus:border-sky-500"
                                    />
                                    <span className="text-xs font-bold text-slate-600">xe</span>
                                </div>
                            </div>

                            {/* BẢNG PHÂN TÍCH CÔNG THỨC TÍNH TIỀN MINH BẠCH */}
                            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                                <div className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
                                    <Calculator className="w-3.5 h-3.5" />
                                    <span>Diễn giải bài toán thanh toán kỳ cước</span>
                                </div>

                                {billingCalculation.mode === 'PACKAGE' && billingCalculation.pkg ? (
                                    <div className="space-y-1.5 text-slate-300 border-b border-slate-700/80 pb-2.5">
                                        <div className="flex justify-between">
                                            <span>
                                                Phí gói {billingCalculation.pkg.labelVi} (
                                                {billingCalculation.pkg.monthlyFee.toLocaleString('vi-VN')}đ ×{' '}
                                                {billingCalculation.months} tháng):
                                            </span>
                                            <span className="font-mono">
                                                {billingCalculation.baseSubtotal.toLocaleString('vi-VN')} ₫
                                            </span>
                                        </div>

                                        {billingCalculation.discountAmount > 0 && (
                                            <div className="flex justify-between text-emerald-400">
                                                <span>
                                                    Chiết khấu chu kỳ {billingCalculation.months} tháng (-
                                                    {billingCalculation.discountPercent}%):
                                                </span>
                                                <span className="font-mono">
                                                    -{billingCalculation.discountAmount.toLocaleString('vi-VN')} ₫
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span>
                                                Kiểm tra hạn mức xe ({billingCalculation.vehicleCount} /{' '}
                                                {billingCalculation.includedVehicles} xe):
                                            </span>
                                            {billingCalculation.overageVehicles > 0 ? (
                                                <span className="font-mono text-amber-400">
                                                    Vượt {billingCalculation.overageVehicles} xe × 120.000đ ×{' '}
                                                    {billingCalculation.months}T = +
                                                    {billingCalculation.overageAmount.toLocaleString('vi-VN')} ₫
                                                </span>
                                            ) : (
                                                <span className="text-emerald-400 font-semibold">
                                                    Trong hạn mức (0 ₫ phụ trội)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 text-slate-300 border-b border-slate-700/80 pb-2.5">
                                        <div className="flex justify-between">
                                            <span>
                                                Áp dụng {billingCalculation.tierLabel} (
                                                {billingCalculation.vehicleCount} xe ×{' '}
                                                {billingCalculation.unitRate.toLocaleString('vi-VN')}đ ×{' '}
                                                {billingCalculation.months} tháng):
                                            </span>
                                            <span className="font-mono">
                                                {billingCalculation.baseSubtotal.toLocaleString('vi-VN')} ₫
                                            </span>
                                        </div>

                                        {billingCalculation.discountAmount > 0 && (
                                            <div className="flex justify-between text-emerald-400">
                                                <span>
                                                    Chiết khấu chu kỳ {billingCalculation.months} tháng (-
                                                    {billingCalculation.discountPercent}%):
                                                </span>
                                                <span className="font-mono">
                                                    -{billingCalculation.discountAmount.toLocaleString('vi-VN')} ₫
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-0.5">
                                    <span className="font-bold text-slate-200">
                                        {isVi ? 'Tổng tiền phải thanh toán:' : 'Total Amount Due:'}
                                    </span>
                                    <span className="text-lg font-mono font-bold text-emerald-400">
                                        {billingCalculation.totalAmount.toLocaleString('vi-VN')} ₫
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    {isVi ? 'Hủy' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#0EA5E9] hover:bg-sky-600 text-white text-xs font-bold cursor-pointer"
                                >
                                    {isVi ? 'Phát hành kỳ cước' : 'Issue Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: GHI NHẬN GIAO DỊCH THANH TOÁN */}
            {payModalInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isVi ? 'Ghi nhận giao dịch thanh toán' : 'Record Payment Transaction'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {payModalInvoice.invoiceCode} • {payModalInvoice.tenantName} (Còn nợ:{' '}
                                    <strong className="text-rose-600 font-mono">
                                        {Math.max(
                                            0,
                                            payModalInvoice.totalAmount - payModalInvoice.paidAmount
                                        ).toLocaleString('vi-VN')}{' '}
                                        ₫
                                    </strong>
                                    )
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPayModalInvoice(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSavePaymentTransaction}
                            className="p-6 overflow-y-auto space-y-4"
                        >
                            {payError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{payError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {isVi ? 'Hình thức thanh toán' : 'Payment Method'}
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTxForm((prev) => ({ ...prev, method: 'BANK_TRANSFER' }))
                                        }
                                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer ${txForm.method === 'BANK_TRANSFER'
                                                ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">
                                                {isVi ? 'Chuyển khoản' : 'Bank Transfer'}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Internet Banking / QR
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTxForm((prev) => ({ ...prev, method: 'CASH' }))}
                                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer ${txForm.method === 'CASH'
                                                ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">
                                                {isVi ? 'Tiền mặt' : 'Cash'}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {isVi ? 'Thu trực tiếp tại VP' : 'Direct cash receipt'}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Số tiền thanh toán (₫)' : 'Amount (₫)'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={txForm.amount}
                                        onChange={(e) => {
                                            setTxForm((prev) => ({
                                                ...prev,
                                                amount: e.target.value.replace(/\D/g, '').slice(0, 10)
                                            }));
                                            if (payError) setPayError('');
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-emerald-700 outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Ngày giao dịch' : 'Transaction Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={txForm.paidAt}
                                        onChange={(e) =>
                                            setTxForm((prev) => ({ ...prev, paidAt: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {txForm.method === 'BANK_TRANSFER'
                                            ? isVi
                                                ? 'Mã giao dịch ngân hàng'
                                                : 'Bank Transaction ID'
                                            : isVi
                                                ? 'Mã phiếu thu tiền mặt'
                                                : 'Cash Receipt ID'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={txForm.transactionCode}
                                        onChange={(e) => {
                                            setTxForm((prev) => ({
                                                ...prev,
                                                transactionCode: e.target.value.toUpperCase()
                                            }));
                                            if (payError) setPayError('');
                                        }}
                                        placeholder={
                                            txForm.method === 'BANK_TRANSFER' ? 'VD: FT263209812' : 'VD: PT-TM-012'
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Số chứng từ / Biên lai' : 'Voucher / Receipt No.'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={txForm.voucherCode}
                                        onChange={(e) => {
                                            setTxForm((prev) => ({
                                                ...prev,
                                                voucherCode: e.target.value.toUpperCase()
                                            }));
                                            if (payError) setPayError('');
                                        }}
                                        placeholder="UNC-2026-001"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {isVi
                                        ? 'Đính kèm ảnh chứng từ / Ủy nhiệm chi (tùy chọn)'
                                        : 'Attach Voucher Image (optional)'}
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="px-3.5 py-2 rounded-lg border border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                                        <span>{isVi ? 'Chọn ảnh chứng từ...' : 'Choose image...'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleVoucherImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    {txForm.voucherImage && (
                                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {isVi ? 'Đã tải ảnh chứng từ' : 'Image attached'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {isVi ? 'Ghi chú đối soát' : 'Reconciliation Note'}
                                </label>
                                <input
                                    type="text"
                                    value={txForm.note}
                                    onChange={(e) =>
                                        setTxForm((prev) => ({ ...prev, note: e.target.value }))
                                    }
                                    placeholder={
                                        isVi
                                            ? 'VD: Đã đối chiếu sao kê ngân hàng Vietcombank...'
                                            : 'Bank statement verified...'
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-sky-500"
                                />
                            </div>

                            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={txForm.verifyNow}
                                    onChange={(e) =>
                                        setTxForm((prev) => ({ ...prev, verifyNow: e.target.checked }))
                                    }
                                    className="w-4 h-4 accent-emerald-600"
                                />
                                <span className="text-xs font-semibold text-emerald-900">
                                    {isVi
                                        ? 'Xác nhận thanh toán hợp lệ ngay (cộng trực tiếp vào số tiền đã thanh toán và tự mở khóa dịch vụ nếu hết nợ)'
                                        : 'Confirm payment immediately (deduct debt & unlock service if paid in full)'}
                                </span>
                            </label>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPayModalInvoice(null)}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    {isVi ? 'Hủy' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <FileCheck2 className="w-4 h-4" />
                                    <span>
                                        {txForm.verifyNow
                                            ? isVi
                                                ? 'Lưu & Xác nhận thanh toán'
                                                : 'Save & Confirm'
                                            : isVi
                                                ? 'Lưu chờ xác nhận'
                                                : 'Save as Pending'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: XEM CHI TIẾT CHỨNG TỪ & XÁC NHẬN THANH TOÁN */}
            {detailInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isVi ? 'Chi tiết Công nợ & Chứng từ' : 'Invoice Vouchers & History'} •{' '}
                                    <span className="font-mono text-sky-700">{detailInvoice.invoiceCode}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {detailInvoice.tenantName} ({detailInvoice.tenantCode}) • Kỳ{' '}
                                    {detailInvoice.billingPeriod}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailInvoiceId(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase">
                                        {isVi ? 'Tổng phải trả' : 'Total Due'}
                                    </div>
                                    <div className="text-base font-mono font-bold text-slate-900 mt-1">
                                        {detailInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                    <div className="text-[11px] font-bold text-emerald-700 uppercase">
                                        {isVi ? 'Đã xác nhận' : 'Confirmed Paid'}
                                    </div>
                                    <div className="text-base font-mono font-bold text-emerald-700 mt-1">
                                        {detailInvoice.paidAmount.toLocaleString('vi-VN')} ₫
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                                    <div className="text-[11px] font-bold text-rose-700 uppercase">
                                        {isVi ? 'Công nợ còn lại' : 'Remaining Debt'}
                                    </div>
                                    <div className="text-base font-mono font-bold text-rose-700 mt-1">
                                        {Math.max(
                                            0,
                                            detailInvoice.totalAmount - detailInvoice.paidAmount
                                        ).toLocaleString('vi-VN')}{' '}
                                        ₫
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                    {isVi
                                        ? `Lịch sử giao dịch & chứng từ (${detailInvoice.transactions.length})`
                                        : `Payment Transactions (${detailInvoice.transactions.length})`}
                                </h4>

                                {detailInvoice.transactions.length === 0 ? (
                                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                                        {isVi
                                            ? 'Chưa có giao dịch thanh toán nào được ghi nhận cho kỳ cước này.'
                                            : 'No transactions recorded yet.'}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {detailInvoice.transactions.map((tx) => (
                                            <div
                                                key={tx.id}
                                                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {tx.method === 'BANK_TRANSFER' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                                                                <CreditCard className="w-3 h-3" />
                                                                {isVi ? 'Chuyển khoản' : 'Bank Transfer'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                                                <Banknote className="w-3 h-3" />
                                                                {isVi ? 'Tiền mặt' : 'Cash'}
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-mono font-bold text-slate-900">
                                                            +{tx.amount.toLocaleString('vi-VN')} ₫
                                                        </span>
                                                    </div>

                                                    {tx.verifyStatus === 'CONFIRMED' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            {isVi ? 'Đã xác nhận' : 'Confirmed'}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleConfirmPendingTransaction(detailInvoice.id, tx.id)
                                                            }
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
                                                        >
                                                            <FileCheck2 className="w-3.5 h-3.5" />
                                                            <span>
                                                                {isVi ? 'Xác nhận thanh toán này' : 'Confirm This Payment'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                                                    <div>
                                                        <span className="text-slate-400">Mã GD: </span>
                                                        <strong className="font-mono text-slate-800">
                                                            {tx.transactionCode}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Chứng từ: </span>
                                                        <strong className="font-mono text-slate-800">
                                                            {tx.voucherCode}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Ngày TT: </span>
                                                        <strong className="font-mono text-slate-800">
                                                            {formatDateVN(tx.paidAt)}
                                                        </strong>
                                                    </div>
                                                </div>

                                                {tx.note && (
                                                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                        <span>{tx.note}</span>
                                                    </div>
                                                )}

                                                {tx.verifiedBy && (
                                                    <div className="text-[11px] text-emerald-700 font-medium">
                                                        {isVi
                                                            ? `Người xác nhận: ${tx.verifiedBy} (${formatDateVN(tx.verifiedAt)})`
                                                            : `Verified by: ${tx.verifiedBy}`}
                                                    </div>
                                                )}

                                                {tx.voucherImage && (
                                                    <div className="pt-1">
                                                        <img
                                                            src={tx.voucherImage}
                                                            alt={tx.voucherCode}
                                                            className="max-h-48 rounded-lg border border-slate-200 object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            {Math.max(0, detailInvoice.totalAmount - detailInvoice.paidAmount) > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = detailInvoice;
                                        setDetailInvoiceId(null);
                                        openRecordPaymentModal(target);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isVi ? 'Ghi nhận thanh toán mới' : 'Record New Payment'}</span>
                                </button>
                            ) : (
                                <span />
                            )}

                            <button
                                type="button"
                                onClick={() => setDetailInvoiceId(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                {isVi ? 'Đóng' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}