import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Loader2, CheckCircle2, User, Phone, MapPin, ShoppingBag, Package, Plus, Minus, Info, Search, Users, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { MITRA_LEVELS, TierType, TIER_PRICING } from '@/types';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

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

export function TambahOrderFlow({ customers, submitting, onSubmit, onCancel, initialSelectedCustomerId }: TambahOrderFlowProps) {
  const { products, loading: productsLoading } = useProducts();
  const [step, setStep] = useState<Step>('info');
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [tier, setTier] = useState<TierType>('satuan');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialSelectedCustomerId || null);
  const [items, setItems] = useState<ProductItem[]>([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── LOGIKA HARGA PUSAT (Mixed Order Support) ───────────────────────────────
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
      'reseller':  { bp: hasBeauty ? 217000 : 216666, beauty: 195000 },
      'agen':      { bp: 198000, beauty: 195000 },
      'agen_plus': { bp: 180000, beauty: 180000 },
      'sap':       { bp: 170000, beauty: 170000 },
      'se':        { bp: 150000, beauty: 150000 },
    };

    const tierData = pricingMap[activeTier] || pricingMap['satuan'];
    const price = isBeauty ? tierData.beauty : tierData.bp;
    return Math.round(price);
  }, []);

  const recalcItems = useCallback((currentItems: ProductItem[], currentTier: TierType) => {
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
    setShowCustomerModal(false);
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes((searchQuery || customerName).toLowerCase()));

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-bounce"><CheckCircle2 className="w-12 h-12 text-emerald-600" /></div>
        <h2 className="text-2xl font-black text-slate-800">Order Tercatat!</h2>
        <button onClick={onCancel} className="mt-10 w-full max-w-xs h-14 bg-emerald-600 text-white rounded-2xl font-black">KEMBALI</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full"><X className="h-5 w-5 text-slate-400" /></button>
        <h1 className="text-sm font-black text-slate-800 flex-1 uppercase tracking-widest">Tambah Order Baru</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-md mx-auto">
          {step === 'info' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</Label><Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></div>
                <div className="space-y-1.5 relative"><Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Pelanggan</Label><Input placeholder="Cari..." value={customerName} onChange={e => { setCustomerName(e.target.value); setShowCustomerModal(true); }} onFocus={() => setShowCustomerModal(true)} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" />
                  {showCustomerModal && customerName && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-52 overflow-y-auto p-2">
                      {filteredCustomers.map(c => (<button key={c.id} onClick={() => selectCustomer(c)} className="w-full p-3 text-left hover:bg-slate-50 rounded-xl flex items-center justify-between group"><div><p className="text-sm font-bold text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400 font-black uppercase">{c.tier}</p></div></button>))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase ml-1">No. WhatsApp</Label><Input placeholder="08..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold" /></div>
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
                        <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-800 truncate">{item.productName}</p><p className="text-[11px] font-black text-emerald-600 mt-0.5">{formatCurrency(item.pricePerBottle)}</p></div>
                        <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200">
                          <button onClick={() => changeQty(item.productName, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                          <button onClick={() => changeQty(item.productName, 1)} className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep('summary')} disabled={totalQty === 0} className="w-full h-14 bg-slate-800 text-white rounded-2xl font-black shadow-lg">CEK PESANAN</button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-800">Review Akhir</h2><div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{tier}</div></div>
                <div className="space-y-3">
                  {activeItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div><p className="text-sm font-bold text-slate-800">{item.productName}</p><p className="text-xs text-slate-500 font-medium">{item.quantity} x {formatCurrency(item.pricePerBottle)}</p></div>
                      <p className="text-sm font-black text-slate-800">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center"><p className="font-black text-slate-500 text-sm">TOTAL AKHIR</p><p className="text-2xl font-black text-emerald-600">{formatCurrency(totalPrice)}</p></div>
                <button onClick={async () => { const ok = await onSubmit({ customerName, customerPhone, customerAddress, tier, items: activeItems.map(i => ({ ...i, productId: products.find(p => p.category === i.productName || p.name.includes(i.productName))?.id || i.productName })), createdAt: new Date(orderDate).toISOString() }); if (ok) setStep('success'); }} disabled={submitting} className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'SIMPAN ORDER'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
