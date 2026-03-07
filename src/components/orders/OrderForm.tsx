import { useState, useEffect, useMemo } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { TierType, TIER_PRICING, MITRA_LEVELS, OrderItem } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Minus, X, Search, Package, Pencil, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { ReviewOrderPage } from './ReviewOrderPage';
import { useIndonesianRegions } from '@/hooks/useIndonesianRegions';

type Customer = Tables<'customers'>;

interface OrderFormProps {
  customers: Customer[];
  currentStock: number;
  submitting: boolean;
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string;
    customerId?: string;
    province?: string;
    city?: string;
    createdAt?: string;
  }) => void;
  onCancel: () => void;
  onEditCustomer?: (customer: Customer) => void;
  initialData?: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string | null;
    orderDate?: string;
    customerAddress?: string;
  };
}

function getPriceByTier(tier: TierType): number {
  return TIER_PRICING[tier]?.pricePerBottle ?? 250000;
}

const formatDateCompact = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function OrderForm({ customers, currentStock, submitting, onSubmit, onCancel, onEditCustomer, initialData }: OrderFormProps) {
  const { mitraLevel } = useProfile();
  const { products } = useProducts();

  const productCategories = useMemo(() => {
    const categories: Record<string, Product[]> = {};
    for (const p of products) {
      if (!p.category) continue;
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    }
    for (const cat of Object.keys(categories)) {
      categories[cat].sort((a, b) => b.quantity_per_package - a.quantity_per_package);
    }
    return categories;
  }, [products]);

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const { provinces, loadingProvinces, cities, loadingCities, fetchCities, setCities } = useIndonesianRegions();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierType>(initialData?.tier || 'satuan');
  const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);
  const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPriceSet, setCustomPriceSet] = useState<Set<number>>(new Set());
  const [customPriceProductIdx, setCustomPriceProductIdx] = useState<number | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) return;
    if (Object.keys(productCategories).length === 0) return;

    setItems(Object.keys(productCategories).map(cat => {
      let defaultPricePerBottle = 250000;
      const smallestTier = productCategories[cat][productCategories[cat].length - 1];
      if (smallestTier && smallestTier.quantity_per_package > 0) {
        defaultPricePerBottle = smallestTier.default_sell_price / smallestTier.quantity_per_package;
      }
      return {
        productName: cat,
        quantity: 0,
        pricePerBottle: defaultPricePerBottle,
        subtotal: 0
      };
    }));
    setCustomPriceSet(new Set());
  }, [productCategories, initialData]);

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalSellPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const estimatedMargin = totalSellPrice - ((MITRA_LEVELS[mitraLevel]?.buyPricePerBottle || 217000) * totalQuantity);

  const recentCustomer = customers[0] || null;
  const favoriteCustomers = customers.slice(1, 3);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 8);
  }, [customers, searchQuery]);

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setSelectedCustomerId(c.id);
    setCustomerAddress((c as any).address || '');
    setProvince(c.province || '');
    setCity(c.city || '');
    const tier = (c.tier && TIER_PRICING[c.tier as TierType]) ? c.tier as TierType : 'satuan';
    setSelectedTier(tier);
    setShowSearch(false);
    setShowNewCustomer(false);
  };

  const updateItemQty = (idx: number, newQty: number) => {
    setItems(prev => {
      const newTotalQuantity = prev.reduce((sum, item, i) => sum + (i === idx ? newQty : item.quantity), 0);

      return prev.map((item, i) => {
        const qty = i === idx ? newQty : item.quantity;
        let pricePerBottle = item.pricePerBottle;
        let productId = item.productId;

        if (!customPriceSet.has(i)) {
          const tiers = productCategories[item.productName] || [];
          let applicableTier = tiers[tiers.length - 1];
          for (const tier of tiers) {
            if (newTotalQuantity >= tier.quantity_per_package) {
              applicableTier = tier;
              break;
            }
          }
          if (applicableTier && applicableTier.quantity_per_package > 0) {
            pricePerBottle = applicableTier.default_sell_price / applicableTier.quantity_per_package;
            productId = applicableTier.id;
          }
        }
        return { ...item, quantity: qty, productId, pricePerBottle, subtotal: qty * pricePerBottle };
      });
    });
  };

  const incrementItem = (idx: number) => {
    const item = items[idx];
    if (item) updateItemQty(idx, item.quantity + 1);
  };

  const decrementItem = (idx: number) => {
    const item = items[idx];
    if (item) updateItemQty(idx, Math.max(0, item.quantity - 1));
  };

  const setItemQuantity = (idx: number, qty: number) => {
    updateItemQty(idx, Math.max(0, isNaN(qty) ? 0 : qty));
  };

  const applyCustomPrice = () => {
    if (customPriceProductIdx === null) return;
    const price = parseInt(customPriceInput.replace(/\D/g, ''), 10) || 0;
    setCustomPriceSet(prev => new Set([...prev, customPriceProductIdx]));
    setItems(prev => prev.map((item, i) => i !== customPriceProductIdx ? item : { ...item, pricePerBottle: price, subtotal: item.quantity * price }));
    setCustomPriceProductIdx(null);
  };

  const handleKeypad = (key: string) => {
    if (key === 'C') { setCustomPriceInput(''); return; }
    if (key === '⌫') { setCustomPriceInput(p => p.slice(0, -1)); return; }
    setCustomPriceInput(p => p + key);
  };

  const hasCustomPrice = items.some((item, idx) => {
    if (!products[idx]) return false;
    return item.pricePerBottle !== products[idx].default_sell_price;
  });

  const handleGoToReview = () => {
    const activeItems = items.filter(i => i.quantity > 0);
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Pilih atau isi data pelanggan terlebih dahulu');
      return;
    }
    if (activeItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk dengan jumlah > 0');
      return;
    }
    if (totalQuantity > currentStock) {
      toast.error(`Stok tidak cukup. Anda mencoba pesanan ${totalQuantity} botol. Tersisa ${currentStock} pcs`);
      return;
    }
    setShowReview(true);
  };

  const handleSubmit = () => {
    const activeItems = items.filter(i => i.quantity > 0);
    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      province: province || undefined,
      city: city || undefined,
      tier: selectedTier,
      items: activeItems,
      customerId: selectedCustomerId || undefined,
      createdAt: orderDate ? new Date(orderDate).toISOString() : undefined,
    });
  };

  if (showReview) {
    return (
      <ReviewOrderPage
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        tier={selectedTier}
        items={items}
        orderDate={orderDate}
        hasCustomPrice={hasCustomPrice}
        submitting={submitting}
        onBack={() => setShowReview(false)}
        onConfirm={handleSubmit}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 bg-card z-10 sticky top-0 shadow-sm border-b border-border">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Order</h1>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-muted-foreground active:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-3 py-3 relative z-0 pb-6">
        {/* ── PILIH PELANGGAN ── */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold flex items-center gap-1.5 text-slate-800">
              <Search className="h-4 w-4 text-emerald-600" />
              Pilih Pelanggan
            </h2>
          </div>

          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {recentCustomer && (
              <div
                role="button"
                onClick={() => selectCustomer(recentCustomer)}
                className={cn(
                  "flex-shrink-0 w-44 cursor-pointer flex flex-col items-start p-2.5 rounded-lg border transition-all text-left active:scale-[0.97]",
                  customerName === recentCustomer.name
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white border-slate-200 shadow-sm"
                )}
              >
                <div className="flex w-full justify-between items-start">
                  <span className={cn("text-xs uppercase tracking-widest font-black",
                    customerName === recentCustomer.name ? "opacity-80" : "text-muted")}>
                    Terakhir
                  </span>
                  {customerName === recentCustomer.name && (
                    <div className="flex items-center gap-1.5">
                      {onEditCustomer && (
                        <button
                          onClick={e => { e.stopPropagation(); onEditCustomer(recentCustomer); }}
                          className="text-xs font-black bg-white/20 text-white px-1.5 py-0.5 rounded"
                        >✏ Ubah</button>
                      )}
                      <span className="text-white opacity-80 text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className={cn("text-sm font-bold leading-tight mt-0.5",
                  customerName !== recentCustomer.name && "text-slate-800")}>
                  {recentCustomer.name}
                </span>
                <span className={cn("text-xs truncate w-full",
                  customerName === recentCustomer.name ? "opacity-90" : "text-muted-foreground")}>
                  {TIER_PRICING[recentCustomer.tier as TierType]?.label || recentCustomer.tier}
                </span>
              </div>
            )}

            {favoriteCustomers.map(c => (
              <div
                key={c.id}
                role="button"
                onClick={() => selectCustomer(c)}
                className={cn(
                  "flex-shrink-0 w-44 cursor-pointer flex flex-col items-start p-2.5 rounded-lg border transition-all text-left active:scale-[0.97]",
                  customerName === c.name
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white border-slate-200 shadow-sm"
                )}
              >
                <div className="flex w-full justify-between items-start">
                  <span className={cn("text-xs uppercase tracking-widest font-black mb-0.5",
                    customerName === c.name ? "opacity-80" : "text-muted")}>
                    Favorit
                  </span>
                  {customerName === c.name && onEditCustomer && (
                    <button
                      onClick={e => { e.stopPropagation(); onEditCustomer(c); }}
                      className="text-xs font-black bg-white/20 text-white px-1.5 py-0.5 rounded"
                    >✏ Ubah</button>
                  )}
                </div>
                <span className={cn("text-sm font-bold leading-tight",
                  customerName !== c.name && "text-slate-800")}>
                  {c.name}
                </span>
                <span className={cn("text-xs truncate w-full",
                  customerName === c.name ? "opacity-90" : "text-muted-foreground")}>
                  {TIER_PRICING[c.tier as TierType]?.label || c.tier}
                </span>
              </div>
            ))}
          </div>

          {/* Two distinct action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setShowSearch(v => !v); setShowNewCustomer(false); }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-lg border font-bold text-xs transition-all active:scale-[0.97]",
                showSearch
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-white border-slate-200 text-slate-700 shadow-sm"
              )}
            >
              <Search className="h-3.5 w-3.5" />
              Cari Pelanggan
            </button>
            <button
              onClick={() => { setShowNewCustomer(v => !v); setShowSearch(false); }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-lg border font-bold text-xs transition-all active:scale-[0.97]",
                showNewCustomer
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white border-slate-200 text-slate-700 shadow-sm"
              )}
            >
              <span className="text-base leading-none">+</span>
              Pelanggan Baru
            </button>
          </div>

          {/* Cari Pelanggan panel */}
          {showSearch && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md">
              <div className="p-2.5 border-b border-slate-100">
                <input
                  autoFocus
                  placeholder="Cari nama atau nomor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
              </div>
              {filteredCustomers.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className="flex w-full items-center gap-2 px-3 py-2.5"
                    >
                      <button
                        onClick={() => selectCustomer(c)}
                        className="flex-1 text-left hover:bg-emerald-50 active:bg-emerald-100 transition-colors rounded-lg px-1"
                      >
                        <p className="text-sm font-bold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone} · {TIER_PRICING[c.tier as TierType]?.label || c.tier}</p>
                      </button>
                      {onEditCustomer && (
                        <button
                          onClick={() => onEditCustomer(c)}
                          className="shrink-0 text-xs font-bold text-muted-foreground border border-slate-200 rounded px-1.5 py-1 bg-white hover:bg-neutral-50"
                        >✏ Ubah</button>
                      )}
                      <button
                        onClick={() => selectCustomer(c)}
                        className="shrink-0 text-emerald-600 text-xs font-bold"
                      >Pilih</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted py-4">Pelanggan tidak ditemukan</p>
              )}
              <div className="p-2.5 border-t border-slate-100">
                <button
                  onClick={() => setShowSearch(false)}
                  className="w-full py-2 bg-neutral-100 text-slate-600 text-sm font-bold rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* + Pelanggan Baru panel */}
          {showNewCustomer && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md">
              <div className="p-2.5 space-y-2">
                <p className="text-xs font-bold text-muted uppercase tracking-widest">Data Pelanggan Baru</p>
                <input
                  autoFocus
                  placeholder="Nama pelanggan *"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
                <input
                  placeholder="No. WhatsApp *"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
                <input
                  placeholder="Alamat Lengkap (opsional)"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />

                <select
                  value={province}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProvince(val);
                    setCity('');
                    if (!val) {
                      setCities([]);
                      return;
                    }
                    const p = provinces.find(x => x.name === val);
                    if (p) fetchCities(p.id);
                  }}
                  disabled={loadingProvinces}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400 text-slate-700 disabled:opacity-50"
                >
                  <option value="">Provinsi (opsional)</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!province || loadingCities || cities.length === 0}
                  className="w-full bg-neutral-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-slate-200 focus:border-emerald-400 text-slate-700 disabled:opacity-50"
                >
                  <option value="">Kabupaten/Kota (opsional)</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-2.5 border-t border-slate-100">
                <button
                  onClick={() => setShowNewCustomer(false)}
                  disabled={!customerName.trim() || !customerPhone.trim()}
                  className={cn(
                    "w-full py-2.5 text-sm font-bold rounded-lg transition-colors",
                    customerName.trim() && customerPhone.trim()
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-neutral-100 text-muted"
                  )}
                >
                  Konfirmasi Pelanggan Baru
                </button>
              </div>
            </div>
          )}

          {/* Selected customer chip — always show when customer selected */}
          {customerName && !showNewCustomer && (() => {
            const chipEditableCustomer = selectedCustomerId
              ? customers.find(x => x.id === selectedCustomerId) ?? null
              : null;
            return (
              <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <div>
                  <span className="text-emerald-800 font-bold text-xs">✓ {customerName}</span>
                  {customerPhone && <span className="text-emerald-600 text-xs ml-2">{customerPhone}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {chipEditableCustomer && onEditCustomer && (
                    <button
                      onClick={() => onEditCustomer(chipEditableCustomer)}
                      className="text-xs text-slate-600 font-bold border border-slate-200 rounded px-1.5 py-0.5 bg-white"
                    >✏ Ubah</button>
                  )}
                  <button
                    onClick={() => { setShowSearch(true); setShowNewCustomer(false); }}
                    className="text-xs text-emerald-600 font-bold underline"
                  >Ganti</button>
                </div>
              </div>
            );
          })()}
        </section >

        {/* ── TANGGAL ── */}
        <section className="px-4 relative">
          <div
            className="bg-card px-3 py-2.5 rounded-lg border border-border shadow-sm flex items-center justify-between relative cursor-pointer active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-bold uppercase tracking-wide">Tanggal:</span>
                <span className="text-sm font-bold text-foreground flex-1">
                  {formatDateCompact(orderDate)}
                </span>
              </div>
            </div>

            <input
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />

            <div className="shrink-0 pl-2 pointer-events-none text-muted">
              <Pencil className="h-4 w-4" />
            </div>
          </div>
        </section>

        {/* ── PRODUK ── */}
        < section >
          <div className="px-4 flex items-center justify-between mb-2">
            <h2 className="text-base font-bold flex items-center gap-1.5 text-slate-800">
              <Package className="h-4 w-4 text-emerald-600" />
              Produk Terlaris
            </h2>
            <span className="text-xs text-muted-foreground font-medium">Stok: {currentStock}</span>
          </div>

          <div className="flex overflow-x-auto gap-2.5 px-4 pb-2 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {items.map((item, idx) => {
              const isCustomPrice = customPriceSet.has(idx);
              const isActive = item.quantity > 0;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex-shrink-0 w-48 bg-white rounded-xl border overflow-hidden shadow-sm transition-all",
                    isActive ? "border-emerald-300 shadow-emerald-100" : "border-slate-100 opacity-80"
                  )}
                >
                  <div className="h-24 bg-gradient-to-br from-emerald-50 to-slate-100 relative overflow-hidden flex items-center justify-center">
                    <Package className="h-10 w-10 text-emerald-200" />
                    <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-md text-xs font-black uppercase tracking-tighter text-emerald-700 shadow-sm">
                      STOK {currentStock}
                    </div>
                    {isCustomPrice && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-400 text-foreground text-xs font-black px-1.5 py-0.5 rounded-md uppercase">
                        Custom
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{item.productName || 'Produk'}</h3>
                    <button
                      type="button"
                      onClick={() => { setCustomPriceProductIdx(idx); setCustomPriceInput(String(item.pricePerBottle)); }}
                      className="mt-0.5 flex items-center gap-1 text-left hover:bg-neutral-50 rounded px-0.5 -ml-0.5 transition-colors"
                    >
                      <span className={cn("font-bold text-sm", isCustomPrice ? "text-amber-500" : "text-emerald-600")}>
                        {formatCurrency(item.pricePerBottle)}
                      </span>
                      <Pencil className="h-2.5 w-2.5 text-muted" />
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => decrementItem(idx)}
                        className="w-10 h-10 rounded-lg border border-slate-200 bg-neutral-50 flex items-center justify-center text-slate-600 active:bg-neutral-100 touch-manipulation"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={item.quantity}
                        onChange={e => setItemQuantity(idx, parseInt(e.target.value, 10))}
                        className="text-lg font-black text-foreground w-10 text-center bg-transparent outline-none border-b-2 border-slate-200 focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => incrementItem(idx)}
                        className="w-10 h-10 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-100 flex items-center justify-center active:bg-emerald-700 active:scale-95 transition-all touch-manipulation"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section >

        {/* ── RINGKASAN ── */}
        < section className="px-4" >
          <div className="bg-slate-800 text-white rounded-xl p-3 shadow-lg overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted font-medium text-xs uppercase tracking-wide">Ringkasan</span>
              <span className="bg-success text-xs font-bold px-1.5 py-0.5 rounded uppercase">
                {totalQuantity > 0 ? `${totalQuantity} btl` : 'Baru'}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-muted">Total Harga</div>
                <div className="text-lg font-black leading-none mt-0.5">{formatCurrency(totalSellPrice)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-400/80">Profit</div>
                <div className={cn("text-sm font-bold leading-none mt-0.5", estimatedMargin >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {estimatedMargin >= 0 ? '+' : ''}{formatCurrency(estimatedMargin)}
                </div>
              </div>
            </div>
          </div>
        </section >
      </main >

      {/* ── REVIEW Button ── */}
      <div className="sticky bottom-[5.5rem] mt-auto p-4 bg-card/95 backdrop-blur-sm border-t border-border z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleGoToReview}
          disabled={totalQuantity === 0}
          className={cn(
            "w-full h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-bold text-base tracking-tight",
            totalQuantity === 0
              ? "bg-neutral-200 text-muted"
              : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          )}
        >
          <span>REVIEW ORDER</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div >

      {/* ── CUSTOM PRICE MODAL ── */}
      {
        customPriceProductIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-5 relative mb-4 sm:mb-0">
              <button
                onClick={() => setCustomPriceProductIdx(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 text-muted active:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-center mb-4">
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Ubah Harga Satuan</h3>
                <p className="text-slate-800 font-bold text-base leading-tight mt-1">
                  {items[customPriceProductIdx]?.productName}
                </p>
              </div>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted font-bold text-xl">Rp</span>
                </div>
                <div className="w-full pl-10 pr-3 py-3 text-3xl font-black text-emerald-600 bg-neutral-50 border-2 border-emerald-500 rounded-xl text-center shadow-inner">
                  {customPriceInput ? parseInt(customPriceInput).toLocaleString('id-ID') : '0'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleKeypad(k)}
                    className="flex items-center justify-center text-2xl font-bold bg-white rounded-lg shadow-sm border border-slate-200 active:bg-emerald-50 active:border-emerald-500 transition-colors h-14"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomPriceProductIdx(null)}
                  className="flex-1 py-3 bg-neutral-100 text-slate-700 font-bold rounded-xl text-sm"
                >Batal</button>
                <button
                  onClick={applyCustomPrice}
                  className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 text-sm"
                >Simpan</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
