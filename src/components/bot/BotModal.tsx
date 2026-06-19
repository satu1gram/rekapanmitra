// src/components/bot/BotModal.tsx
// Modal full-screen chat bot dengan mode order/restok

import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, MoreVertical } from 'lucide-react';
import { ChatInterface, type ChatMode } from './ChatInterface';
import { useProfile } from '@/hooks/useProfile';
import type { ParsedOrder, ParsedRestok } from '@/lib/orderParser';
import type { MitraLevel } from '@/types';

interface BotModalProps {
  mode: ChatMode;
  open: boolean;
  onClose: () => void;
  onConfirmOrder?: (parsed: ParsedOrder, pricingInfo?: { items: any[], tier: string }) => Promise<boolean>;
  onConfirmRestok?: (parsed: ParsedRestok & { buyPricePerBottle: number }) => Promise<boolean>;
}

export function BotModal({ mode, open, onClose, onConfirmOrder, onConfirmRestok }: BotModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { mitraLevel, customBuyPrice } = useProfile();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setTimeout(() => setVisible(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
      setTimeout(() => setMounted(false), 350);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!mounted) return null;

  const isRestok = mode === 'restok';
  const headerColor = isRestok ? 'bg-blue-600' : 'bg-emerald-600';
  const titleText = isRestok ? '📦 Bot Restok' : '🛒 Bot Order';
  const statusText = isRestok ? 'Mode Restok ke Pusat' : 'Mode Catat Order';

  return (
    <div className={`fixed inset-0 z-[150] flex flex-col justify-center items-center transition-all duration-350 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container — mobile frame di desktop */}
      <div className={`
        relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden
        flex flex-col shadow-2xl
        transition-transform duration-350 ease-out
        ${visible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}
      `}>
        {/* Header */}
        <header className={`${headerColor} px-4 pt-11 pb-3 flex items-center gap-3 shrink-0 shadow-md sm:pt-4`}>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
            🤖
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-white leading-tight truncate">{titleText}</h2>
            <p className="text-[10px] text-white/70 font-bold mt-0.5">{statusText} • online</p>
          </div>

          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden bg-white">
          <ChatInterface
            mode={mode}
            mitraLevel={mitraLevel as MitraLevel}
            customBuyPrice={customBuyPrice}
            onConfirmOrder={onConfirmOrder}
            onConfirmRestok={onConfirmRestok}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
