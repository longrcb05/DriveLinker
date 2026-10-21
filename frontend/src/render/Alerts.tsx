import React, { useState } from 'react';
import { AlertOctagon, Check, Clock, Loader2 } from 'lucide-react';

interface AiAlert {
  id: string;
  timestamp: string;
  plateNumber: string;
  violationType: 'YAWNING' | 'EYES_CLOSED' | 'HEAD_DROP';
  drowsinessScore: number;
  status: 'UNRESOLVED' | 'RESOLVED';
  imageUrl: string;
}

const INITIAL_ALERTS: AiAlert[] = [
  { id: 'AL-001', timestamp: '10:45 AM - Hôm nay', plateNumber: '51G-123.45', violationType: 'EYES_CLOSED', drowsinessScore: 95, status: 'UNRESOLVED', imageUrl: '/assets/evidence_1.jpg' },
  { id: 'AL-002', timestamp: '09:12 AM - Hôm nay', plateNumber: '29A-333.44', violationType: 'YAWNING', drowsinessScore: 70, status: 'UNRESOLVED', imageUrl: '/assets/evidence_2.jpg' },
];

export default function Alerts() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [alerts, setAlerts] = useState<AiAlert[]>(INITIAL_ALERTS);
  // Lưu ID của alert đang được gửi request xử lý lên server
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ==========================================
  // 2. METHODS & HANDLERS
  // ==========================================

  /**
   * Phương thức Xử lý xác nhận cảnh báo AI (Bất đồng bộ)
   * @param alertId - Mã ID của cảnh báo cần đánh dấu hoàn tất
   */
  const handleResolveAlert = async (alertId: string) => {
    // Bước 1: Khóa nút bấm bằng cách set ID đang xử lý
    setProcessingId(alertId);

    try {
      // Bước 2: Giả lập call API PUT /api/alerts/{id}/resolve
      await new Promise(resolve => setTimeout(resolve, 800)); // Call backend mất 800ms
      console.log(`Đã gửi API Update status cho Alert ID: ${alertId}`);

      // Bước 3: Sau khi backend báo 200 OK -> Cập nhật lại UI State của React
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, status: 'RESOLVED' as const } : alert
        )
      );
    } catch (error) {
      console.error("Lỗi khi update status cảnh báo:", error);
    } finally {
      // Bước 4: Mở khóa nút bấm
      setProcessingId(null);
    }
  };

  /**
   * Helper function: Dịch Enum Lỗi AI sang Tiếng Việt hiển thị
   */
  const translateViolation = (type: AiAlert['violationType']) => {
    switch (type) {
      case 'EYES_CLOSED': return 'Nhắm mắt quá 3s';
      case 'YAWNING': return 'Ngáp liên tục';
      case 'HEAD_DROP': return 'Gục đầu nguy hiểm';
      default: return 'Không xác định';
    }
  };

  // ==========================================
  // 3. RENDER
  // ==========================================
  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">Nhật ký Cảnh báo AI</h2>
          <p className="text-xs font-medium text-slate-500">Hệ thống phân tích điểm buồn ngủ theo thời gian thực từ Module YOLOv8.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert) => {
          // Kiểm tra xem item này có đang bị "quay loading" không
          const isProcessing = processingId === alert.id;

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border ${alert.status === 'UNRESOLVED'
                  ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                  : 'border-slate-200 bg-white opacity-80'
                } shadow-sm flex items-center justify-between transition-all`}
            >
              <div className="flex gap-6 items-center">
                {/* Vùng ảnh bằng chứng AI */}
                <div className="w-24 h-16 bg-slate-800 rounded-md overflow-hidden flex items-center justify-center relative border border-slate-300">
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest">NO SIGNAL</span>
                  {/* Thực tế sẽ dùng thẻ img khi có URL thật */}
                </div>

                {/* Thông tin Text */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-lg leading-none">{alert.plateNumber}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded tracking-wider">{alert.id}</span>
                  </div>
                  <div className={`text-sm font-semibold mb-1 ${alert.status === 'UNRESOLVED' ? 'text-rose-600' : 'text-slate-600'}`}>
                    Lỗi: {translateViolation(alert.violationType)} <span className="font-normal text-slate-500">(Điểm số: {alert.drowsinessScore}/100)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-2">
                    <Clock className="w-3.5 h-3.5" /> {alert.timestamp}
                  </div>
                </div>
              </div>

              {/* Vùng nút thao tác (Actions) */}
              <div>
                {alert.status === 'UNRESOLVED' ? (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {/* Nếu đang xử lý thì hiện icon quay Loading, ngược lại hiện icon Check */}
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isProcessing ? 'Đang xác thực...' : 'Xác nhận xử lý'}
                  </button>
                ) : (
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 text-sm font-bold rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" /> Đã giải quyết
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}