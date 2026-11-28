import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowUpRight,
    X,
    RefreshCw,
    ArrowRight,
} from 'lucide-react';
import type { AdminRole } from './adminAccounts';
import type { TenantRecord, SubscriptionPlan } from './AdminTenantList';
import {
    syncUnifiedPlatformData,
    computeUnifiedPlatformMetrics,
    getInvoicePaymentState,
    getReceivableAmountForInvoice,
    PLATFORM_SYNC_EVENT,
    EXPIRING_SOON_DAYS,
} from './AdminBillingManagement';
import type {
    BillingInvoice,
    TenantLifecycleStatus,
} from './AdminBillingManagement';
import { vi } from '../../locales/vi';
import { en } from '../../locales/en';

export type AdminLang = 'vi' | 'en';
export const ADMIN_LANG_STORAGE_KEY = 'sys_admin_lang_v1';
export const ADMIN_LANG_CHANGE_EVENT = 'drivelinker:admin-lang-change';

const readAdminLang = (): AdminLang => {
    try {
        return localStorage.getItem(ADMIN_LANG_STORAGE_KEY) === 'en' ? 'en' : 'vi';
    } catch {
        return 'vi';
    }
};

const translateFromViEn = (
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

export interface AdminDashboardProps {
    onNavigateSection?: (section: 'tenants' | 'billing' | 'accounts' | 'devices') => void;
}

type StatModalType =
    | 'TOTAL_TENANTS'
    | 'NEW_TENANTS'
    | 'TOTAL_VEHICLES'
    | 'MRR_REVENUE'
    | 'OVERDUE_DEBT'
    | null;

interface MonthlyStatPoint {
    monthKey: string;
    label: string;
    committed: number;
    collected: number;
    overdue: number;
    newTenants: number;
    totalTenants: number;
    totalVehicles: number;
}

interface InventoryDeviceItem {
    id: string;
    imei: string;
    serial: string;
    type: string;
    received: string;
    status: string;
    tenantId: string;
    vehicle: string;
}

const INVENTORY_STORAGE_KEY = 'sys_admin_inventory_demo_v1';

const FALLBACK_DEVICES: InventoryDeviceItem[] = [
    {
        id: 'demo-1',
        imei: '356938035643809',
        serial: 'CAM-DL-001',
        type: 'Camera',
        received: '2026-10-15',
        status: 'Đang sử dụng',
        tenantId: 'COMPANY_A',
        vehicle: '29A-111.11',
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
    },
];

const ROLE_LABELS_VI: Record<AdminRole, string> = {
    SUPER_ADMIN: 'Quản trị hệ thống',
    SUPPORT_ADMIN: 'Hỗ trợ kỹ thuật',
    BILLING_ADMIN: 'Quản lý thanh toán',
};

const ROLE_LABELS_EN: Record<AdminRole, string> = {
    SUPER_ADMIN: 'System Admin',
    SUPPORT_ADMIN: 'Support Admin',
    BILLING_ADMIN: 'Billing Admin',
};

const formatDateVN = (isoDate?: string): string => {
    if (!isoDate) return '--/--/----';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getRemainingDaysISO = (targetDateStr?: string): number => {
    if (!targetDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    if (Number.isNaN(target.getTime())) return 999;
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getOverdueDays = (dueDate?: string): number => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
};

const getTenantLifecycle = (tenant: TenantRecord): TenantLifecycleStatus => {
    if (tenant.status === 'SUSPENDED') return 'SUSPENDED';
    if (tenant.lifecycleStatus) return tenant.lifecycleStatus;
    const rem = tenant.remainingAmount ?? 0;
    if (!tenant.advanceNextCycleAmount && (tenant.paidAmount ?? 0) > 0 && rem > 0) {
        return 'PARTIAL_PAID';
    }
    const days = getRemainingDaysISO(tenant.expiresAt);
    if (days < 0) return 'SUSPENDED';
    if (days <= EXPIRING_SOON_DAYS) return 'EXPIRING_SOON';
    return 'ACTIVE';
};

const getDefaultVehicleCountForTenant = (tenantId: string): number => {
    if (tenantId === 'COMPANY_A') return 5;
    if (tenantId === 'COMPANY_B') return 2;
    if (tenantId === 'COMPANY_C') return 1;
    return 0;
};

const formatCompactVND = (amount: number): string => {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(1)} tr`;
    }
    if (amount >= 1_000) {
        return `${Math.round(amount / 1_000)}k`;
    }
    return `${amount}`;
};

const buildSmoothLinePath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const midX = (p0.x + p1.x) / 2;
        path += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
};

export default function AdminDashboard({ onNavigateSection }: AdminDashboardProps) {
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

    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
    const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});
    const [devices, setDevices] = useState<InventoryDeviceItem[]>([]);

    const [chartRange, setChartRange] = useState<6 | 12>(6);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [visibleSeries, setVisibleSeries] = useState({
        committed: true,
        collected: true,
        tenants: true,
    });
    const [activeModal, setActiveModal] = useState<StatModalType>(null);

    const currentRole = sessionStorage.getItem('sys_core_role') as AdminRole | null;
    const roleMap = adminLang === 'en' ? ROLE_LABELS_EN : ROLE_LABELS_VI;
    const currentRoleLabel =
        currentRole && roleMap[currentRole] ? roleMap[currentRole] : roleMap.SUPER_ADMIN;

    const revenueLabel = adminLang === 'en' ? 'Revenue' : 'Doanh thu';

    const handleGoToSection = (section: 'tenants' | 'billing' | 'accounts' | 'devices') => {
        if (onNavigateSection) {
            onNavigateSection(section);
        } else {
            navigate('/overview/admin');
        }
    };

    const loadDashboardData = () => {
        try {
            const synced = syncUnifiedPlatformData();
            setTenants(synced.tenants as unknown as TenantRecord[]);
            setInvoices(synced.invoices);

            const counts: Record<string, number> = {};
            synced.tenants.forEach((t) => {
                const rawV = localStorage.getItem(`sys_vehicles_${t.id}`);
                if (rawV) {
                    const parsedV = JSON.parse(rawV);
                    counts[t.id] = Array.isArray(parsedV) ? parsedV.length : 0;
                } else {
                    counts[t.id] = getDefaultVehicleCountForTenant(t.id);
                }
            });
            setVehicleCountMap(counts);

            const rawDevices = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (!rawDevices) {
                setDevices(FALLBACK_DEVICES);
            } else {
                const parsedDevices: unknown = JSON.parse(rawDevices);
                setDevices(
                    Array.isArray(parsedDevices)
                        ? parsedDevices.map((d: any) => ({
                            ...d,
                            type:
                                d.type === 'AI Camera'
                                    ? 'Camera'
                                    : d.type === 'GPS Tracker' || d.type === 'DL GPS'
                                        ? 'Định vị GPS'
                                        : d.type,
                            status: d.status === 'Trong kho' ? 'Tồn kho' : d.status,
                        }))
                        : []
                );
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu thống kê nền tảng:', err);
        }
    };

    useEffect(() => {
        loadDashboardData();
        const onSync = () => loadDashboardData();
        window.addEventListener(PLATFORM_SYNC_EVENT, onSync);
        window.addEventListener('storage', onSync);
        return () => {
            window.removeEventListener(PLATFORM_SYNC_EVENT, onSync);
            window.removeEventListener('storage', onSync);
        };
    }, []);

    const committedPackageTotal = useMemo(
        () => invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        [invoices]
    );

    const collectedByTenantId = useMemo(() => {
        const map: Record<string, number> = {};
        invoices.forEach((inv) => {
            const key = inv.tenantId;
            map[key] = (map[key] || 0) + Math.max(0, inv.paidAmount || 0);
        });
        return map;
    }, [invoices]);

    const stats = useMemo(() => {
        const base = computeUnifiedPlatformMetrics(
            tenants as any,
            invoices,
            vehicleCountMap,
            devices
        );
        const planMeta: Record<
            SubscriptionPlan,
            { label: string; dotClass: string; segmentClass: string }
        > = {
            PKG_12M: {
                label: tr('admin.pkg12m'),
                dotClass: 'bg-[#0B1324]',
                segmentClass: 'bg-[#0B1324]',
            },
            PKG_6M: {
                label: tr('admin.pkg6m'),
                dotClass: 'bg-rose-600',
                segmentClass: 'bg-rose-600',
            },
        };

        const planBreakdown = (['PKG_12M', 'PKG_6M'] as SubscriptionPlan[]).map(
            (planKey) => {
                const matched = tenants.filter((t) => t.plan === planKey);
                const planTotal = matched
                    .filter((t) => t.status === 'ACTIVE')
                    .reduce((s, t) => s + (t.packagePrice || 0), 0);
                return {
                    planKey,
                    meta: planMeta[planKey],
                    count: matched.length,
                    percent:
                        base.totalTenants > 0
                            ? Math.round((matched.length / base.totalTenants) * 100)
                            : 0,
                    totalValue: planTotal,
                };
            }
        );

        return {
            ...base,
            committedPackageTotal,
            planBreakdown,
        };
    }, [tenants, invoices, vehicleCountMap, devices, committedPackageTotal, adminLang]);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const debtRows = useMemo(() => {
        const rows: {
            id: string;
            tenantName: string;
            tenantCode: string;
            statusLabel: string;
            planLabel: string;
            amount: number;
        }[] = [];

        invoices.forEach((inv) => {
            if (inv.isAdvanceForNextCycle) return;
            const state = getInvoicePaymentState(inv, todayStr);
            const amount = getReceivableAmountForInvoice(inv, todayStr);
            const isDebtOrOverdue = state === 'OVERDUE' || state === 'PARTIAL' || amount > 0;
            if (!isDebtOrOverdue) return;

            const tierName =
                inv.tier === 'BASIC'
                    ? tr('admin.tierBasic')
                    : inv.tier === 'ENTERPRISE'
                        ? tr('admin.tierEnterprise')
                        : tr('admin.tierPro');
            const pkgLabel = inv.duration === 12 ? tr('admin.pkg12m') : tr('admin.pkg6m');

            rows.push({
                id: inv.id,
                tenantName: inv.tenantName,
                tenantCode: inv.tenantCode,
                statusLabel:
                    state === 'OVERDUE'
                        ? adminLang === 'en'
                            ? 'Overdue'
                            : 'Quá hạn'
                        : tr('admin.statusPartial'),
                planLabel: `${tierName} · ${pkgLabel}`,
                amount,
            });
        });

        return rows;
    }, [invoices, todayStr, adminLang]);

    const totalReceivableForDebtModal = useMemo(
        () => debtRows.reduce((sum, r) => sum + r.amount, 0),
        [debtRows]
    );

    const monthlySeries = useMemo<MonthlyStatPoint[]>(() => {
        const now = new Date();
        const baseCommitted = Math.max(committedPackageTotal, 15000000);
        const baseCollected = stats.totalCollected;
        const baseTenants = Math.max(1, stats.totalTenants);
        const baseVehicles = Math.max(1, stats.totalVehicles);

        const commitFactors = [0.45, 0.55, 0.65, 0.72, 0.85, 0.92, 0.6, 0.68, 0.75, 0.82, 0.9, 1];
        const collectFactors = [0.45, 0.5, 0.65, 0.7, 0.8, 0.9, 0.55, 0.65, 0.7, 0.8, 0.88, 1];
        const tenantOffsets = [-3, -3, -2, -2, -2, -2, -2, -1, -1, -1, -1, 0];
        const newPerMonthHistory = [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, stats.newTenantsCount];
        const vehicleFactors = [0.45, 0.5, 0.55, 0.62, 0.68, 0.74, 0.62, 0.7, 0.78, 0.86, 0.93, 1];

        const points: MonthlyStatPoint[] = [];
        for (let i = chartRange - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthNum = String(d.getMonth() + 1).padStart(2, '0');
            const yearShort = String(d.getFullYear()).slice(-2);
            const idx = 11 - i;
            const isCurrentMonth = i === 0;

            const committedVal = isCurrentMonth
                ? baseCommitted
                : Math.round((baseCommitted * commitFactors[idx]) / 100000) * 100000;
            const collectedVal = isCurrentMonth
                ? baseCollected
                : Math.min(
                    committedVal,
                    Math.round((baseCollected * collectFactors[idx]) / 100000) * 100000
                );

            points.push({
                monthKey: `${monthNum}/${d.getFullYear()}`,
                label:
                    adminLang === 'en'
                        ? `M${d.getMonth() + 1}/${yearShort}`
                        : `T${d.getMonth() + 1}/${yearShort}`,
                committed: committedVal,
                collected: collectedVal,
                overdue: isCurrentMonth ? stats.totalOverdueDebt : 0,
                newTenants: isCurrentMonth ? stats.newTenantsCount : newPerMonthHistory[idx],
                totalTenants: isCurrentMonth
                    ? stats.totalTenants
                    : Math.max(1, baseTenants + tenantOffsets[idx]),
                totalVehicles: isCurrentMonth
                    ? stats.totalVehicles
                    : Math.max(1, Math.round(baseVehicles * vehicleFactors[idx])),
            });
        }
        return points;
    }, [chartRange, committedPackageTotal, stats, adminLang]);

    const maxRevenueValue = useMemo(() => {
        const rawMax = Math.max(
            15_000_000,
            ...monthlySeries.map((p) => Math.max(p.committed, p.collected))
        );
        return Math.ceil(rawMax / 10_000_000) * 10_000_000;
    }, [monthlySeries]);

    const maxTenantValue = useMemo(() => {
        const rawMax = Math.max(4, ...monthlySeries.map((p) => p.totalTenants + 1));
        return Math.ceil(rawMax / 2) * 2;
    }, [monthlySeries]);

    const toggleSeries = (key: 'committed' | 'collected' | 'tenants') => {
        setVisibleSeries((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            if (!next.committed && !next.collected && !next.tenants) return prev;
            return next;
        });
    };

    const activePointIndex =
        hoveredIdx !== null ? hoveredIdx : Math.max(0, monthlySeries.length - 1);
    const activePoint = monthlySeries[activePointIndex];

    const chartGeometry = useMemo(() => {
        const plotLeft = 62;
        const plotRight = 902;
        const plotTop = 24;
        const plotBottom = 228;
        const plotWidth = plotRight - plotLeft;
        const plotHeight = plotBottom - plotTop;
        const count = Math.max(1, monthlySeries.length);
        const groupWidth = plotWidth / count;

        const tenantCoords = monthlySeries.map((pt, idx) => {
            const x = plotLeft + idx * groupWidth + groupWidth / 2;
            const y = plotBottom - (pt.totalTenants / maxTenantValue) * plotHeight;
            return { x, y };
        });

        const linePath = buildSmoothLinePath(tenantCoords);
        const areaPath =
            tenantCoords.length > 0
                ? `${linePath} L ${tenantCoords[tenantCoords.length - 1].x.toFixed(1)} ${plotBottom} L ${tenantCoords[0].x.toFixed(1)} ${plotBottom} Z`
                : '';

        return {
            plotLeft,
            plotRight,
            plotTop,
            plotBottom,
            plotWidth,
            plotHeight,
            groupWidth,
            tenantCoords,
            linePath,
            areaPath,
        };
    }, [monthlySeries, maxTenantValue]);

    const collectionRate = useMemo(() => {
        if (!activePoint || activePoint.committed <= 0) return 0;
        return Math.min(100, Math.round((activePoint.collected / activePoint.committed) * 100));
    }, [activePoint]);

    const getTierName = (tier: string) => {
        if (tier === 'BASIC') return tr('admin.tierBasic');
        if (tier === 'ENTERPRISE') return tr('admin.tierEnterprise');
        return tr('admin.tierPro');
    };

    const modalTenants = useMemo(() => {
        if (activeModal === 'NEW_TENANTS') {
            return stats.newTenantsList as unknown as TenantRecord[];
        }
        return tenants;
    }, [activeModal, stats.newTenantsList, tenants]);

    const isTenantsOnlyModal =
        activeModal === 'TOTAL_TENANTS' || activeModal === 'NEW_TENANTS';
    const isVehiclesOnlyModal = activeModal === 'TOTAL_VEHICLES';
    const isDebtModal = activeModal === 'OVERDUE_DEBT';

    return (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-6 space-y-6 font-sans">
            {!onNavigateSection && (
                <div className="bg-white/95 rounded-xl border border-slate-200/90 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <span className="text-xs font-semibold text-[#0B1324]">
                        {tr('admin.title')} · {currentRoleLabel}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/overview/admin"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors"
                        >
                            {tr('admin.tabTenants')}
                        </Link>
                        <Link
                            to="/overview/admin/devices"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors"
                        >
                            {tr('admin.devicesMenu')}
                        </Link>
                        <Link
                            to="/overview/admin/accounts"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors"
                        >
                            {tr('admin.accountsMenu')}
                        </Link>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadDashboardData}
                        className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tr('common.refresh')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleGoToSection('billing')}
                        className="h-9 px-4 rounded-lg bg-[#0B1324] hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                        <span>{tr('admin.tabBilling')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ĐÃ XÓA MỤC DOANH THU GÓI / THÁNG (4 THẺ CHỈ SỐ CHÍNH) */}
            <section
                aria-label={tr('admin.sectionOverview')}
                className="bg-white rounded-xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 overflow-hidden shadow-2xs"
            >
                <button
                    type="button"
                    onClick={() => setActiveModal('TOTAL_TENANTS')}
                    className="p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{tr('admin.cardTotalTenants')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <div className="text-[26px] font-bold tracking-tight text-slate-900 mt-2 tabular-nums leading-none">
                        {stats.totalTenants}
                    </div>
                    <div className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {stats.activeCount} {tr('admin.statusActive').toLowerCase()}
                        </span>
                        {stats.expiringSoonCount > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-sky-700 font-medium">
                                    {stats.expiringSoonCount} {tr('admin.statusExpiring').toLowerCase()}
                                </span>
                            </>
                        )}
                        {stats.partialCount > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-amber-700 font-medium">
                                    {stats.partialCount} {tr('admin.statusPartial').toLowerCase()}
                                </span>
                            </>
                        )}
                        {stats.suspendedCount > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-rose-600 font-medium">
                                    {stats.suspendedCount} {tr('admin.statusSuspended').toLowerCase()}
                                </span>
                            </>
                        )}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveModal('NEW_TENANTS')}
                    className="p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{adminLang === 'en' ? 'New Enterprises' : 'Doanh nghiệp mới'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <div className="text-[26px] font-bold tracking-tight text-slate-900 mt-2 tabular-nums leading-none">
                        +{stats.newTenantsCount}
                    </div>
                    <div className="text-xs text-slate-500 mt-2.5 tabular-nums">
                        {adminLang === 'en' ? 'Last 30 days' : 'Trong 30 ngày qua'} ·{' '}
                        <span className="font-medium text-slate-700">
                            {stats.totalTenants > 0
                                ? Math.round((stats.newTenantsCount / stats.totalTenants) * 100)
                                : 0}
                            %
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveModal('TOTAL_VEHICLES')}
                    className="p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{tr('fleet.kpiTotal')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <div className="text-[26px] font-bold tracking-tight text-slate-900 mt-2 tabular-nums leading-none">
                        {stats.totalVehicles}
                        <span className="text-sm font-normal text-slate-400 ml-1">
                            {adminLang === 'en' ? 'veh' : 'xe'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2.5 tabular-nums">
                        {stats.inUseDevices}{' '}
                        {adminLang === 'en' ? 'active linked devices' : 'thiết bị đang gắn hoạt động'}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveModal('OVERDUE_DEBT')}
                    className="p-5 text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>
                            {adminLang === 'en' ? 'Active Plan Debt' : 'Nợ gói đang dùng'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <div
                        className={`text-[26px] font-bold tracking-tight mt-2 tabular-nums leading-none ${totalReceivableForDebtModal > 0 ? 'text-rose-600' : 'text-slate-900'
                            }`}
                    >
                        {totalReceivableForDebtModal.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-xs text-slate-500 mt-2.5 space-y-0.5 tabular-nums">
                        {debtRows.length > 0 ? (
                            <div className="text-rose-600 font-medium">
                                {debtRows.length}{' '}
                                {adminLang === 'en'
                                    ? 'enterprise(s) with balance due'
                                    : 'doanh nghiệp có khoản cần thu'}
                            </div>
                        ) : (
                            <div className="text-emerald-700 font-medium">
                                {adminLang === 'en' ? 'No balance due' : 'Không có khoản cần thu'}
                            </div>
                        )}
                    </div>
                </button>
            </section>

            <section className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            {adminLang === 'en'
                                ? `${revenueLabel} & Enterprise Growth`
                                : `${revenueLabel} gói thuê & tăng trưởng doanh nghiệp`}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {adminLang === 'en' ? 'Average per enterprise' : 'Trung bình'}:{' '}
                            <span className="font-medium text-slate-700 tabular-nums">
                                {formatCompactVND(stats.arpu)}/{adminLang === 'en' ? 'unit' : 'đơn vị'}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <button
                                type="button"
                                onClick={() => toggleSeries('committed')}
                                className={`h-7 px-2.5 rounded-md border inline-flex items-center gap-1.5 font-medium transition-opacity cursor-pointer ${visibleSeries.committed
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-100 bg-slate-50 text-slate-400 opacity-55'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-xs bg-[#0B1324] inline-block" />
                                <span>{adminLang === 'en' ? 'Committed Value' : 'Giá trị gói đăng ký'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => toggleSeries('collected')}
                                className={`h-7 px-2.5 rounded-md border inline-flex items-center gap-1.5 font-medium transition-opacity cursor-pointer ${visibleSeries.collected
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-100 bg-slate-50 text-slate-400 opacity-55'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-xs bg-sky-500 inline-block" />
                                <span>{adminLang === 'en' ? 'Collected' : 'Đã thực thu'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => toggleSeries('tenants')}
                                className={`h-7 px-2.5 rounded-md border inline-flex items-center gap-1.5 font-medium transition-opacity cursor-pointer ${visibleSeries.tenants
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-100 bg-slate-50 text-slate-400 opacity-55'
                                    }`}
                            >
                                <span className="w-2 h-2 rounded-full border-2 border-rose-600 bg-white inline-block" />
                                <span>{adminLang === 'en' ? 'Enterprises' : 'Doanh nghiệp'}</span>
                            </button>
                        </div>

                        <div className="inline-flex h-7 rounded-md bg-slate-100 p-0.5 text-xs">
                            {([6, 12] as const).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setChartRange(r)}
                                    className={`px-2.5 rounded-sm font-medium transition-all cursor-pointer ${chartRange === r
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {r} {adminLang === 'en' ? 'mo' : 'tháng'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {activePoint && (
                    <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-[11px] text-slate-500 block">
                                {adminLang === 'en' ? 'Period' : 'Kỳ đối soát'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                {activePoint.monthKey}
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-500 block">
                                {adminLang === 'en' ? 'Committed Value' : 'Giá trị gói đăng ký'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                {activePoint.committed.toLocaleString('vi-VN')} ₫
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-500 block">
                                {adminLang === 'en' ? 'Collected' : 'Đã thực thu'} • {collectionRate}%
                            </span>
                            <span className="text-sm font-semibold text-sky-700 tabular-nums">
                                {activePoint.collected.toLocaleString('vi-VN')} ₫
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] text-slate-500 block">
                                {adminLang === 'en' ? 'Enterprises' : 'Quy mô doanh nghiệp'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                {activePoint.totalTenants} {adminLang === 'en' ? 'units' : 'đơn vị'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="px-5 py-5 w-full overflow-x-auto">
                    <svg
                        viewBox="0 0 960 264"
                        className="w-full min-w-[700px] h-[264px] select-none"
                        role="img"
                    >
                        <defs>
                            <linearGradient id="dlTenantAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.11" />
                                <stop offset="100%" stopColor="#E11D48" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const y =
                                chartGeometry.plotBottom - ratio * chartGeometry.plotHeight;
                            const revVal = Math.round(maxRevenueValue * ratio);
                            const tenantVal = Math.round(maxTenantValue * ratio);
                            return (
                                <g key={idx}>
                                    <line
                                        x1={chartGeometry.plotLeft}
                                        y1={y}
                                        x2={chartGeometry.plotRight}
                                        y2={y}
                                        stroke={ratio === 0 ? '#E2E8F0' : '#F1F5F9'}
                                        strokeDasharray={ratio === 0 ? undefined : '3 3'}
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={chartGeometry.plotLeft - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="fill-slate-400 text-[11px] tabular-nums"
                                    >
                                        {formatCompactVND(revVal)}
                                    </text>
                                    <text
                                        x={chartGeometry.plotRight + 10}
                                        y={y + 4}
                                        textAnchor="start"
                                        className="fill-slate-400 text-[11px] tabular-nums"
                                    >
                                        {tenantVal} {adminLang === 'en' ? 'units' : 'đơn vị'}
                                    </text>
                                </g>
                            );
                        })}

                        {monthlySeries.map((pt, idx) => {
                            const centerX =
                                chartGeometry.plotLeft +
                                idx * chartGeometry.groupWidth +
                                chartGeometry.groupWidth / 2;
                            const isSelected = activePointIndex === idx;
                            if (!isSelected) return null;

                            return (
                                <g key={`guide-${pt.monthKey}`}>
                                    <rect
                                        x={centerX - chartGeometry.groupWidth * 0.4}
                                        y={chartGeometry.plotTop - 4}
                                        width={chartGeometry.groupWidth * 0.8}
                                        height={chartGeometry.plotHeight + 4}
                                        rx="6"
                                        fill="#F8FAFC"
                                    />
                                    <line
                                        x1={centerX}
                                        y1={chartGeometry.plotTop - 2}
                                        x2={centerX}
                                        y2={chartGeometry.plotBottom}
                                        stroke="#CBD5E1"
                                        strokeDasharray="3 3"
                                        strokeWidth="1"
                                    />
                                </g>
                            );
                        })}

                        {monthlySeries.map((pt, idx) => {
                            const centerX =
                                chartGeometry.plotLeft +
                                idx * chartGeometry.groupWidth +
                                chartGeometry.groupWidth / 2;
                            const barW = Math.min(18, chartGeometry.groupWidth * 0.24);
                            const isSelected = activePointIndex === idx;
                            const isDimmed = hoveredIdx !== null && !isSelected;

                            const commitH = Math.max(
                                3,
                                (pt.committed / maxRevenueValue) * chartGeometry.plotHeight
                            );
                            const colH = Math.max(
                                3,
                                (pt.collected / maxRevenueValue) * chartGeometry.plotHeight
                            );

                            const showBoth = visibleSeries.committed && visibleSeries.collected;
                            const commitX = showBoth ? centerX - barW - 2 : centerX - barW / 2;
                            const colX = showBoth ? centerX + 2 : centerX - barW / 2;

                            return (
                                <g
                                    key={`bars-${pt.monthKey}`}
                                    style={{ transition: 'opacity 150ms ease' }}
                                    opacity={isDimmed ? 0.45 : 1}
                                >
                                    {visibleSeries.committed && (
                                        <rect
                                            x={commitX}
                                            y={chartGeometry.plotBottom - commitH}
                                            width={barW}
                                            height={commitH}
                                            rx="3"
                                            fill="#0B1324"
                                        />
                                    )}
                                    {visibleSeries.collected && (
                                        <rect
                                            x={colX}
                                            y={chartGeometry.plotBottom - colH}
                                            width={barW}
                                            height={colH}
                                            rx="3"
                                            fill="#0EA5E9"
                                        />
                                    )}
                                    <text
                                        x={centerX}
                                        y={chartGeometry.plotBottom + 22}
                                        textAnchor="middle"
                                        className={`text-[11px] tabular-nums ${isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                                            }`}
                                    >
                                        {pt.label}
                                    </text>
                                </g>
                            );
                        })}

                        {visibleSeries.tenants && chartGeometry.tenantCoords.length > 0 && (
                            <>
                                <path d={chartGeometry.areaPath} fill="url(#dlTenantAreaGrad)" />
                                <path
                                    d={chartGeometry.linePath}
                                    fill="none"
                                    stroke="#E11D48"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {chartGeometry.tenantCoords.map((coord, idx) => (
                                    <circle
                                        key={`pt-${monthlySeries[idx].monthKey}`}
                                        cx={coord.x}
                                        cy={coord.y}
                                        r={activePointIndex === idx ? 4.5 : 3}
                                        fill="#E11D48"
                                        stroke="#FFFFFF"
                                        strokeWidth="1.8"
                                    />
                                ))}
                            </>
                        )}

                        {monthlySeries.map((pt, idx) => {
                            const x = chartGeometry.plotLeft + idx * chartGeometry.groupWidth;
                            return (
                                <rect
                                    key={`hit-${pt.monthKey}`}
                                    x={x}
                                    y={chartGeometry.plotTop - 4}
                                    width={chartGeometry.groupWidth}
                                    height={chartGeometry.plotHeight + 34}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                />
                            );
                        })}
                    </svg>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 shadow-2xs">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                {adminLang === 'en' ? 'Plan Breakdown' : 'Phân bổ gói thuê trọn gói'}
                            </h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {stats.planBreakdown.map((item) => (
                                <div
                                    key={item.planKey}
                                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.meta.dotClass}`} />
                                        <span className="font-medium text-slate-800 truncate">
                                            {item.meta.label}
                                        </span>
                                        <span className="text-slate-400 tabular-nums shrink-0">
                                            {item.count} • {item.percent}%
                                        </span>
                                    </div>
                                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                                        {item.totalValue.toLocaleString('vi-VN')} ₫
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{revenueLabel}</span>
                        <strong className="font-semibold text-emerald-700 tabular-nums">
                            {stats.totalCollected.toLocaleString('vi-VN')} ₫
                        </strong>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 shadow-2xs">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {adminLang === 'en'
                                    ? 'Active Debt & Next-Cycle Prepayment'
                                    : 'Nợ gói đang dùng & Trả trước kỳ mới'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveModal('OVERDUE_DEBT')}
                                className="text-xs font-medium text-[#0B1324] hover:text-rose-600 cursor-pointer"
                            >
                                {tr('common.details')}
                            </button>
                        </div>

                        {stats.currentCycleDebtInvoices.length === 0 &&
                            stats.advanceNextCycleInvoices.length === 0 ? (
                            <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                {tr('common.noData')}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {stats.currentCycleDebtInvoices.slice(0, 2).map((inv) => {
                                    const debt = getReceivableAmountForInvoice(inv, todayStr);
                                    const daysLate = getOverdueDays(inv.remainingDueDate || inv.dueDate);
                                    return (
                                        <div
                                            key={inv.id}
                                            className="py-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="min-w-0">
                                                <span className="font-semibold text-slate-900 truncate block">
                                                    {inv.tenantName}
                                                </span>
                                                <span className="text-slate-500 tabular-nums">
                                                    {inv.invoiceCode}
                                                    {daysLate > 0
                                                        ? ` · ${tr('admin.overdueDays', { days: daysLate })}`
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="text-right font-semibold text-rose-600 tabular-nums">
                                                {debt.toLocaleString('vi-VN')} ₫
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                        <span>
                            {adminLang === 'en' ? 'Amount payable' : 'Số tiền cần phải thanh toán'}
                        </span>
                        <strong className="font-semibold text-rose-600">
                            {totalReceivableForDebtModal.toLocaleString('vi-VN')} ₫
                        </strong>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-5 shadow-2xs">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {tr('admin.devicesMenu')}
                            </h3>
                            {onNavigateSection ? (
                                <button
                                    type="button"
                                    onClick={() => handleGoToSection('devices')}
                                    className="text-xs font-medium text-[#0B1324] hover:text-rose-600 cursor-pointer"
                                >
                                    {tr('common.details')}
                                </button>
                            ) : (
                                <Link
                                    to="/overview/admin/devices"
                                    className="text-xs font-medium text-[#0B1324] hover:text-rose-600"
                                >
                                    {tr('common.details')}
                                </Link>
                            )}
                        </div>

                        <div className="divide-y divide-slate-100 text-xs">
                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-700">
                                    {adminLang === 'en' ? 'In use on vehicles' : 'Đang sử dụng trên xe'}
                                </span>
                                <span className="font-semibold text-slate-900 tabular-nums">
                                    {stats.inUseDevices}
                                </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-700">
                                    {adminLang === 'en' ? 'In stock' : 'Tồn kho sẵn sàng'}
                                </span>
                                <span className="font-semibold text-slate-900 tabular-nums">
                                    {stats.inStockDevices}
                                </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                                <span className="text-slate-700">
                                    {adminLang === 'en' ? 'Fault / Warranty' : 'Lỗi / Đang bảo hành'}
                                </span>
                                <span className="font-semibold text-slate-900 tabular-nums">
                                    {stats.issueDevices}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{adminLang === 'en' ? 'Total devices' : 'Tổng thiết bị quản lý'}</span>
                        <strong className="font-semibold text-slate-900 tabular-nums">
                            {stats.totalDevices}
                        </strong>
                    </div>
                </section>
            </div>

            {activeModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">
                                {tr('common.details')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto text-xs">
                            {isDebtModal ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="py-2.5 px-3">{tr('admin.colTenant')}</th>
                                            <th className="py-2.5 px-3">{tr('common.status')}</th>
                                            <th className="py-2.5 px-3">{tr('admin.colTierPlan')}</th>
                                            <th className="py-2.5 px-3 text-right">
                                                {adminLang === 'en' ? 'Amount Due' : 'Số tiền cần thu'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {debtRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-500">
                                                    {tr('common.noData')}
                                                </td>
                                            </tr>
                                        ) : (
                                            debtRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-900">{row.tenantName}</div>
                                                        <div className="text-[11px] text-slate-400 tabular-nums">
                                                            {row.tenantCode}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 font-medium text-rose-600">
                                                        {row.statusLabel}
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-700">{row.planLabel}</td>
                                                    <td className="py-3 px-3 text-right font-semibold text-rose-600 tabular-nums">
                                                        {row.amount.toLocaleString('vi-VN')} ₫
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                                            <td colSpan={3} className="py-3 px-3">
                                                {adminLang === 'en'
                                                    ? 'Total amount receivable'
                                                    : 'Số tiền cần phải thu'}
                                            </td>
                                            <td className="py-3 px-3 text-right text-rose-600 tabular-nums">
                                                {totalReceivableForDebtModal.toLocaleString('vi-VN')} ₫
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="py-2.5 px-3">{tr('admin.colTenant')}</th>
                                            {isVehiclesOnlyModal ? (
                                                <th className="py-2.5 px-3 text-right">
                                                    {tr('fleet.kpiTotal')}
                                                </th>
                                            ) : (
                                                <>
                                                    <th className="py-2.5 px-3">{tr('common.status')}</th>
                                                    <th className="py-2.5 px-3">{tr('admin.colTierPlan')}</th>
                                                    {!isTenantsOnlyModal && (
                                                        <th className="py-2.5 px-3 text-right">{revenueLabel}</th>
                                                    )}
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {modalTenants.map((t) => {
                                            const collectedForTenant =
                                                collectedByTenantId[t.id] ?? (t.paidAmount || 0);
                                            const lifecycle = getTenantLifecycle(t);
                                            const vehicleCount = vehicleCountMap[t.id] || 0;

                                            return (
                                                <tr key={t.id}>
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-900">{t.name}</div>
                                                        <div className="text-[11px] text-slate-400 tabular-nums">
                                                            {t.code} · {formatDateVN(t.expiresAt)}
                                                        </div>
                                                    </td>
                                                    {isVehiclesOnlyModal ? (
                                                        <td className="py-3 px-3 text-right font-semibold text-slate-900 tabular-nums">
                                                            {vehicleCount} {adminLang === 'en' ? 'vehicles' : 'xe'}
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="py-3 px-3 font-medium text-slate-700">
                                                                {lifecycle === 'SUSPENDED'
                                                                    ? tr('admin.statusSuspended')
                                                                    : lifecycle === 'PARTIAL_PAID'
                                                                        ? tr('admin.statusPartial')
                                                                        : lifecycle === 'EXPIRING_SOON'
                                                                            ? tr('admin.statusExpiring')
                                                                            : tr('admin.statusActive')}
                                                            </td>
                                                            <td className="py-3 px-3 text-slate-700">
                                                                {getTierName(t.tier || 'PRO')} ·{' '}
                                                                {t.plan === 'PKG_12M'
                                                                    ? tr('admin.pkg12m')
                                                                    : tr('admin.pkg6m')}
                                                            </td>
                                                            {!isTenantsOnlyModal && (
                                                                <td className="py-3 px-3 text-right font-semibold text-slate-900 tabular-nums">
                                                                    {collectedForTenant.toLocaleString('vi-VN')} ₫
                                                                </td>
                                                            )}
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-right">
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                {tr('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
