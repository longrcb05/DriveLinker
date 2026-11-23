import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, Plus, Search, CheckCircle2, Clock, AlertTriangle, Lock, Unlock, CreditCard, Banknote, Building2, Car, FileCheck2, Eye, X, AlertCircle, ShieldCheck, Wallet, Calendar, FileText, Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { TenantRecord, TenantStatus, SubscriptionPlan } from './AdminTenantList';

export type PaymentStatus = 'PAID' | 'UNPAID' | 'OVERDUE';
export type BillingMode = 'PACKAGE' | 'PER_VEHICLE';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH';
export type TxVerifyStatus = 'CONFIRMED' | 'PENDING';

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
    planName: string;
    vehicleCount: number;
    unitPricePerVehicle: number;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    createdAt: string;
    transactions: PaymentTransaction[];
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
    TRIAL_14D: 'Dùng thử (14 ngày)',
    STARTER: 'Starter (Cơ bản)',
    PRO: 'Professional (Chuyên nghiệp)',
    ENTERPRISE: 'Enterprise (Không giới hạn)'
};

const DEFAULT_RATE_PER_VEHICLE = 150000;

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
            billingPeriod: currentMonth,
            billingMode: 'PACKAGE',
            planName: 'Professional (Chuyên nghiệp)',
            vehicleCount: 18,
            unitPricePerVehicle: DEFAULT_RATE_PER_VEHICLE,
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
                    note: 'Thanh toán đầy đủ phí gói Pro tháng hiện tại'
                }
            ]
        },
        {
            id: 'INV-1002',
            invoiceCode: 'HD-DV-202611-02',
            tenantId: 'COMPANY_B',
            tenantName: 'Demo CTY B',
            tenantCode: 'CTYB26',
            billingPeriod: currentMonth,
            billingMode: 'PER_VEHICLE',
            planName: 'Tính theo số lượng xe',
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
                    note: 'Doanh nghiệp vừa chuyển khoản tất toán phần nợ còn lại, chờ Admin duyệt'
                }
            ]
        },
        {
            id: 'INV-1003',
            invoiceCode: 'HD-DV-202610-03',
            tenantId: 'COMPANY_C',
            tenantName: 'Demo CTY C',
            tenantCode: 'CTYC26',
            billingPeriod: '10/2026',
            billingMode: 'PACKAGE',
            planName: 'Starter (Cơ bản)',
            vehicleCount: 9,
            unitPricePerVehicle: DEFAULT_RATE_PER_VEHICLE,
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

    const adminName = sessionStorage.getItem('sys_core_admin_name') || 'System Admin';

    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus | 'PENDING_VERIFY'>('ALL');
    const [modeFilter, setModeFilter] = useState<'ALL' | BillingMode>('ALL');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [newInvoiceForm, setNewInvoiceForm] = useState<{
        tenantId: string;
        billingPeriod: string;
        billingMode: BillingMode;
        vehicleCount: string;
        unitPricePerVehicle: string;
        packageAmount: string;
        dueDate: string;
    }>({
        tenantId: '',
        billingPeriod: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
        billingMode: 'PACKAGE',
        vehicleCount: '5',
        unitPricePerVehicle: String(DEFAULT_RATE_PER_VEHICLE),
        packageAmount: '990000',
        dueDate: addDaysISO(new Date().toISOString().split('T')[0], 10)
    });

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

    const handleToggleTenantService = (tenantId: string, targetStatus: TenantStatus) => {
        const updatedTenants = tenants.map((t) =>
            t.id === tenantId ? { ...t, status: targetStatus } : t
        );
        setTenants(updatedTenants);
        localStorage.setItem('sys_tenants', JSON.stringify(updatedTenants));
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

    const openCreateInvoiceModal = () => {
        const firstTenant = tenants[0];
        const today = new Date().toISOString().split('T')[0];
        const vCount = firstTenant ? vehicleCountMap[firstTenant.id] || 5 : 5;
        const pkgFee = firstTenant ? firstTenant.monthlyFee || 990000 : 990000;

        setCreateError('');
        setNewInvoiceForm({
            tenantId: firstTenant?.id || '',
            billingPeriod: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
            billingMode: 'PACKAGE',
            vehicleCount: String(vCount),
            unitPricePerVehicle: String(DEFAULT_RATE_PER_VEHICLE),
            packageAmount: String(pkgFee),
            dueDate: addDaysISO(today, 10)
        });
        setIsCreateModalOpen(true);
    };

    const handleSelectTenantInCreate = (selectedId: string) => {
        const target = tenantMap[selectedId];
        const vCount = vehicleCountMap[selectedId] ?? 5;
        setNewInvoiceForm((prev) => ({
            ...prev,
            tenantId: selectedId,
            vehicleCount: String(vCount),
            packageAmount: String(target?.monthlyFee || 990000)
        }));
    };

    const calculatedNewTotal = useMemo(() => {
        if (newInvoiceForm.billingMode === 'PACKAGE') {
            return Math.max(0, Number(newInvoiceForm.packageAmount) || 0);
        }
        const count = Math.max(0, Number(newInvoiceForm.vehicleCount) || 0);
        const rate = Math.max(0, Number(newInvoiceForm.unitPricePerVehicle) || 0);
        return count * rate;
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
        if (!newInvoiceForm.billingPeriod.trim()) {
            setCreateError(
                isVi ? 'Vui lòng nhập kỳ thanh toán (VD: 11/2026).' : 'Please enter billing period.'
            );
            return;
        }
        if (calculatedNewTotal <= 0) {
            setCreateError(
                isVi
                    ? 'Tổng tiền phải thanh toán của kỳ cước phải lớn hơn 0 VNĐ.'
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
        const created: BillingInvoice = {
            id: `INV-${Date.now()}`,
            invoiceCode: `HD-DV-${Date.now().toString().slice(-6)}`,
            tenantId: targetTenant.id,
            tenantName: targetTenant.name,
            tenantCode: targetTenant.code,
            billingPeriod: newInvoiceForm.billingPeriod.trim(),
            billingMode: newInvoiceForm.billingMode,
            planName:
                newInvoiceForm.billingMode === 'PACKAGE'
                    ? PLAN_LABELS[targetTenant.plan] || targetTenant.plan
                    : isVi
                        ? 'Tính theo số lượng phương tiện'
                        : 'Per-Vehicle Billing',
            vehicleCount: Math.max(0, Number(newInvoiceForm.vehicleCount) || 0),
            unitPricePerVehicle: Math.max(0, Number(newInvoiceForm.unitPricePerVehicle) || 0),
            totalAmount: calculatedNewTotal,
            paidAmount: 0,
            dueDate: newInvoiceForm.dueDate,
            createdAt: today,
            transactions: []
        };

        persistInvoices([created, ...invoices]);
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

        if (
            txForm.verifyNow &&
            nextPaidAmount >= payModalInvoice.totalAmount &&
            tenantMap[payModalInvoice.tenantId]?.status === 'SUSPENDED'
        ) {
            handleToggleTenantService(payModalInvoice.tenantId, 'ACTIVE');
        }

        setPayModalInvoice(null);
    };

    const handleConfirmPendingTransaction = (invoiceId: string, txId: string) => {
        const today = new Date().toISOString().split('T')[0];
        let unlockedTenantId: string | null = null;

        const updated = invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            let addedPaid = 0;
            const nextTxs = inv.transactions.map((tx) => {
                if (tx.id === txId && tx.verifyStatus === 'PENDING') {
                    addedPaid += tx.amount;
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
            }
            return {
                ...inv,
                paidAmount: nextPaidTotal,
                transactions: nextTxs
            };
        });

        persistInvoices(updated);
        if (unlockedTenantId) {
            handleToggleTenantService(unlockedTenantId, 'ACTIVE');
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
                            ? 'Đối soát phí gói dịch vụ / phí theo đầu xe, theo dõi công nợ (PAID / UNPAID / OVERDUE), xác nhận chứng từ thanh toán và khóa/mở dịch vụ doanh nghiệp.'
                            : 'Track package or per-vehicle fees, manage receivable balances, verify payment vouchers, and lock/unlock tenant services.'}
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
                                    {isVi ? 'Cơ sở tính phí' : 'Billing Basis'}
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

                                    return (
                                        <tr
                                            key={inv.id}
                                            className="hover:bg-slate-50/80 transition-colors align-top"
                                        >
                                            {/* Cột 1: Mã kỳ cước & Doanh nghiệp */}
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

                                            {/* Cột 2: Phí theo gói hoặc số lượng phương tiện */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {inv.billingMode === 'PACKAGE' ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                                                            {isVi ? 'Theo gói dịch vụ' : 'Package Plan'}
                                                        </span>
                                                        <div className="text-xs font-semibold text-slate-700 mt-1.5">
                                                            {inv.planName}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                                            ({inv.vehicleCount} {isVi ? 'xe đang hoạt động' : 'active cars'})
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold">
                                                            <Car className="w-3 h-3" />
                                                            {isVi ? 'Theo số lượng xe' : 'Per Vehicle'}
                                                        </span>
                                                        <div className="text-xs font-mono font-semibold text-slate-700 mt-1.5">
                                                            {inv.vehicleCount} xe ×{' '}
                                                            {inv.unitPricePerVehicle.toLocaleString('vi-VN')} ₫
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Cột 3: Tổng phải thanh toán, Đã thanh toán & Công nợ còn lại */}
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

                                            {/* Cột 4: Trạng thái thanh toán & Hạn thanh toán */}
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

                                            {/* Cột 5: Giao dịch & Chứng từ */}
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

                                            {/* Cột 6: Hành động thanh toán, xem chứng từ & Khóa/Mở dịch vụ */}
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
                                                                    isServiceSuspended ? 'ACTIVE' : 'SUSPENDED'
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

            {/* MODAL 1: LẬP KỲ CƯỚC / HÓA ĐƠN MỚI */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isVi ? 'Lập kỳ cước thanh toán mới' : 'Create New Billing Invoice'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isVi
                                        ? 'Tính phí theo gói dịch vụ cố định hoặc theo số lượng xe đăng ký.'
                                        : 'Bill by fixed subscription package or registered vehicle count.'}
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

                        <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                            {createError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {isVi ? 'Doanh nghiệp áp dụng' : 'Select Tenant'}{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={newInvoiceForm.tenantId}
                                    onChange={(e) => handleSelectTenantInCreate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-sky-500"
                                >
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.code}) • {vehicleCountMap[t.id] || 0} xe
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Kỳ thanh toán' : 'Billing Period'}{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newInvoiceForm.billingPeriod}
                                        onChange={(e) =>
                                            setNewInvoiceForm((prev) => ({
                                                ...prev,
                                                billingPeriod: e.target.value
                                            }))
                                        }
                                        placeholder="11/2026"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:border-sky-500"
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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {isVi ? 'Phương thức tính phí dịch vụ' : 'Billing Calculation Mode'}
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
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
                                            {isVi ? 'Theo gói dịch vụ' : 'By Package'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {isVi ? 'Thu phí cố định theo gói' : 'Fixed plan fee'}
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
                                            {isVi ? 'Theo số lượng xe' : 'By Vehicle Count'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {isVi ? 'Đơn giá × Số xe đăng ký' : 'Rate × Registered cars'}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {newInvoiceForm.billingMode === 'PACKAGE' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {isVi ? 'Phí gói dịch vụ kỳ này (VNĐ)' : 'Package Fee (VND)'}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={newInvoiceForm.packageAmount}
                                        onChange={(e) =>
                                            setNewInvoiceForm((prev) => ({
                                                ...prev,
                                                packageAmount: e.target.value.replace(/\D/g, '').slice(0, 10)
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:border-sky-500"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {isVi ? 'Số lượng phương tiện' : 'Vehicle Count'}
                                        </label>
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
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {isVi ? 'Đơn giá / xe / tháng (₫)' : 'Rate / Vehicle (₫)'}
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={newInvoiceForm.unitPricePerVehicle}
                                            onChange={(e) =>
                                                setNewInvoiceForm((prev) => ({
                                                    ...prev,
                                                    unitPricePerVehicle: e.target.value
                                                        .replace(/\D/g, '')
                                                        .slice(0, 8)
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                                <span className="text-slate-300">
                                    {isVi ? 'Tổng tiền phải thanh toán:' : 'Total Amount Due:'}
                                </span>
                                <span className="text-base font-mono font-bold text-emerald-400">
                                    {calculatedNewTotal.toLocaleString('vi-VN')} ₫
                                </span>
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