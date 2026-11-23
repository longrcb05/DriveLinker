import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2,
    TrendingUp,
    Car,
    CreditCard,
    AlertTriangle,
    Sparkles,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    Ban,
    X,
    BarChart3,
    ShieldCheck,
    RefreshCw,
    Wallet,
    ArrowRight
} from 'lucide-react';
import type { TenantRecord, SubscriptionPlan } from './AdminTenantList';
import type { BillingInvoice } from './AdminBillingManagement';

export interface AdminDashboardProps {
    onNavigateSection?: (section: 'tenants' | 'billing') => void;
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
    mrr: number;
    collected: number;
    overdue: number;
    newTenants: number;
    totalTenants: number;
    totalVehicles: number;
}

const PLAN_META: Record<
    SubscriptionPlan,
    { label: string; color: string; barClass: string; badgeClass: string }
> = {
    TRIAL_14D: {
        label: 'Dùng thử (14 ngày)',
        color: '#0EA5E9',
        barClass: 'bg-sky-500',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    STARTER: {
        label: 'Starter (Cơ bản)',
        color: '#64748B',
        barClass: 'bg-slate-600',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    PRO: {
        label: 'Professional (Chuyên nghiệp)',
        color: '#4F46E5',
        barClass: 'bg-indigo-600',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    ENTERPRISE: {
        label: 'Enterprise (Doanh nghiệp lớn)',
        color: '#D97706',
        barClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    }
};

const formatDateVN = (isoDate?: string): string => {
    if (!isoDate) return '--/--/----';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

export default function AdminDashboard({ onNavigateSection }: AdminDashboardProps) {
    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
    const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});

    const [chartRange, setChartRange] = useState<6 | 12>(6);
    const [hoveredRevenueIdx, setHoveredRevenueIdx] = useState<number | null>(null);
    const [hoveredGrowthIdx, setHoveredGrowthIdx] = useState<number | null>(null);
    const [activeModal, setActiveModal] = useState<StatModalType>(null);

    const loadDashboardData = () => {
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

            const rawInvoices = JSON.parse(localStorage.getItem('sys_platform_billing') || '[]');
            setInvoices(Array.isArray(rawInvoices) ? rawInvoices : []);
        } catch (err) {
            console.error('Lỗi tải dữ liệu thống kê nền tảng:', err);
        }
    };

    useEffect(() => {
        loadDashboardData();
        const onStorage = () => loadDashboardData();
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Tính toán 5 nhóm chỉ số KPI chính + phân tích cơ cấu
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const totalTenants = tenants.length;
        const activeTenants = tenants.filter((t) => t.status === 'ACTIVE');
        const trialTenants = tenants.filter((t) => t.status === 'TRIAL');
        const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED');

        // Doanh nghiệp mới kích hoạt trong 30 ngày gần nhất
        const newTenantsList = tenants.filter(
            (t) => t.activatedAt && t.activatedAt >= thirtyDaysAgoStr
        );

        // Tổng phương tiện đăng ký & tổng hạn mức toàn nền tảng
        const totalVehicles = tenants.reduce(
            (sum, t) => sum + (vehicleCountMap[t.id] || 0),
            0
        );
        const totalVehicleQuota = tenants.reduce(
            (sum, t) => sum + (t.maxVehicles || 0),
            0
        );
        const fleetUtilization =
            totalVehicleQuota > 0
                ? Math.min(100, Math.round((totalVehicles / totalVehicleQuota) * 100))
                : 0;

        // Doanh thu định kỳ hàng tháng (MRR) từ các doanh nghiệp ACTIVE
        const mrr = activeTenants.reduce((sum, t) => sum + (t.monthlyFee || 0), 0);
        const arr = mrr * 12;
        const arpu = activeTenants.length > 0 ? Math.round(mrr / activeTenants.length) : 0;

        // Công nợ quá hạn (OVERDUE) & tổng công nợ chưa thu
        const overdueInvoices = invoices.filter((inv) => {
            const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
            return remaining > 0 && inv.dueDate && inv.dueDate < todayStr;
        });
        const totalOverdueDebt = overdueInvoices.reduce(
            (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
            0
        );
        const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

        // Phân bổ theo gói dịch vụ
        const planBreakdown = (
            ['PRO', 'STARTER', 'ENTERPRISE', 'TRIAL_14D'] as SubscriptionPlan[]
        ).map((planKey) => {
            const matched = tenants.filter((t) => t.plan === planKey);
            const planMrr = matched
                .filter((t) => t.status === 'ACTIVE')
                .reduce((s, t) => s + (t.monthlyFee || 0), 0);
            return {
                planKey,
                meta: PLAN_META[planKey],
                count: matched.length,
                percent: totalTenants > 0 ? Math.round((matched.length / totalTenants) * 100) : 0,
                mrr: planMrr
            };
        });

        return {
            totalTenants,
            activeCount: activeTenants.length,
            trialCount: trialTenants.length,
            suspendedCount: suspendedTenants.length,
            newTenantsList,
            newTenantsCount: newTenantsList.length,
            totalVehicles,
            totalVehicleQuota,
            fleetUtilization,
            mrr,
            arr,
            arpu,
            activeTenants,
            overdueInvoices,
            totalOverdueDebt,
            totalCollected,
            planBreakdown
        };
    }, [tenants, invoices, vehicleCountMap]);

    // Chuỗi dữ liệu biểu đồ 6 / 12 tháng (tháng cuối đồng bộ trực tiếp với số liệu thực tế trên máy)
    const monthlySeries = useMemo<MonthlyStatPoint[]>(() => {
        const now = new Date();
        const baseMrr = stats.mrr || 3480000;
        const baseCollected = stats.totalCollected || 2990000;
        const baseTenants = Math.max(1, stats.totalTenants);
        const baseVehicles = Math.max(1, stats.totalVehicles);

        const mrrFactors = [0.52, 0.58, 0.64, 0.72, 0.81, 0.86, 0.68, 0.74, 0.82, 0.89, 0.94, 1];
        const collectFactors = [0.5, 0.56, 0.6, 0.7, 0.78, 0.84, 0.65, 0.72, 0.8, 0.85, 0.91, 1];
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

            points.push({
                monthKey: `${monthNum}/${d.getFullYear()}`,
                label: `T${d.getMonth() + 1}/${yearShort}`,
                mrr: isCurrentMonth ? stats.mrr : Math.round((baseMrr * mrrFactors[idx]) / 10000) * 10000,
                collected: isCurrentMonth
                    ? stats.totalCollected
                    : Math.round((baseCollected * collectFactors[idx]) / 10000) * 10000,
                overdue: isCurrentMonth ? stats.totalOverdueDebt : idx % 3 === 1 ? 990000 : 0,
                newTenants: isCurrentMonth ? stats.newTenantsCount : newPerMonthHistory[idx],
                totalTenants: isCurrentMonth
                    ? stats.totalTenants
                    : Math.max(1, baseTenants + tenantOffsets[idx]),
                totalVehicles: isCurrentMonth
                    ? stats.totalVehicles
                    : Math.max(1, Math.round(baseVehicles * vehicleFactors[idx]))
            });
        }
        return points;
    }, [chartRange, stats]);

    const maxRevenueValue = useMemo(() => {
        const rawMax = Math.max(
            1_000_000,
            ...monthlySeries.map((p) => Math.max(p.mrr, p.collected))
        );
        return Math.ceil(rawMax / 1_000_000) * 1_000_000;
    }, [monthlySeries]);

    const maxTenantValue = useMemo(() => {
        return Math.max(5, ...monthlySeries.map((p) => p.totalTenants + 1));
    }, [monthlySeries]);

    return (
        <div className="flex-1 max-w-[1520px] w-full mx-auto p-8 space-y-6">
            {/* HEADER DASHBOARD THỐNG KÊ */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SYSTEM ADMIN • BÁO CÁO ĐIỀU HÀNH TOÀN NỀN TẢNG</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard Thống kê Nền tảng DriveLinker
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Tổng hợp chỉ số doanh nghiệp, tăng trưởng khách hàng mới, quy mô phương tiện, doanh thu định kỳ (MRR) và cảnh báo công nợ quá hạn.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={loadDashboardData}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Làm mới số liệu</span>
                    </button>

                    {onNavigateSection && (
                        <button
                            type="button"
                            onClick={() => onNavigateSection('billing')}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                            <span>Đối soát công nợ</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ================= 5 THẺ KPI THỐNG KÊ NỀN TẢNG ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* KPI 1: Tổng số doanh nghiệp */}
                <div
                    onClick={() => setActiveModal('TOTAL_TENANTS')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Tổng số doanh nghiệp
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                            <Building2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold text-slate-900 font-mono">
                            {stats.totalTenants}
                        </div>
                        <span className="text-[11px] font-semibold text-sky-600 flex items-center gap-0.5">
                            Chi tiết <ArrowUpRight className="w-3 h-3" />
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold flex-wrap">
                        <span className="text-emerald-600">{stats.activeCount} Active</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sky-600">{stats.trialCount} Trial</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600">{stats.suspendedCount} Khóa</span>
                    </div>
                </div>

                {/* KPI 2: Số doanh nghiệp mới */}
                <div
                    onClick={() => setActiveModal('NEW_TENANTS')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Số doanh nghiệp mới
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold text-indigo-700 font-mono">
                            +{stats.newTenantsCount}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            30 ngày qua
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2.5">
                        Chiếm{' '}
                        <strong className="text-slate-700">
                            {stats.totalTenants > 0
                                ? Math.round((stats.newTenantsCount / stats.totalTenants) * 100)
                                : 0}
                            %
                        </strong>{' '}
                        tổng số đối tác toàn sàn
                    </p>
                </div>

                {/* KPI 3: Tổng số phương tiện toàn nền tảng */}
                <div
                    onClick={() => setActiveModal('TOTAL_VEHICLES')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Tổng phương tiện nền tảng
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                            <Car className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold text-slate-900 font-mono">
                            {stats.totalVehicles}{' '}
                            <span className="text-xs font-normal text-slate-400">
                                / {stats.totalVehicleQuota} xe
                            </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-cyan-700">
                            {stats.fleetUtilization}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full bg-cyan-600 rounded-full transition-all"
                            style={{ width: `${stats.fleetUtilization}%` }}
                        />
                    </div>
                </div>

                {/* KPI 4: Doanh thu định kỳ hàng tháng (MRR) */}
                <div
                    onClick={() => setActiveModal('MRR_REVENUE')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Doanh thu định kỳ (MRR)
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <CreditCard className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 font-mono">
                        {stats.mrr.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2.5">
                        ARR dự kiến:{' '}
                        <strong className="font-mono text-slate-700">
                            {formatCompactVND(stats.arr)}/năm
                        </strong>
                    </p>
                </div>

                {/* KPI 5: Tổng công nợ quá hạn */}
                <div
                    onClick={() => setActiveModal('OVERDUE_DEBT')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Tổng công nợ quá hạn
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-rose-600 font-mono">
                        {stats.totalOverdueDebt.toLocaleString('vi-VN')} ₫
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2.5">
                        {stats.overdueInvoices.length > 0 ? (
                            <span className="text-rose-600 font-semibold">
                                {stats.overdueInvoices.length} hóa đơn quá hạn cần thu hồi
                            </span>
                        ) : (
                            <span className="text-emerald-600 font-semibold">
                                Không có hóa đơn quá hạn
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* ================= KHU VỰC BIỂU ĐỒ DOANH THU & TĂNG TRƯỞNG ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* BIỂU ĐỒ 1 (7 CỘT): DOANH THU ĐỊNH KỲ (MRR) & THỰC THU THEO THÁNG */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Biểu đồ Doanh thu MRR & Thực thu Nền tảng
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                So sánh doanh thu gói định kỳ (MRR) và số tiền đã xác nhận thu theo từng tháng
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                            {([6, 12] as const).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setChartRange(r)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer ${chartRange === r
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {r} tháng
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chú giải & Tooltip trực tiếp */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block" />
                                Doanh thu định kỳ (MRR)
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                                Đã xác nhận thu
                            </span>
                        </div>

                        {hoveredRevenueIdx !== null && monthlySeries[hoveredRevenueIdx] && (
                            <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-mono text-[11px] flex items-center gap-3">
                                <span className="text-sky-300 font-bold">
                                    {monthlySeries[hoveredRevenueIdx].monthKey}
                                </span>
                                <span>
                                    MRR: {monthlySeries[hoveredRevenueIdx].mrr.toLocaleString('vi-VN')}₫
                                </span>
                                <span className="text-emerald-400">
                                    Thu: {monthlySeries[hoveredRevenueIdx].collected.toLocaleString('vi-VN')}₫
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Khung vẽ biểu đồ cột đôi SVG */}
                    <div className="w-full overflow-x-auto">
                        <svg
                            viewBox="0 0 640 250"
                            className="w-full h-[250px] select-none"
                            role="img"
                            aria-label="Biểu đồ doanh thu MRR và thực thu"
                        >
                            {/* Đường kẻ lưới ngang Y-axis */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                const y = 210 - ratio * 175;
                                const val = Math.round(maxRevenueValue * ratio);
                                return (
                                    <g key={idx}>
                                        <line
                                            x1="58"
                                            y1={y}
                                            x2="625"
                                            y2={y}
                                            stroke="#E2E8F0"
                                            strokeDasharray={ratio === 0 ? undefined : '4 4'}
                                            strokeWidth="1"
                                        />
                                        <text
                                            x="50"
                                            y={y + 4}
                                            textAnchor="end"
                                            className="fill-slate-400 text-[10px] font-mono"
                                        >
                                            {formatCompactVND(val)}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Các cột dữ liệu theo tháng */}
                            {monthlySeries.map((pt, idx) => {
                                const plotWidth = 560;
                                const groupWidth = plotWidth / monthlySeries.length;
                                const centerX = 62 + idx * groupWidth + groupWidth / 2;
                                const barW = Math.min(20, groupWidth * 0.34);

                                const mrrH = Math.max(4, (pt.mrr / maxRevenueValue) * 175);
                                const colH = Math.max(4, (pt.collected / maxRevenueValue) * 175);
                                const isHovered = hoveredRevenueIdx === idx;

                                return (
                                    <g
                                        key={pt.monthKey}
                                        onMouseEnter={() => setHoveredRevenueIdx(idx)}
                                        onMouseLeave={() => setHoveredRevenueIdx(null)}
                                        className="cursor-pointer"
                                    >
                                        {isHovered && (
                                            <rect
                                                x={centerX - groupWidth * 0.44}
                                                y="26"
                                                width={groupWidth * 0.88}
                                                height="184"
                                                rx="8"
                                                fill="#F1F5F9"
                                            />
                                        )}

                                        {/* Cột MRR */}
                                        <rect
                                            x={centerX - barW - 2}
                                            y={210 - mrrH}
                                            width={barW}
                                            height={mrrH}
                                            rx="4"
                                            fill={isHovered ? '#4338CA' : '#6366F1'}
                                        />

                                        {/* Cột Thực thu */}
                                        <rect
                                            x={centerX + 2}
                                            y={210 - colH}
                                            width={barW}
                                            height={colH}
                                            rx="4"
                                            fill={isHovered ? '#059669' : '#10B981'}
                                        />

                                        {/* Nhãn tháng X-axis */}
                                        <text
                                            x={centerX}
                                            y="230"
                                            textAnchor="middle"
                                            className={`text-[10px] font-mono ${idx === monthlySeries.length - 1
                                                    ? 'fill-slate-900 font-bold'
                                                    : 'fill-slate-500'
                                                }`}
                                        >
                                            {pt.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* BIỂU ĐỒ 2 (5 CỘT): TĂNG TRƯỞNG DOANH NGHIỆP & QUY MÔ ĐỘI XE */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div className="mb-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-sky-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Biểu đồ Tăng trưởng Doanh nghiệp
                                </h2>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[11px] font-bold">
                                ARPU: {formatCompactVND(stats.arpu)}/DN
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tổng doanh nghiệp lũy kế (đường) và doanh nghiệp mới theo tháng (cột)
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="w-3 h-0.5 bg-sky-600 inline-block" />
                                Tổng doanh nghiệp
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
                                DN mới
                            </span>
                        </div>
                        {hoveredGrowthIdx !== null && monthlySeries[hoveredGrowthIdx] && (
                            <span className="font-mono text-[11px] font-bold text-slate-800">
                                {monthlySeries[hoveredGrowthIdx].monthKey}:{' '}
                                {monthlySeries[hoveredGrowthIdx].totalTenants} DN (+
                                {monthlySeries[hoveredGrowthIdx].newTenants} mới)
                            </span>
                        )}
                    </div>

                    {/* SVG Line + Bar Chart */}
                    <svg
                        viewBox="0 0 440 210"
                        className="w-full h-[210px] select-none"
                        role="img"
                        aria-label="Biểu đồ tăng trưởng doanh nghiệp"
                    >
                        {[0, 0.5, 1].map((ratio, idx) => {
                            const y = 175 - ratio * 140;
                            const val = Math.round(maxTenantValue * ratio);
                            return (
                                <g key={idx}>
                                    <line
                                        x1="34"
                                        y1={y}
                                        x2="425"
                                        y2={y}
                                        stroke="#E2E8F0"
                                        strokeDasharray={ratio === 0 ? undefined : '4 4'}
                                    />
                                    <text
                                        x="28"
                                        y={y + 4}
                                        textAnchor="end"
                                        className="fill-slate-400 text-[10px] font-mono"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Cột doanh nghiệp mới */}
                        {monthlySeries.map((pt, idx) => {
                            const plotW = 385;
                            const step = plotW / monthlySeries.length;
                            const cx = 38 + idx * step + step / 2;
                            const barH = Math.max(3, (pt.newTenants / maxTenantValue) * 140);
                            return (
                                <g
                                    key={pt.monthKey}
                                    onMouseEnter={() => setHoveredGrowthIdx(idx)}
                                    onMouseLeave={() => setHoveredGrowthIdx(null)}
                                    className="cursor-pointer"
                                >
                                    <rect
                                        x={cx - 8}
                                        y={175 - barH}
                                        width="16"
                                        height={barH}
                                        rx="3"
                                        fill="#FBBF24"
                                        opacity="0.85"
                                    />
                                    <text
                                        x={cx}
                                        y="194"
                                        textAnchor="middle"
                                        className="fill-slate-500 text-[9px] font-mono"
                                    >
                                        {pt.label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Đường tăng trưởng tổng doanh nghiệp */}
                        <polyline
                            fill="none"
                            stroke="#0284C7"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={monthlySeries
                                .map((pt, idx) => {
                                    const plotW = 385;
                                    const step = plotW / monthlySeries.length;
                                    const cx = 38 + idx * step + step / 2;
                                    const cy = 175 - (pt.totalTenants / maxTenantValue) * 140;
                                    return `${cx},${cy}`;
                                })
                                .join(' ')}
                        />

                        {/* Các điểm nút trên đường tăng trưởng */}
                        {monthlySeries.map((pt, idx) => {
                            const plotW = 385;
                            const step = plotW / monthlySeries.length;
                            const cx = 38 + idx * step + step / 2;
                            const cy = 175 - (pt.totalTenants / maxTenantValue) * 140;
                            return (
                                <circle
                                    key={pt.monthKey}
                                    cx={cx}
                                    cy={cy}
                                    r={hoveredGrowthIdx === idx ? 5 : 3.5}
                                    fill="#FFFFFF"
                                    stroke="#0284C7"
                                    strokeWidth="2.5"
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* ================= HÀNG DƯỚI: CƠ CẤU GÓI DỊCH VỤ & CẢNH BÁO CÔNG NỢ ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cơ cấu phân bổ gói dịch vụ */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Phân bổ Doanh nghiệp theo Gói Dịch vụ
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tỷ trọng khách hàng và đóng góp MRR từng phân khúc gói cước
                            </p>
                        </div>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>

                    <div className="space-y-3.5 pt-1">
                        {stats.planBreakdown.map((item) => (
                            <div key={item.planKey} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded border text-[11px] font-bold ${item.meta.badgeClass}`}
                                        >
                                            {item.meta.label}
                                        </span>
                                        <span className="font-bold text-slate-700">
                                            {item.count} doanh nghiệp ({item.percent}%)
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-700">
                                        {item.mrr.toLocaleString('vi-VN')} ₫/tháng
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.meta.barClass}`}
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danh sách Công nợ Quá hạn & Cảnh báo cần xử lý */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Danh sách Công nợ Quá hạn (OVERDUE)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Các kỳ cước đã quá hạn thanh toán cần đôn đốc hoặc tạm khóa dịch vụ
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal('OVERDUE_DEBT')}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                                Xem tất cả →
                            </button>
                        </div>

                        {stats.overdueInvoices.length === 0 ? (
                            <div className="p-8 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center text-xs text-emerald-700 font-semibold">
                                Tất cả kỳ cước đều đúng hạn thanh toán.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {stats.overdueInvoices.slice(0, 3).map((inv) => {
                                    const debt = Math.max(0, inv.totalAmount - inv.paidAmount);
                                    return (
                                        <div
                                            key={inv.id}
                                            className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-rose-700">
                                                        {inv.invoiceCode}
                                                    </span>
                                                    <span className="font-bold text-slate-900">{inv.tenantName}</span>
                                                    <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono text-[10px]">
                                                        {inv.tenantCode}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-rose-500" />
                                                    <span>Hạn thanh toán: {formatDateVN(inv.dueDate)}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-mono font-bold text-rose-600 text-sm">
                                                    {debt.toLocaleString('vi-VN')} ₫
                                                </div>
                                                {onNavigateSection && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onNavigateSection('billing')}
                                                        className="mt-1 text-[11px] font-bold text-sky-700 hover:underline cursor-pointer"
                                                    >
                                                        Thu tiền / Khóa DV →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= MODAL THỐNG KÊ & ĐỐI SOÁT CHI TIẾT ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {activeModal === 'TOTAL_TENANTS' &&
                                        `Chi tiết Tổng số Doanh nghiệp (${stats.totalTenants} đơn vị)`}
                                    {activeModal === 'NEW_TENANTS' &&
                                        `Danh sách Doanh nghiệp mới trong 30 ngày (+${stats.newTenantsCount})`}
                                    {activeModal === 'TOTAL_VEHICLES' &&
                                        `Phân bổ Phương tiện Toàn nền tảng (${stats.totalVehicles}/${stats.totalVehicleQuota} xe)`}
                                    {activeModal === 'MRR_REVENUE' &&
                                        `Chi tiết Doanh thu Định kỳ Hàng tháng — MRR (${stats.mrr.toLocaleString('vi-VN')} ₫)`}
                                    {activeModal === 'OVERDUE_DEBT' &&
                                        `Chi tiết Công nợ Quá hạn (${stats.totalOverdueDebt.toLocaleString('vi-VN')} ₫)`}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Dữ liệu đối soát trực tiếp từ hệ thống quản trị DriveLinker
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-3 text-xs">
                            {(activeModal === 'TOTAL_TENANTS' ||
                                activeModal === 'NEW_TENANTS' ||
                                activeModal === 'TOTAL_VEHICLES' ||
                                activeModal === 'MRR_REVENUE') && (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                                                <th className="py-2.5 px-3">Doanh nghiệp</th>
                                                <th className="py-2.5 px-3">Trạng thái</th>
                                                <th className="py-2.5 px-3">Gói dịch vụ</th>
                                                <th className="py-2.5 px-3">Phương tiện</th>
                                                <th className="py-2.5 px-3 text-right">Phí gói / tháng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(activeModal === 'NEW_TENANTS'
                                                ? stats.newTenantsList
                                                : activeModal === 'MRR_REVENUE'
                                                    ? stats.activeTenants
                                                    : tenants
                                            ).map((t) => {
                                                const cars = vehicleCountMap[t.id] || 0;
                                                return (
                                                    <tr key={t.id} className="hover:bg-slate-50">
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-slate-900">{t.name}</div>
                                                            <div className="font-mono text-[11px] text-slate-400">
                                                                {t.code} • Kích hoạt: {formatDateVN(t.activatedAt)}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            {t.status === 'ACTIVE' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                                                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                                                                </span>
                                                            ) : t.status === 'TRIAL' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px]">
                                                                    <Clock className="w-3 h-3" /> TRIAL
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                                                                    <Ban className="w-3 h-3" /> SUSPENDED
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-slate-700">
                                                            {PLAN_META[t.plan]?.label || t.plan}
                                                        </td>
                                                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                                            {cars} / {t.maxVehicles} xe
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                                                            {(t.monthlyFee || 0).toLocaleString('vi-VN')} ₫
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}

                            {activeModal === 'OVERDUE_DEBT' && (
                                <>
                                    {stats.overdueInvoices.length === 0 ? (
                                        <div className="py-10 text-center text-slate-400">
                                            Hiện không có công nợ quá hạn nào trên hệ thống.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                                                    <th className="py-2.5 px-3">Mã hóa đơn</th>
                                                    <th className="py-2.5 px-3">Doanh nghiệp</th>
                                                    <th className="py-2.5 px-3">Hạn thanh toán</th>
                                                    <th className="py-2.5 px-3 text-right">Còn nợ quá hạn</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {stats.overdueInvoices.map((inv) => (
                                                    <tr key={inv.id} className="hover:bg-rose-50/40">
                                                        <td className="py-3 px-3 font-mono font-bold text-rose-700">
                                                            {inv.invoiceCode}
                                                        </td>
                                                        <td className="py-3 px-3 font-bold text-slate-900">
                                                            {inv.tenantName} ({inv.tenantCode})
                                                        </td>
                                                        <td className="py-3 px-3 font-mono text-slate-600">
                                                            {formatDateVN(inv.dueDate)}
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                                                            {Math.max(0, inv.totalAmount - inv.paidAmount).toLocaleString(
                                                                'vi-VN'
                                                            )}{' '}
                                                            ₫
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            {onNavigateSection ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const targetTab =
                                            activeModal === 'OVERDUE_DEBT' ? 'billing' : 'tenants';
                                        setActiveModal(null);
                                        onNavigateSection(targetTab);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>
                                        {activeModal === 'OVERDUE_DEBT'
                                            ? 'Mở trang Công nợ & Thu tiền'
                                            : 'Mở trang Quản lý Doanh nghiệp'}
                                    </span>
                                </button>
                            ) : (
                                <span />
                            )}

                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}