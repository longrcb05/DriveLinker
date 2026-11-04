import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type DialogType = 'success' | 'warning' | 'danger' | 'info';

export interface DialogOptions {
  title?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: DialogType;
}

interface DialogContextValue {
  showAlert: (message: string, options?: DialogOptions) => Promise<void>;
  showConfirm: (message: string, options?: DialogOptions) => Promise<boolean>;
  showToast: (message: string, type?: DialogType) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// Global event bus để gọi dialog/toast từ bất kỳ file nào mà không cần React Hook
export const dlDialog = {
  alert: (message: string, options?: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      window.dispatchEvent(
        new CustomEvent('dl_dialog_request', {
          detail: {
            isConfirm: false,
            message,
            options,
            resolve: () => resolve(),
          },
        })
      );
    });
  },
  confirm: (message: string, options?: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      window.dispatchEvent(
        new CustomEvent('dl_dialog_request', {
          detail: {
            isConfirm: true,
            message,
            options,
            resolve: (val: boolean) => resolve(val),
          },
        })
      );
    });
  },
  toast: (message: string, type: DialogType = 'success') => {
    window.dispatchEvent(
      new CustomEvent('dl_toast_request', {
        detail: { message, type },
      })
    );
  },
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    message: string;
    title: string;
    type: DialogType;
    isConfirm: boolean;
    confirmText: string;
    cancelText: string;
  }>({
    message: '',
    title: '',
    type: 'info',
    isConfirm: false,
    confirmText: 'Đồng ý',
    cancelText: 'Hủy bỏ',
  });

  const resolverRef = useRef<((value: any) => void) | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: DialogType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showAlert = useCallback(
    (message: string, options?: DialogOptions): Promise<void> => {
      return new Promise((resolve) => {
        setModalConfig({
          message,
          title: options?.title || (options?.type === 'success' ? 'Thành công' : options?.type === 'warning' ? 'Cảnh báo' : options?.type === 'danger' ? 'Lỗi' : 'Thông báo'),
          type: options?.type || 'info',
          isConfirm: false,
          confirmText: options?.confirmText || 'Đồng ý',
          cancelText: 'Đóng',
        });
        resolverRef.current = () => resolve();
        setModalOpen(true);
      });
    },
    []
  );

  const showConfirm = useCallback(
    (message: string, options?: DialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setModalConfig({
          message,
          title: options?.title || 'Xác nhận thao tác',
          type: options?.type || 'warning',
          isConfirm: true,
          confirmText: options?.confirmText || 'Xác nhận',
          cancelText: options?.cancelText || 'Hủy bỏ',
        });
        resolverRef.current = (result: boolean) => resolve(result);
        setModalOpen(true);
      });
    },
    []
  );

  // Lắng nghe sự kiện toàn cục từ Event Bus
  React.useEffect(() => {
    const handleDialogRequest = (e: any) => {
      const { isConfirm, message, options, resolve } = e.detail;
      if (isConfirm) {
        showConfirm(message, options).then(resolve);
      } else {
        showAlert(message, options).then(resolve);
      }
    };

    const handleToastRequest = (e: any) => {
      const { message, type } = e.detail;
      showToast(message, type);
    };

    window.addEventListener('dl_dialog_request', handleDialogRequest);
    window.addEventListener('dl_toast_request', handleToastRequest);

    return () => {
      window.removeEventListener('dl_dialog_request', handleDialogRequest);
      window.removeEventListener('dl_toast_request', handleToastRequest);
    };
  }, [showAlert, showConfirm, showToast]);

  const handleConfirm = () => {
    setModalOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const getIcon = () => {
    switch (modalConfig.type) {
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'danger':
        return <AlertCircle className="w-8 h-8 text-rose-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-sky-500" />;
    }
  };

  const getIconBg = () => {
    switch (modalConfig.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100 ring-4 ring-emerald-50/50';
      case 'warning':
        return 'bg-amber-50 border-amber-100 ring-4 ring-amber-50/50';
      case 'danger':
        return 'bg-rose-50 border-rose-100 ring-4 ring-rose-50/50';
      case 'info':
      default:
        return 'bg-sky-50 border-sky-100 ring-4 ring-sky-50/50';
    }
  };

  const getConfirmBtnClass = () => {
    switch (modalConfig.type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';
      case 'info':
      default:
        return 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}

      {/* =========================================================================
          1. TOAST NOTIFICATIONS (Nổi góc trên bên phải)
          ========================================================================= */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              toast.type === 'success'
                ? 'bg-white/95 text-slate-800 border-emerald-200 shadow-emerald-500/10'
                : toast.type === 'danger'
                ? 'bg-white/95 text-slate-800 border-rose-200 shadow-rose-500/10'
                : toast.type === 'warning'
                ? 'bg-white/95 text-slate-800 border-amber-200 shadow-amber-500/10'
                : 'bg-white/95 text-slate-800 border-sky-200 shadow-sky-500/10'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'danger' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
            </div>
            <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* =========================================================================
          2. CUSTOM POPUP MODAL (Thay thế toàn bộ window.alert & window.confirm)
          ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
          {/* Backdrop mờ huyền ảo */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={modalConfig.isConfirm ? handleCancel : handleConfirm}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
            {/* Icon Bubble */}
            <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${getIconBg()}`}>
              {getIcon()}
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
              {modalConfig.title}
            </h3>

            {/* Message Body */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-line font-medium">
              {modalConfig.message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              {modalConfig.isConfirm && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-all duration-200 active:scale-95 ${getConfirmBtnClass()}`}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export default DialogProvider;

