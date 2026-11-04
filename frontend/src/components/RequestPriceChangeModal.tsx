import { dlDialog } from '../context/DialogContext';
import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
    contractId: string;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

export default function RequestPriceChangeModal({ contractId, onClose, onSubmit }: Props) {
    const { t } = useLanguage();
    const [reason, setReason] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return dlDialog.alert(t('contracts.requestPriceModalAlert'), { type: 'warning' });
        onSubmit(reason);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">

                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">{t('contracts.requestPriceModalTitle')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex gap-3 text-sky-700 text-xs font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{t('contracts.requestPriceModalNotice', { contractId })}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('contracts.requestPriceModalLabel')} <span className="text-rose-500">*</span></label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('contracts.requestPriceModalPlaceholder')}
                            rows={5}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:bg-white text-sm text-slate-700 resize-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-[#0EA5E9] hover:bg-sky-600 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                            <Send className="w-4 h-4" /> {t('contracts.requestPriceModalSubmit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
