import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, User, Phone, MapPin, Package, Plus, Minus, Search, Calendar, Check, Loader2, UserPlus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { TierType, TIER_PRICING, MITRA_LEVELS, OrderItem } from '@/types';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIndonesianRegions } from '@/hooks/useIndonesianRegions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Customer = Tables<'customers'>;

interface OrderFormProps {
  customers: Customer[];
  currentStock: number;
  submitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onEditCustomer?: (customer: Customer) => void;
  initialData?: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    expenses?: { name: string, amount: number }[];
    orderDate?: string;
    customerAddress?: string;
    customerId?: string;
  };
}

type Step = 'info' | 'products' | 'summary';

export function OrderForm({ customers, submitting, onSubmit, onCancel, onEditCustomer, initialData }: OrderFormProps) {
  const { products, loading: productsLoading } = useProducts();
  const [step, setStep] = useState<Step>('info');
  
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [tier, setTier] = useState<TierType>(initialData?.tier || 'satuan');
  const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialData?.customerId || null);
  const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);
  const [expenses, setExpenses] = useState<{ name: string, amount: number }[]>(initialData?.expenses || []);
  
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── LOGIKA HARGA PUSAT (Updated: Mixed Order Logic) ────────────────────────
  const calculatePrice = useCallback((productName: string, totalQty: number, selectedTier: TierType, hasBeauty: boolean) => {
    const name = productName.toUpperCase();
    const isBeauty = name.includes('BELGIE') || name.includes('STEFFI');
    
    let activeTier = selectedTier;
    if (selectedTier === 'satuan' || !selectedTier) {
      if (totalQty >= 200) activeTier = 'se';
      else if (totalQty >= 40) activeTier = 'sap';
      else if (totalQty >= 10) activeTier = 'agen_plus';
      else if (totalQty >= 5) activeTier = 'agen';
      else if (totalQty >= 3) activeTier = 'reseller';
      else activeTier = 'satuan';
    }

    const pricingMap: Record<string, { bp: number; beauty: number }> = {
      'satuan':    { bp: 250000, beauty: 250000 },
      'reseller':  { bp: hasBeauty ? 217000 : 216666, beauty: 195000 }, // ATURAN 217K MIXED
      'agen':      { bp: 198000, beauty: 195000 },
      'agen_plus': { bp: 180000, beauty: 180000 },
      'sap':       { bp: 170000, beauty: 170000 },
      'se':        { bp: 150000, beauty: 150000 },
    };

    const tierData = pricingMap[activeTier] || pricingMap['satuan'];
    const price = isBeauty ? tierData.beauty : tierData.bp;
    return Math.round(price);
  }, []);

  const recalcItems = useCallback((currentItems: OrderItem[], currentTier: TierType) => {
    const totalQty = currentItems.reduce((s, i) => s + i.quantity, 0);
    const hasBeauty = currentItems.some(i => i.quantity > 0 && (i.productName.toUpperCase().includes('BELGIE') || i.productName.toUpperCase().includes('STEFFI')));
    
    return currentItems.map(item => {
      const price = calculatePrice(item.productName, totalQty, currentTier, hasBeauty);
      return { ...item, pricePerBottle: price, subtotal: item.quantity * price };
    });
  }, [calculatePrice]);

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    const categories = Array.from(new Set(products.map(p => p.category || p.name.split(/[ _]/)[0])));
    if (items.length === 0) {
      const initialItems = categories.map(cat => ({
        productName: cat,
        quantity: 0,
        pricePerBottle: 250000,
        subtotal: 0,
      }));
      setItems(recalcItems(initialItems, tier));
    }
  }, [products, productsLoading, tier, recalcItems, items.length]);

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
    setShowCustomerSearch(false);
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

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Step Indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {['info', 'products', 'summary'].map((s, i) => {
            const isActive = step === s;
            const isDone = ['info', 'products', 'summary'].indexOf(step) > i;
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

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-md mx-auto">
          {step === 'info' && (
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
                      onChange={e => { setCustomerName(e.target.value); setSearchQuery(e.target.value); setShowCustomerSearch(true); }} 
                      onFocus={() => setShowCustomerSearch(true)}
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
                  {showCustomerSearch && searchQuery && (
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
                                setShowCustomerSearch(false);
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
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level Harga</Label>
                  <select className="w-full h-12 bg-slate-50 border-slate-100 rounded-xl px-4 font-bold text-sm" value={tier} onChange={e => {
                    const newTier = e.target.value as TierType;
                    setTier(newTier);
                    setItems(recalcItems(items, newTier));
                  }}>
                    <option value="satuan">Konsumen Satuan (Auto Tier)</option>
                    <option value="reseller">Reseller (3 Btl)</option>
                    <option value="agen">Agen (5 Btl)</option>
                    <option value="agen_plus">Agen Plus (10 Btl)</option>
                    <option value="sap">SAP (40 Btl)</option>
                    <option value="se">SE (200 Btl)</option>
                  </select>
                </div>

                <button onClick={() => setStep('products')} disabled={!customerName} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">LANJUT PILIH PRODUK</button>
              </div>
            </div>
          )}

          {step === 'products' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className={cn("p-4 rounded-2xl border transition-all", item.quantity > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-slate-50 bg-slate-50/50")}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{item.productName}</p>
                          <p className="text-[11px] font-black text-emerald-600 mt-0.5">{formatCurrency(item.pricePerBottle)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                          <button onClick={() => changeQty(item.productName, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                          <button onClick={() => changeQty(item.productName, 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-800 rounded-2xl flex items-center justify-between text-white shadow-xl">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sementara</p>
                    <p className="text-lg font-black">{formatCurrency(itemsTotalPrice)}</p>
                  </div>
                  <button onClick={() => setStep('summary')} disabled={totalQty === 0} className="bg-emerald-600 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider">Cek Pesanan</button>
                </div>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-4 animate-in fade-in duration-300 pb-10">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                {/* Customer Info Header */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm"><User className="h-6 w-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Pelanggan</p>
                    <h3 className="text-base font-black text-slate-800 truncate">{customerName}</h3>
                    <p className="text-[10px] font-bold text-slate-500">{customerPhone || 'Tanpa No. WhatsApp'}</p>
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

                {/* Additional Expenses Section */}
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

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center px-1">
                  <div>
                    <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">Total Akhir</p>
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(grandTotal)}</p>
                  </div>
                  <button onClick={() => onSubmit({ customerName, customerPhone, customerAddress, tier, items: activeItems, expenses, createdAt: new Date(orderDate).toISOString() })} disabled={submitting} className="h-14 px-8 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'SIMPAN PERUBAHAN'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2"><button onClick={onCancel} className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 font-black text-[10px] uppercase shadow-lg">BATAL</button></div>
    </div>
  );
}
