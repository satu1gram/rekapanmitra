import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight, CheckCircle2, User, Phone, MapPin, Package, Plus, Minus, Search, Calendar, Check, Loader2 } from 'lucide-react';
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
    orderDate?: string;
    customerAddress?: string;
    customerId?: string;
  };
}

type Step = 'info' | 'products' | 'summary';

export function OrderForm({ customers, submitting, onSubmit, onCancel, initialData }: OrderFormProps) {
  const { products, loading: productsLoading } = useProducts();
  const [step, setStep] = useState<Step>('info');
  
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [tier, setTier] = useState<TierType>(initialData?.tier || 'satuan');
  const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialData?.customerId || null);
  const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);

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
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);
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
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes((searchQuery || customerName).toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Step Indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {['info', 'products', 'summary'].map((s, i) => {
            const isActive = step === s;
            const isDone = ['info', 'products', 'summary'].indexOf(step) > i;
            return (
              <div key={s} className="flex flex-col items-center gap-2 flex-1">
                <div className={cn("h-1.5 w-full rounded-full transition-all duration-500", 
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
                    <Input placeholder="Cari atau ketik nama..." value={customerName} 
                      onChange={e => { setCustomerName(e.target.value); setShowCustomerSearch(true); }} 
                      onFocus={() => setShowCustomerSearch(true)}
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm" />
                    {showCustomerSearch && customerName && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-52 overflow-y-auto p-2">
                        {filteredCustomers.map(c => (
                          <button key={c.id} onClick={() => selectCustomer(c)} className="w-full p-3 text-left hover:bg-slate-50 rounded-xl flex items-center justify-between group">
                            <div><p className="text-sm font-bold text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">{c.tier}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                        <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200">
                          <button onClick={() => changeQty(item.productName, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                          <button onClick={() => changeQty(item.productName, 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep('summary')} disabled={totalQty === 0} className="w-full h-14 bg-slate-800 text-white rounded-2xl font-black">CEK PESANAN</button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-800">Review Order</h2><div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{tier}</div></div>
                <div className="space-y-3">
                  {activeItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div><p className="text-sm font-bold text-slate-800">{item.productName}</p><p className="text-xs text-slate-500 font-medium">{item.quantity} x {formatCurrency(item.pricePerBottle)}</p></div>
                      <p className="text-sm font-black text-slate-800">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="font-black text-slate-500 text-sm">TOTAL AKHIR</p>
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalPrice)}</p>
                </div>
                <button onClick={() => onSubmit({ customerName, customerPhone, customerAddress, tier, items: activeItems, createdAt: new Date(orderDate).toISOString() })} disabled={submitting} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">
                   {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'SIMPAN PERUBAHAN'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2"><button onClick={onCancel} className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 font-black text-[10px] uppercase shadow-lg">BATAL</button></div>
    </div>
  );
}
