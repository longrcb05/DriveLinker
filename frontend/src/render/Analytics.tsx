/**
 * @file Analytics.tsx
 * @description Phân hệ Phân tích và Báo cáo (Analytics & Alerts).
 * Kết nối dữ liệu từ Database PostgreSQL qua Backend Next.js API (/api/analytics/events và /api/analytics/kpis).
 * Tự động đồng bộ với 14 cảnh báo AI thực tế trong database từ bộ dữ liệu test_yolo/bang_chung.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Download, ChevronRight, AlertTriangle, ShieldCheck,
  Activity, BarChart3, PieChart, FileText, Loader2, Eye, X, Image as ImageIcon
} from 'lucide-react';
import { analyticsService, AnalyticsEvent } from '../services/analyticsService';

export default function Analytics() {
  const { t } = useLanguage();

  // Bộ chọn ngày: Mặc định hiển thị Tất cả hoặc ngày mới nhất có sự kiện vi phạm
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Tải dữ liệu từ Backend API (kết nối PostgreSQL)
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getEvents({
        date: selectedDate === 'ALL' ? undefined : selectedDate,
      });
      setEvents(data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phân tích:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  /**
   * Tính toán chỉ số thống kê tổng hợp (Data Aggregation)
   */
  const stats = useMemo(() => {
    return analyticsService.calculateKpis(events);
  }, [events]);

  /**
   * Thuật toán Kết xuất tệp CSV
   */
  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      const headers = [
        t('analytics.colId'),
        'Date',
        t('analytics.colTime'),
        t('analytics.colVehicle'),
        'Vehicle Model',
        t('analytics.colDriver'),
        t('analytics.colType'),
        t('analytics.colSeverity'),
        t('analytics.colStatus'),
        'Evidence File'
      ];
      const csvRows = [headers.join(',')];

      events.forEach(e => {
        csvRows.push(
          `"${e.id}","${e.date}","${e.time}","${e.vehicle}","${e.vehicleModel || ''}","${e.driver}","${e.type}","${e.severity}","${e.status}","${e.evidenceUrl || ''}"`
        );
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `BaoCao_VanHanh_${selectedDate || 'ALL'}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">

      {/* KHU VỰC 1: HEADER & CÔNG CỤ BỘ LỌC */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span className="hover:text-slate-800 cursor-pointer transition-colors">MENU</span>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-sky-600 cursor-pointer">{t('nav.analytics')}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{t('analytics.title')}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('analytics.subtitle')} • Dữ liệu đồng bộ trực tiếp từ Database hệ thống
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Nút lọc nhanh các ngày có dữ liệu thực tế */}
            <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
              <button
                onClick={() => setSelectedDate('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDate === 'ALL'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ngày ({events.length})
              </button>
              {['2026-11-04', '2026-11-03', '2026-11-02', '2026-11-01', '2026-10-31'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all hidden sm:block ${
                    selectedDate === d
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.slice(5).replace('-', '/')}
                </button>
              ))}
            </div>

            {/* Bộ chọn ngày (Date Picker) tùy ý */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate === 'ALL' ? '' : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || 'ALL')}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all shadow-sm cursor-pointer"
              />
            </div>

            {/* Nút xuất báo cáo */}
            <button
              onClick={handleExportCSV}
              disabled={isExporting || events.length === 0}
              className="bg-[#0EA5E9] text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-sky-600 transition-all shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isExporting ? t('analytics.exporting') : t('analytics.exportCsv')}
            </button>
          </div>
        </div>
      </div>

      {/* KHU VỰC 2: THẺ THỐNG KÊ (KPI CARDS) */}
      <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytics.totalViolations')}</p>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{isLoading ? '...' : stats.total}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Sự kiện ghi nhận</p>
        </div>

        <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{t('tracking.kpiDrowsyAlert')}</p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-3xl font-bold text-rose-600">{isLoading ? '...' : stats.highRiskCount}</h3>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Mức độ Nguy hiểm / Khẩn cấp</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytics.resolved')}</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{isLoading ? '...' : `${stats.resolveRate}%`}</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">{stats.resolved}/{stats.total} đã xử lý</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytics.safetyScore')}</p>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {isLoading ? '...' : stats.safetyScore} <span className="text-sm font-medium text-slate-500">/ 100</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Đánh giá an toàn vận hành</p>
        </div>
      </div>

      {/* KHU VỰC 3: BIỂU ĐỒ TRỰC QUAN (CHARTS) */}
      <div className="px-6 flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[280px]">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-sky-500" /> {t('analytics.distributionTitle')}
          </h3>
          
          {/* Phân bố cảnh báo theo thời gian thực */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-5 gap-2 h-36 items-end pb-2 border-b border-slate-100">
              {[
                { label: '31/10', count: events.filter(e => e.date === '2026-10-31').length },
                { label: '01/11', count: events.filter(e => e.date === '2026-11-01').length },
                { label: '02/11', count: events.filter(e => e.date === '2026-11-02').length },
                { label: '03/11', count: events.filter(e => e.date === '2026-11-03').length },
                { label: '04/11', count: events.filter(e => e.date === '2026-11-04').length },
              ].map((day, idx) => {
                const heightPercent = stats.total > 0 ? Math.round((day.count / Math.max(1, stats.total)) * 100) : 10;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count} vụ
                    </span>
                    <div
                      className="w-full max-w-[42px] bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-lg transition-all duration-500 group-hover:from-sky-600 group-hover:to-sky-500"
                      style={{ height: `${Math.max(15, heightPercent * 1.5)}%` }}
                    />
                    <span className="text-[11px] font-bold text-slate-500 mt-1">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Biểu đồ phân bố tần suất vi phạm an toàn theo các ngày của lộ trình thuê
            </p>
          </div>
        </div>

        <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" /> {t('analytics.classificationTitle')}
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
              {stats.total} {t('analytics.casesCount')}
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {[
              { label: t('analytics.typeDrowsy'), type: 'Nhắm mắt kéo dài', color: 'bg-rose-500' },
              { label: 'Gục đầu nguy hiểm', type: 'Gục đầu nguy hiểm', color: 'bg-orange-500' },
              { label: t('analytics.typeYawn'), type: 'Ngáp liên tục', color: 'bg-amber-500' },
              { label: 'Vượt tốc độ / Lệch làn', type: 'Vượt tốc độ', color: 'bg-sky-500' }
            ].map((item, i) => {
              const count = events.filter(e => e.type === item.type).length;
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

              return (
                <div key={i}>
                  <div className="flex justify-between text-[11px] font-bold mb-1 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                      {item.label}
                    </span>
                    <span className="font-mono">{count} vụ ({percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full transition-all duration-700`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KHU VỰC 4: BẢNG DỮ LIỆU CHI TIẾT (DATA TABLE TỪ DATABASE) */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('analytics.historyTableTitle')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dữ liệu gốc từ bảng alerts trong Database PostgreSQL ({events.length} bản ghi)
              </p>
            </div>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-sky-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải DB...
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto max-h-[460px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-4">{t('analytics.colTime')}</th>
                  <th className="p-4">{t('analytics.colVehicle')}</th>
                  <th className="p-4">{t('analytics.colDriver')}</th>
                  <th className="p-4">{t('analytics.colType')}</th>
                  <th className="p-4 text-center">Bằng chứng AI</th>
                  <th className="p-4 text-center">{t('analytics.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{e.date}</span>
                      <span className="text-slate-400 ml-1.5 font-mono text-xs">{e.time}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 font-mono">{e.vehicle}</div>
                      {e.vehicleModel && (
                        <div className="text-[10px] text-slate-400">{e.vehicleModel}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 whitespace-nowrap font-medium">{e.driver}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{e.type}</span>
                      <span
                        className={`ml-2 text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                          e.severity === 'HIGH'
                            ? 'border-rose-200 text-rose-600 bg-rose-50'
                            : e.severity === 'MEDIUM'
                            ? 'border-amber-200 text-amber-600 bg-amber-50'
                            : 'border-sky-200 text-sky-600 bg-sky-50'
                        }`}
                      >
                        {e.severity}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {e.evidenceUrl ? (
                        <button
                          onClick={() => setPreviewImage(e.evidenceUrl!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Xem ảnh
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          e.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700 animate-pulse'
                        }`}
                      >
                        {e.status === 'RESOLVED' ? t('analytics.resolved') : t('analytics.unresolved')}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Trạng thái rỗng (Empty State) khi bộ lọc không có kết quả */}
                {events.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">
                        {t('analytics.emptyDate', { date: selectedDate || '---' })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{t('analytics.emptyDatePrompt')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XEM ẢNH BẰNG CHỨNG THỰC TẾ TỪ YOLO AI */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Hình Ảnh Bằng Chứng Vi Phạm (YOLO AI)</h4>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex justify-center items-center max-h-[500px] overflow-auto">
              <img
                src={previewImage}
                alt="Bằng chứng vi phạm"
                className="rounded-lg max-h-[460px] object-contain shadow-lg"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Đường dẫn tệp: <code className="font-mono text-slate-700">{previewImage}</code></span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
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
