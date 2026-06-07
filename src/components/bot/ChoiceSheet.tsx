// src/components/bot/ChoiceSheet.tsx
// Bottom sheet premium: pilihan Manual vs AI Bot

import React, { useEffect, useState } from 'react';
import { X, FileText, Bot, Sparkles, Zap } from 'lucide-react';

export type ChoiceSheetMode = 'order' | 'restok';

interface ChoiceSheetProps {
  mode: ChoiceSheetMode;
  open: boolean;
  onManual: () => void;
  onBot: () => void;
  onClose: () => void;
}

export function ChoiceSheet({ mode, open, onManual, onBot, onClose }: ChoiceSheetProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => setMounted(false), 350);
    }
  }, [open]);

  if (!mounted) return null;

  const isOrder = mode === 'order';
  const title = isOrder ? 'Tambah Order' : 'Restok Barang';
  const subtitle = isOrder
    ? 'Pilih cara input pesanan pelanggan'
    : 'Pilih cara input restok barang';

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`
        relative bg-white rounded-t-3xl shadow-2xl transition-transform duration-350 ease-out
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {/* Manual card */}
            <button
              onClick={onManual}
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 active:scale-[0.98] rounded-2xl p-4 text-left transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800">Input Manual</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Isi form langkah demi langkah
                  </p>
                </div>
                <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>

            {/* AI Bot card */}
            <button
              onClick={onBot}
              className={`w-full active:scale-[0.98] rounded-2xl p-4 text-left transition-all shadow-lg group relative overflow-hidden
                ${isOrder
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <div className="flex items-center gap-3.5 relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white">Gunakan AI Bot</p>
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">AI</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/80 font-medium mt-0.5">
                    Ketik bebas — AI parse otomatis
                  </p>
                </div>
                <div className="flex items-center gap-1 text-white/70">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase">&lt;3s</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
