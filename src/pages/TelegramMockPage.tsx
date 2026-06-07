// src/pages/TelegramMockPage.tsx
// Halaman demo bot — menggunakan ChatInterface yang sama dengan BotModal

import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { ChatInterface } from '@/components/bot/ChatInterface';

export default function TelegramMockPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center w-full">
      <div className="w-full max-w-md bg-white h-screen flex flex-col font-sans select-none overflow-hidden text-slate-800 sm:shadow-2xl sm:border-x sm:border-slate-200 relative">

        {/* Header gaya Telegram */}
        <header className="px-4 pt-11 pb-3 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0 shadow-sm z-10 sm:pt-3">
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all text-slate-500">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>

          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
            🤖
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-slate-900 leading-tight truncate">Rekapan Mitra Bot</h2>
            <p className="text-[10px] text-blue-500 font-bold mt-0.5">bot • online</p>
          </div>

          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500">
            <MoreVertical className="h-5 w-5" />
          </button>
        </header>

        {/* Chat — mode demo (tanpa onConfirm → tidak ada simpan ke DB) */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface mode="demo" />
        </div>
      </div>
    </div>
  );
}
