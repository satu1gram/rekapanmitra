// src/components/bot/ChatInterface.tsx
// Komponen chat reusable yang dipakai oleh BotModal dan TelegramMockPage
// Props: mode menentukan konteks (order/restok/demo)

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send, Check, Pencil, X, CheckCircle2,
  Brain, ShieldAlert, Package2, User2, Bot
} from 'lucide-react';
import {
  parseWithAI, saveLearningPattern, getLearningPatterns,
  type ParseResult, type ParsedOrder, type ParsedRestok, type LearningPattern,
} from '@/lib/orderParser';
import { MITRA_LEVELS, TIER_PRICING, type MitraLevel, type TierType } from '@/types';
import { recalcPricing, getActiveTier, isBeautyProduct, PRICE_TABLE, getTierByQty } from '@/lib/pricing';
import { useCustomers } from '@/hooks/useCustomersDb';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────
export type ChatMode = 'order' | 'restok' | 'demo';

type MessageType = 'text' | 'parsed_order' | 'parsed_restok' | 'out_of_scope' | 'error' | 'system' | 'success';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  type: MessageType;
  text?: string;
  parseResult?: ParseResult;
  timestamp: Date;
}

interface ChatInterfaceProps {
  mode: ChatMode;
  mitraLevel?: MitraLevel;
  customBuyPrice?: number | null;
  onConfirmOrder?: (parsed: ParsedOrder, pricingInfo?: { items: { productName: string; quantity: number; pricePerBottle: number; subtotal: number }[], tier: TierType }) => Promise<boolean>;
  onConfirmRestok?: (parsed: ParsedRestok & { buyPricePerBottle: number }) => Promise<boolean>;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(d: Date) {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function renderText(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Bubble: User ─────────────────────────────────────────────────
function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="bg-[#E1FFC7] text-slate-800 px-3.5 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm border border-[#D0F0B6]">
        <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-700/60 font-medium">
          <span>{formatTime(msg.timestamp)}</span>
          <div className="flex -space-x-1">
            <Check className="h-2.5 w-2.5 text-blue-500" />
            <Check className="h-2.5 w-2.5 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bubble: Bot text ─────────────────────────────────────────────
function BotTextBubble({ msg }: { msg: ChatMessage }) {
  const isSystem = msg.type === 'system';
  const isError = msg.type === 'error';
  const isSuccess = msg.type === 'success';

  return (
    <div className="flex">
      <div className={`
        px-3.5 py-2.5 rounded-2xl rounded-tl-sm max-w-[88%] shadow-sm text-xs leading-relaxed border
        ${isError ? 'bg-red-50 border-red-200 text-red-700'
          : isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : isSystem ? 'bg-slate-50 border-slate-100 text-slate-500 italic'
          : 'bg-white border-slate-100 text-slate-800'}
      `}>
        {renderText(msg.text || '')}
        <span className="block text-right text-[9px] text-slate-400 mt-1 font-medium">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Bubble: Anti-injection shield ───────────────────────────────
function ShieldBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex">
      <div className="bg-red-50 border border-red-200 px-3.5 py-3 rounded-2xl rounded-tl-sm max-w-[88%] shadow-sm space-y-1">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Diluar Konteks</span>
        </div>
        <p className="text-xs text-red-700 leading-relaxed">{msg.text}</p>
        <span className="block text-right text-[9px] text-red-400/70 font-medium">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Koreksi form ─────────────────────────────────────────────────
function CorrectionForm({ result, onSave, onCancel }: {
  result: ParsedOrder | ParsedRestok;
  onSave: (corrected: ParsedOrder | ParsedRestok) => void;
  onCancel: () => void;
}) {
  const isOrder = result.intent === 'order';
  const [pelanggan, setPelanggan] = useState(isOrder ? (result as ParsedOrder).pelanggan : '');
  const [hp, setHp] = useState(isOrder ? (result as ParsedOrder).hp : '');
  const [itemsStr, setItemsStr] = useState(result.items.map(i => `${i.qty} ${i.nama}`).join('\n'));
  const [catatan, setCatatan] = useState(result.catatan);

  function handleSave() {
    const parsedItems = itemsStr.split('\n').filter(l => l.trim()).map(l => {
      const match = l.match(/^(\d+)\s+(.+)$/);
      return match ? { qty: parseInt(match[1]), nama: match[2].trim() } : { qty: 1, nama: l.trim() };
    });

    if (isOrder) {
      onSave({ ...result, pelanggan, hp, items: parsedItems, catatan } as ParsedOrder);
    } else {
      onSave({ ...result, items: parsedItems, catatan } as ParsedRestok);
    }
  }

  return (
    <div className="bg-slate-50 border border-blue-200 rounded-2xl p-3 space-y-2.5 text-xs">
      <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest">✏️ Koreksi & Latih AI</p>

      {isOrder && (
        <>
          <div>
            <label className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Nama Pelanggan</label>
            <input className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-blue-500 transition-all"
              value={pelanggan} onChange={e => setPelanggan(e.target.value)} placeholder="Nama pelanggan..." />
          </div>
          <div>
            <label className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Nomor HP</label>
            <input className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-blue-500 transition-all"
              value={hp} onChange={e => setHp(e.target.value)} placeholder="08xxxx..." />
          </div>
        </>
      )}

      <div>
        <label className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Item (qty nama, 1 per baris)</label>
        <textarea className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-blue-500 transition-all resize-none"
          rows={3} value={itemsStr} onChange={e => setItemsStr(e.target.value)} />
      </div>

      <div>
        <label className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Catatan</label>
        <input className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-blue-500 transition-all"
          value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan tambahan..." />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-xl py-2 text-[10px] font-black uppercase tracking-wide transition-all shadow-sm">
          <CheckCircle2 className="w-3 h-3" /> Simpan & Latih AI
        </button>
        <button onClick={onCancel}
          className="px-3 py-2 rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-200 text-[10px] font-bold transition-all">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Kartu hasil ORDER ────────────────────────────────────────────
function OrderResultCard({ msg, onCorrect, onConfirm, confirming, mitraLevel, onSuccess }: {
  msg: ChatMessage;
  onCorrect: (raw: string, corrected: ParsedOrder) => void;
  onConfirm: (result: ParsedOrder, pricingInfo?: { items: { productName: string; quantity: number; pricePerBottle: number; subtotal: number }[], tier: TierType }) => Promise<boolean>;
  confirming: boolean;
  mitraLevel?: MitraLevel;
  customBuyPrice?: number | null;
  onSuccess?: () => void;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const result = msg.parseResult as ParsedOrder;
  const { customers, getCustomerByName, findCustomerFuzzy } = useCustomers();

  // Lookup customer dengan prioritas:
  // 1. Exact HP match  → pasti sama
  // 2. Exact name match → hampir pasti sama
  // 3. Fuzzy name match → kemungkinan sama
  const normalizeName = (n: string) =>
    n.toLowerCase().replace(/^(bu|pak|bpk|ibu|mbak|mas|kak|si|om|tante)\s+/i, '').trim();

  let existingCustomer: typeof customers[0] | undefined;
  let matchConfidence: 'hp' | 'name' | 'fuzzy' | undefined;

  if (result.hp) {
    const byHp = customers.find(c => c.phone === result.hp);
    if (byHp) { existingCustomer = byHp; matchConfidence = 'hp'; }
  }
  if (!existingCustomer && result.pelanggan) {
    const byName = getCustomerByName(result.pelanggan);
    if (byName) { existingCustomer = byName; matchConfidence = 'name'; }
  }
  if (!existingCustomer && result.pelanggan) {
    const byFuzzy = findCustomerFuzzy(result.pelanggan);
    if (byFuzzy) { existingCustomer = byFuzzy; matchConfidence = 'fuzzy'; }
  }
  
  // Hitung total qty
  const totalQty = result.items.reduce((sum, item) => sum + item.qty, 0);


  // Hitung Harga Jual & Profit dengan shared pricing utility
  const baseTier = (existingCustomer?.tier as TierType) || 'satuan';
  const activeTier = getActiveTier(baseTier, totalQty);

  // Konversi format item bot ke format pricing utility
  const pricedItems = recalcPricing(
    result.items.map(i => ({ productName: i.nama, quantity: i.qty })),
    baseTier
  );

  let totalHargaJual = pricedItems.reduce((s, i) => s + i.subtotal, 0);

  // Hitung Modal dari level mitra
  const myLevelStr = mitraLevel || 'reseller';
  const myTierData = PRICE_TABLE[myLevelStr] || PRICE_TABLE['reseller'];
  let totalModal = result.items.reduce((s, item) => {
    const isBeauty = isBeautyProduct(item.nama);
    const standardBuyPrice = isBeauty ? myTierData.beauty : myTierData.bp;
    const effectiveBuyPrice = mitraLevel === 'custom' && customBuyPrice != null ? customBuyPrice : standardBuyPrice;
    return s + effectiveBuyPrice * item.qty;
  }, 0);

  const totalProfit = totalHargaJual - totalModal;
  const customerTierPricing = { label: TIER_PRICING[activeTier]?.label || activeTier };

  function handleSaveCorrection(corrected: ParsedOrder | ParsedRestok) {
    onCorrect(result.raw, corrected as ParsedOrder);
    setShowCorrection(false);
  }

  const handleConfirmClick = async () => {
    const ok = await onConfirm(result, { items: pricedItems, tier: activeTier });
    if (ok) {
      setConfirmed(true);
      setCountdown(10);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (onSuccess) onSuccess();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onSuccess]);

  return (
    <div className="flex">
      <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-sm max-w-[92%] shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <User2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Order Pelanggan</span>
        </div>

        {!showCorrection && (
          <>
            <table className="w-full text-xs border-collapse">
              <tbody>
                {result.pelanggan && (
                  <tr>
                    <td className="py-0.5 text-slate-500 font-bold pr-2 w-20">Pelanggan:</td>
                    <td className="py-0.5">
                      <span className="text-slate-800 font-extrabold">{result.pelanggan}</span>
                      {existingCustomer ? (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          matchConfidence === 'fuzzy'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {matchConfidence === 'fuzzy' ? '⚠️ ' : '✓ '}Pelanggan Lama · {TIER_PRICING[existingCustomer.tier as TierType]?.label ?? existingCustomer.tier}
                        </span>
                      ) : (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">Pelanggan Baru · {customerTierPricing.label}</span>
                      )}
                    </td>
                  </tr>
                )}
                {result.hp && <tr><td className="py-0.5 text-slate-500 font-bold pr-2">No. HP:</td><td className="py-0.5 text-slate-800 font-bold">{result.hp}</td></tr>}
                {result.items.length > 0 && (
                  <tr>
                    <td className="py-0.5 text-slate-500 font-bold pr-2 align-top">Item:</td>
                    <td className="py-0.5">
                      {result.items.map((item, i) => (
                        <div key={i} className="text-slate-800 font-extrabold">• {item.qty}x {item.nama}</div>
                      ))}
                    </td>
                  </tr>
                )}
                {result.tanggal && <tr><td className="py-0.5 text-slate-500 font-bold pr-2 align-top">Tanggal:</td><td className="py-0.5 font-bold text-slate-800 flex items-center gap-1"><span>📅</span>{new Date(result.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>}
                {result.catatan && <tr><td className="py-0.5 text-slate-500 font-bold pr-2 align-top">Catatan:</td><td className="py-0.5 text-slate-500 text-[10px] italic">{result.catatan}</td></tr>}
                <tr>
                  <td colSpan={2}>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold">Total Harga</span>
                        <span className="text-sm font-black text-slate-800">Rp {totalHargaJual.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-emerald-600 font-bold">Estimasi Profit</span>
                        <span className="text-sm font-black text-emerald-600">+Rp {totalProfit.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {!confirmed ? (
              <div className="flex flex-col gap-2">
                {!result.pelanggan && (
                  <div className="w-full bg-red-50 text-red-600 border border-red-100 rounded-xl py-2 px-3 text-[10px] font-bold text-center">
                    ⚠️ Nama pelanggan belum terdeteksi. Silakan koreksi terlebih dahulu.
                  </div>
                )}
                <button onClick={handleConfirmClick}
                  disabled={confirming || !result.pelanggan}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {confirming ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {confirming ? 'Menyimpan...' : 'Konfirmasi & Simpan Order'}
                </button>
              </div>
            ) : (
              <button onClick={() => onSuccess && onSuccess()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all flex flex-col items-center justify-center leading-tight">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Order berhasil dicatat!</span>
                <span className="text-[9px] font-medium text-emerald-200 mt-0.5 normal-case">Kembali ke riwayat ({countdown}s)</span>
              </button>
            )}

            {!confirmed && (
              <button onClick={() => setShowCorrection(true)}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-blue-500 transition-colors">
                <Pencil className="w-2.5 h-2.5" /> Hasil kurang tepat? Koreksi & latih AI
              </button>
            )}
          </>
        )}

        {showCorrection && (
          <CorrectionForm result={result} onSave={handleSaveCorrection} onCancel={() => setShowCorrection(false)} />
        )}

        <span className="block text-right text-[9px] text-slate-400 font-medium">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Kartu hasil RESTOK ───────────────────────────────────────────
function RestokResultCard({ msg, onCorrect, onConfirm, confirming, mitraLevel, onSuccess }: {
  msg: ChatMessage;
  onCorrect: (raw: string, corrected: ParsedRestok) => void;
  onConfirm: (result: ParsedRestok) => Promise<boolean>;
  confirming: boolean;
  mitraLevel?: MitraLevel;
  customBuyPrice?: number | null;
  onSuccess?: () => void;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const result = msg.parseResult as ParsedRestok;
  const standardBuyPrice = mitraLevel ? MITRA_LEVELS[mitraLevel].buyPricePerBottle : 217000;
  const buyPrice = mitraLevel === 'custom' && customBuyPrice != null ? customBuyPrice : standardBuyPrice;
  const totalQty = result.items.reduce((s, i) => s + i.qty, 0);
  const totalHarga = totalQty * buyPrice;

  function handleSaveCorrection(corrected: ParsedOrder | ParsedRestok) {
    onCorrect(result.raw, corrected as ParsedRestok);
    setShowCorrection(false);
  }

  const handleConfirmClick = async () => {
    const ok = await onConfirm(result);
    if (ok) {
      setConfirmed(true);
      setCountdown(10);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (onSuccess) onSuccess();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onSuccess]);

  return (
    <div className="flex">
      <div className="bg-white border border-blue-100 p-3.5 rounded-2xl rounded-tl-sm max-w-[92%] shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 border-b border-blue-100 pb-2">
          <Package2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Restok ke Pusat</span>
        </div>

        {!showCorrection && (
          <>
            <table className="w-full text-xs border-collapse">
              <tbody>
                {result.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-0.5 text-slate-800 font-extrabold">• {item.qty}x {item.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-2.5 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-bold">Harga beli ({mitraLevel ? MITRA_LEVELS[mitraLevel].label : 'Reseller'})</span>
                <span className="text-slate-700 font-black">Rp {buyPrice.toLocaleString('id-ID')}/btl</span>
              </div>
              <div className="flex justify-between text-xs font-black">
                <span className="text-blue-700">Total Estimasi</span>
                <span className="text-blue-700">Rp {totalHarga.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {result.catatan && <p className="text-[10px] text-slate-500 italic">{result.catatan}</p>}

            {!confirmed ? (
              <button onClick={handleConfirmClick}
                disabled={confirming}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5">
                {confirming ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {confirming ? 'Menyimpan...' : 'Konfirmasi Restok'}
              </button>
            ) : (
              <button onClick={() => onSuccess && onSuccess()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all flex flex-col items-center justify-center leading-tight">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Restok berhasil dicatat!</span>
                <span className="text-[9px] font-medium text-blue-200 mt-0.5 normal-case">Kembali ke riwayat ({countdown}s)</span>
              </button>
            )}

            {!confirmed && (
              <button onClick={() => setShowCorrection(true)}
                className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-blue-500 transition-colors">
                <Pencil className="w-2.5 h-2.5" /> Hasil kurang tepat? Koreksi & latih AI
              </button>
            )}
          </>
        )}

        {showCorrection && (
          <CorrectionForm result={result} onSave={handleSaveCorrection} onCancel={() => setShowCorrection(false)} />
        )}

        <span className="block text-right text-[9px] text-slate-400 font-medium">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex">
      <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full"
              style={{ animation: 'typingDot 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Learning badge ───────────────────────────────────────────────
function LearningBadge() {
  const count = getLearningPatterns().length;
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
      <Brain className="w-2.5 h-2.5 text-emerald-600" />
      <span className="text-[9px] text-emerald-700 font-black">{count} pola dipelajari</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: ChatInterface
// ═══════════════════════════════════════════════════════════════════
export function ChatInterface({ mode, mitraLevel, customBuyPrice, onConfirmOrder, onConfirmRestok, onSuccess }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const addMsg = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg = { ...msg, id: uid(), timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const handleConfirmOrder = useCallback(async (result: ParsedOrder, pricingInfo?: { items: any[], tier: TierType }) => {
    if (!onConfirmOrder) return false;
    setConfirming(result.raw);
    try {
      const ok = await onConfirmOrder(result, pricingInfo);
      if (ok) scrollToBottom();
      return ok;
    } finally {
      setConfirming(null);
    }
  }, [onConfirmOrder, scrollToBottom]);

  const handleConfirmRestok = useCallback(async (result: ParsedRestok) => {
    if (!onConfirmRestok) return false;
    const standardBuyPrice = mitraLevel ? MITRA_LEVELS[mitraLevel].buyPricePerBottle : 217000;
    const buyPricePerBottle = mitraLevel === 'custom' && customBuyPrice != null ? customBuyPrice : standardBuyPrice;
    setConfirming(result.raw);
    try {
      const ok = await onConfirmRestok({ ...result, buyPricePerBottle });
      if (ok) scrollToBottom();
      return ok;
    } finally {
      setConfirming(null);
    }
  }, [onConfirmRestok, mitraLevel, scrollToBottom]);

  const handleCorrect = useCallback((raw: string, corrected: ParsedOrder | ParsedRestok) => {
    saveLearningPattern({ input: raw, corrected, savedAt: Date.now() } as LearningPattern);
    addMsg({ role: 'bot', type: 'system', text: '✅ Koreksi disimpan! AI akan ingat pola ini.' });
    scrollToBottom();
  }, [addMsg, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    addMsg({ role: 'user', type: 'text', text });
    setInputText('');
    scrollToBottom();

    // Shortcut konfirmasi & batal
    const lower = text.toLowerCase().trim();
    if (lower === 'ya' || lower === 'y') {
      addMsg({ role: 'bot', type: 'text', text: '✅ Baik! Silakan klik tombol konfirmasi pada kartu di atas.' });
      scrollToBottom(); return;
    }
    if (lower === 'batal' || lower === 'cancel') {
      addMsg({ role: 'bot', type: 'text', text: '❌ Dibatalkan. Ketik order baru jika diperlukan.' });
      scrollToBottom(); return;
    }

    setIsTyping(true);
    scrollToBottom();
    await new Promise(r => setTimeout(r, 700 + Math.random() * 500));

    try {
      const result = await parseWithAI(text);
      setIsTyping(false);

      if (result.intent === 'out_of_scope') {
        addMsg({ role: 'bot', type: 'out_of_scope', text: result.message, parseResult: result });
      } else if (result.intent === 'order') {
        addMsg({ role: 'bot', type: 'parsed_order', parseResult: result });
      } else {
        addMsg({ role: 'bot', type: 'parsed_restok', parseResult: result });
      }
    } catch (err) {
      setIsTyping(false);
      addMsg({ role: 'bot', type: 'error', text: `⚠️ ${err instanceof Error ? err.message : 'Error tidak diketahui'}` });
    }

    scrollToBottom();
  }, [isTyping, addMsg, scrollToBottom]);

  const modeLabel = mode === 'restok' ? '📦 Mode Restok' : '🛒 Mode Order';
  const modeColor = mode === 'restok' ? 'text-blue-500' : 'text-emerald-600';

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(inputText); 
    }
  }, [sendMessage, inputText]);

  return (
    <div className="flex flex-col h-full bg-background rounded-b-3xl">
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Mode badge + learning */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
        <span className={`text-[10px] font-black uppercase tracking-widest ${modeColor}`}>{modeLabel}</span>
        <LearningBadge />
      </div>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-6 pt-8 pb-4 h-full">
            <svg
              fill="none"
              height="64"
              viewBox="0 0 48 48"
              width="64"
              xmlns="http://www.w3.org/2000/svg"
              className="text-slate-800"
            >
              <filter id="a" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="54" width="48" x="0" y="-3">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="-3" />
                <feGaussianBlur stdDeviation="1.5" />
                <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                <feBlend in2="shape" mode="normal" result="effect1_innerShadow_3051_46851" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="1.5" />
                <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0" />
                <feBlend in2="effect1_innerShadow_3051_46851" mode="normal" result="effect2_innerShadow_3051_46851" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feMorphology in="SourceAlpha" operator="erode" radius="1" result="effect3_innerShadow_3051_46851" />
                <feOffset />
                <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.24 0" />
                <feBlend in2="effect2_innerShadow_3051_46851" mode="normal" result="effect3_innerShadow_3051_46851" />
              </filter>
              <filter id="b" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="42" width="42" x="3" y="5.25">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feMorphology in="SourceAlpha" operator="erode" radius="1.5" result="effect1_dropShadow_3051_46851" />
                <feOffset dy="2.25" />
                <feGaussianBlur stdDeviation="2.25" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0 0.141176 0 0 0 0.1 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_3051_46851" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_3051_46851" mode="normal" result="shape" />
              </filter>
              <linearGradient id="c" gradientUnits="userSpaceOnUse" x1="24" x2="26" y1=".000001" y2="48">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity=".12" />
              </linearGradient>
              <linearGradient id="d" gradientUnits="userSpaceOnUse" x1="24" x2="24" y1="6" y2="42">
                <stop offset="0" stopColor="#fff" stopOpacity=".8" />
                <stop offset="1" stopColor="#fff" stopOpacity=".5" />
              </linearGradient>
              <linearGradient id="e" gradientUnits="userSpaceOnUse" x1="24" x2="24" y1="0" y2="48">
                <stop offset="0" stopColor="#fff" stopOpacity=".12" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <clipPath id="f"><rect height="48" rx="12" width="48" /></clipPath>
              <g filter="url(#a)">
                <g clipPath="url(#f)">
                  <rect fill="#0A0D12" height="48" rx="12" width="48" />
                  <path d="m0 0h48v48h-48z" fill="url(#c)" />
                  <g filter="url(#b)">
                    <path clipRule="evenodd" d="m6 24c11.4411 0 18-6.5589 18-18 0 11.4411 6.5589 18 18 18-11.4411 0-18 6.5589-18 18 0-11.4411-6.5589-18-18-18z" fill="url(#d)" fillRule="evenodd" />
                  </g>
                </g>
                <rect height="46" rx="11" stroke="url(#e)" strokeWidth="2" width="46" x="1" y="1" />
              </g>
            </svg>

            <div className="flex flex-col space-y-2 text-center max-w-[280px]">
              <h2 className="text-xl font-medium tracking-tight text-slate-500">
                Hi Mitra,
              </h2>
              <h3 className="text-lg font-medium tracking-tight text-slate-800">
                Siap mencatat orderan hari ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Ketik detail pesanan atau forward chat WA pembeli langsung ke sini. Saya akan mengekstrak detailnya otomatis.
              </p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            if (msg.role === 'user') return <UserBubble key={msg.id} msg={msg} />;
            if (msg.type === 'out_of_scope') return <ShieldBubble key={msg.id} msg={msg} />;
            if (msg.type === 'parsed_order') return (
              <OrderResultCard key={msg.id} msg={msg}
                onCorrect={handleCorrect}
                onConfirm={handleConfirmOrder}
                confirming={confirming === (msg.parseResult as ParsedOrder)?.raw}
                mitraLevel={mitraLevel}
                customBuyPrice={customBuyPrice}
                onSuccess={onSuccess}
              />
            );
            if (msg.type === 'parsed_restok') return (
              <RestokResultCard key={msg.id} msg={msg}
                onCorrect={handleCorrect}
                onConfirm={handleConfirmRestok}
                confirming={confirming === (msg.parseResult as ParsedRestok)?.raw}
                mitraLevel={mitraLevel}
                customBuyPrice={customBuyPrice}
                onSuccess={onSuccess}
              />
            );
            return <BotTextBubble key={msg.id} msg={msg} />;
          })
        )}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} className="h-2" />
      </main>

      {/* Input */}
      <footer className="px-4 py-4 bg-background shrink-0 border-t border-slate-100">
        <div className="relative rounded-xl border border-slate-200 shadow-sm bg-white focus-within:ring-2 focus-within:ring-slate-200 focus-within:border-slate-300 transition-all">
          <Textarea
            placeholder={mode === 'restok' ? 'Cth: restok 10 bp green...' : 'Cth: 2 bp green a.n Budi 0812...'}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="peer bg-transparent min-h-[80px] resize-none border-none py-3 px-4 shadow-none focus-visible:ring-0 text-sm disabled:opacity-50"
          />

          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:pointer-events-none disabled:opacity-30"
            aria-label="Send message"
            type="button"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
