import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, CheckCircle2, User, Plus, Minus, ChevronRight, UserPlus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useProducts } from '@/hooks/useProducts';
import { TierType } from '@/types';
import { recalcPricing } from '@/lib/pricing';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Customer = Tables<'customers'>;

interface TambahOrderFlowProps {
  customers: Customer[];
  currentStock: number;
  submitting: boolean;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
  onEditCustomer?: (customer: Customer) => void;
  initialSelectedCustomerId?: string | null;
  onRefetchCustomers?: () => Promise<void>;
}

type Step = 'info' | 'products' | 'summary' | 'success';

interface ProductItem {
  productName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
}

interface Expense {
  name: string;
  amount: number;
}

export function TambahOrderFlow({ customers, currentStock, submitting, onSubmit, onCancel, onEditCustomer, initialSelectedCustomerId }: TambahOrderFlowProps) {
  const { products, loading: productsLoading } = useProducts();
  const [step, setStep] = useState<Step>('info');
  
  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
  
  const [customerName, setCustomerName] = useState(isDemo ? 'Budi Santoso' : '');
  const [customerPhone, setCustomerPhone] = useState(isDemo ? '081234567890' : '');
  const [customerAddress, setCustomerAddress] = useState(isDemo ? 'Jl. Sudirman No. 12, Jakarta' : '');
  const [tier, setTier] = useState<TierType>(isDemo ? 'agen' : 'satuan');
  const [orderDate, setOrderDate] = useState(isDemo ? '2026-04-06' : new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialSelectedCustomerId || null);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(isDemo ? [{ name: 'Ongkos Kirim', amount: 25000 }] : []);
  
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect from success screen
  useEffect(() => {
    if (step === 'success') {
      if (countdown <= 0) {
        onCancel();
        return;
      }
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown, onCancel]);

  // Auto-select customer if ID provided
  useEffect(() => {
    if (initialSelectedCustomerId && customers.length > 0) {
      const c = customers.find(x => x.id === initialSelectedCustomerId);
      if (c) selectCustomer(c);
    }
  }, [initialSelectedCustomerId, customers]);

  // ── LOGIKA HARGA: Gunakan shared pricing utility ──────────────────────────
  const recalcItems = useCallback((currentItems: ProductItem[], currentTier: TierType) => {
    return recalcPricing(currentItems, currentTier);
  }, []);

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    const categories = Array.from(new Set(products.map(p => p.category || p.name.split(/[ _]/)[0])));
    if (items.length === 0) {
      const initialItems = categories.map(cat => {
        let quantity = 0;
        if (isDemo) {
          if (cat === 'STEFFI') quantity = 1;
          if (cat === 'BP') quantity = 2;
        }
        return {
          productName: cat,
          quantity,
          pricePerBottle: 250000,
          subtotal: 0,
        };
      });
      setItems(recalcItems(initialItems, tier));
    }
  }, [products, productsLoading, tier, recalcItems, items.length, isDemo]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const itemsTotalPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const grandTotal = itemsTotalPrice + totalExpenses;
  const activeItems = items.filter(i => i.quantity > 0);
  
  const changeQty = (name: string, delta: number) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.productName !== name ? item : { ...item, quantity: Math.max(0, item.quantity + delta) }
      );
      return recalcItems(updated, tier);
    });
  };

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerAddress(c.address || '');
    setTier((c.tier || 'satuan').toLowerCase() as TierType);
    setSelectedCustomerId(c.id);
    setShowCustomerModal(false);
    setSearchQuery('');
  };

  const addExpense = () => {
    if (!newExpName || !newExpAmount) return;
    setExpenses(prev => [...prev, { name: newExpName, amount: Number(newExpAmount) }]);
    setNewExpName('');
    setNewExpAmount('');
  };

  const removeExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes((searchQuery || customerName).toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery || customerName))
  );

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-bounce"><CheckCircle2 className="w-12 h-12 text-emerald-600" /></div>
        <h2 className="text-2xl font-black text-slate-800">Order Tercatat!</h2>
        <p className="text-slate-500 mt-2 font-medium">Transaksi telah berhasil disimpan ke database.</p>
        <button onClick={onCancel} className="mt-10 w-full max-w-xs h-14 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-2xl font-black shadow-lg flex flex-col items-center justify-center leading-tight">
          <span>KEMBALI KE LAPORAN</span>
          <span className="text-[10px] font-medium text-emerald-100">Otomatis dalam {countdown} detik</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Step Indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {(['info', 'products', 'summary'] as const).map((s, i) => {
            const steps = ['info', 'products', 'summary'];
            const isActive = step === s;
            const isDone = steps.indexOf(step) > i;
            return (
              <div key={s} className="flex flex-col items-center gap-2 flex-1">
                <div className={cn("h-1.5 w-[80%] rounded-full transition-all duration-500",
                  isDone ? "bg-emerald-500" : isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-100")} />
                <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-emerald-600" : "text-slate-300")}>
                  {s === 'info' ? 'Pelanggan' : s === 'products' ? 'Produk' : 'Review'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: INFO ─────────────────────────────────────────── */}
      {step === 'info' && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 max-w-md mx-auto">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><User className="h-5 w-5" /></div>
                  <h2 className="text-base font-black text-slate-800">Identitas Pelanggan</h2>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Transaksi</Label>
                  <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm" />
                </div>

                <div className="space-y-1.5 relative">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pelanggan</Label>
                  <div className="relative">
                    <Input
                      placeholder="Cari atau ketik nama..."
                      value={customerName}
                      onChange={e => { setCustomerName(e.target.value); setSearchQuery(e.target.value); setShowCustomerModal(true); }}
                      onFocus={() => setShowCustomerModal(true)}
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm pr-10"
                    />
                    {selectedCustomerId && (
                      <button
                        onClick={() => {
                          const c = customers.find(x => x.id === selectedCustomerId);
                          if (c && onEditCustomer) onEditCustomer(c);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {showCustomerModal && searchQuery && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-52 overflow-y-auto p-2">
                      {filteredCustomers.length > 0 ? (
                        <>
                          <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Hasil Pencarian</p>
                          {filteredCustomers.map(c => (
                            <button key={c.id} onClick={() => selectCustomer(c)} className="w-full p-3 text-left hover:bg-emerald-50/50 rounded-xl flex items-center justify-between group transition-colors">
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{c.tier} {c.phone ? `• ${c.phone}` : ''}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400" />
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-2">
                          <button
                            onClick={() => {
                              if (onEditCustomer) {
                                onEditCustomer({ name: searchQuery, tier: 'satuan' } as Customer);
                                setShowCustomerModal(false);
                              }
                            }}
                            className="w-full p-4 text-center bg-emerald-50 rounded-xl border border-dashed border-emerald-200 flex flex-col items-center gap-2 group hover:bg-emerald-100/50 transition-colors"
                          >
                            <UserPlus className="h-6 w-6 text-emerald-600" />
                            <p className="text-sm font-black text-emerald-700">Tambah Pelanggan Baru</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">"{searchQuery}"</p>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp (Opsional)</Label>
                  <Input placeholder="08..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky CTA Step 1 */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-3 flex gap-3">
            <button onClick={onCancel} className="h-12 px-5 rounded-xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Batal
            </button>
            <button
              onClick={() => setStep('products')}
              disabled={!customerName}
              className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-md disabled:opacity-40 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              LANJUT PILIH PRODUK →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: PRODUCTS ─────────────────────────────────────── */}
      {step === 'products' && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 max-w-md mx-auto">
            <div className="animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2.5">
                {/* Hint */}
                <div className="flex items-center justify-between px-1 pb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Produk & Jumlah</p>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                    currentStock === 0 ? "bg-red-50 text-red-600" :
                    totalQty > currentStock ? "bg-red-50 text-red-600" :
                    "bg-emerald-50 text-emerald-600"
                  )}>
                    Stok: {currentStock} botol
                  </div>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className={cn("p-4 rounded-2xl border transition-all", item.quantity > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-slate-50 bg-slate-50/50")}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[11px] font-black text-emerald-600 mt-0.5">{formatCurrency(item.pricePerBottle)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                        <button onClick={() => changeQty(item.productName, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                        <button onClick={() => changeQty(item.productName, 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar Step 2 — always visible */}
          <div className="sticky bottom-0 bg-slate-900 px-4 py-3 shadow-2xl">
            <div className="max-w-md mx-auto flex items-center gap-3">
              <button
                onClick={() => setStep('info')}
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
                title="Kembali ke data pelanggan"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sementara</p>
                <p className="text-base font-black text-white leading-tight">{formatCurrency(itemsTotalPrice)}</p>
              </div>
              <button
                onClick={() => setStep('summary')}
                disabled={totalQty === 0}
                className="h-11 px-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-[11px] uppercase tracking-wide disabled:opacity-40 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
              >
                LANJUT REVIEW →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: SUMMARY ──────────────────────────────────────── */}
      {step === 'summary' && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 pb-4 max-w-md mx-auto">
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm"><User className="h-6 w-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Pelanggan</p>
                    <h3 className="text-base font-black text-slate-800 truncate">{customerName}</h3>
                    <p className="text-[10px] font-bold text-slate-500">{customerPhone || '-'}</p>
                  </div>
                  <div className="ml-auto bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{tier}</div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rincian Produk</p>
                  <div className="space-y-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                    {activeItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[11px] text-slate-500 font-bold">{item.quantity} x {formatCurrency(item.pricePerBottle)}</p>
                        </div>
                        <p className="text-sm font-black text-slate-800">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengeluaran Tambahan</p>
                    <p className="text-[10px] font-black text-slate-500">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="space-y-3">
                    {expenses.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {expenses.map((exp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl">
                            <p className="text-xs font-bold text-orange-800">{exp.name}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-xs font-black text-orange-600">{formatCurrency(exp.amount)}</p>
                              <button onClick={() => removeExpense(idx)} className="text-orange-300 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <Input placeholder="Nama (ongkir, dll)" value={newExpName} onChange={e => setNewExpName(e.target.value)} className="h-10 bg-white border-slate-100 rounded-xl text-xs font-bold flex-1" />
                      <Input type="number" placeholder="Rp" value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} className="h-10 bg-white border-slate-100 rounded-xl text-xs font-bold w-24" />
                      <button onClick={addExpense} disabled={!newExpName || !newExpAmount} className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-xl active:scale-90 transition-all disabled:opacity-30"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Peringatan stok */}
          {totalQty > currentStock && (
            <div className="px-4 max-w-md mx-auto mt-3">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 font-black text-sm">!</span>
                </div>
                <div>
                  <p className="text-sm font-black text-red-800">Stok Tidak Mencukupi</p>
                  <p className="text-xs font-bold text-red-600 mt-1">
                    Pesanan {totalQty} botol, stok tersedia {currentStock} botol. Kurangi jumlah produk atau restok dulu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Bar Step 3 */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-3">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Akhir</p>
                  <p className="text-xl font-black text-emerald-600">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('products')}
                  className="h-12 px-5 rounded-xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit Produk
                </button>
                <button
                  onClick={async () => {
                    const payload = {
                      customerName, customerPhone, customerAddress, tier,
                      customerId: selectedCustomerId,
                      items: activeItems.map(i => ({
                        ...i,
                        productId: products.find(p => p.category === i.productName || p.name.includes(i.productName))?.id
                      })),
                      expenses,
                      createdAt: new Date(orderDate).toISOString()
                    };
                    const ok = await onSubmit(payload);
                    if (ok) setStep('success');
                  }}
                  disabled={submitting || totalQty > currentStock}
                  className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                   totalQty > currentStock ? '⚠ STOK TIDAK CUKUP' : '✓ SIMPAN ORDER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



