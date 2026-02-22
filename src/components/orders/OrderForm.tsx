import { useState, useRef, useMemo, useEffect } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { useProducts } from '@/hooks/useProducts';
import { TierType, TIER_PRICING, MITRA_LEVELS, OrderItem } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import {
  Plus,
  Minus,
  Upload,
  X,
  Loader2,
  Calendar,
  SlidersHorizontal,
  Search,
  Zap,
  Users,
  Package,
  ChevronDown,
  ChevronUp,
  Pencil,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

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
    createdAt?: string;
  }) => void;
  onCancel: () => void;
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

function createEmptyItem(products: { id: string; name: string; default_sell_price: number }[]): OrderItem {
  if (products.length > 0) {
    const p = products[0];
    return { productId: p.id, productName: p.name, quantity: 0, pricePerBottle: p.default_sell_price, subtotal: 0 };
  }
  return { productName: '', quantity: 0, pricePerBottle: 250000, subtotal: 0 };
}


// Auto-resolve price per bottle based on total quantity (tier brackets)
const TIER_BRACKETS: { minQty: number; price: number }[] = [
  { minQty: 200, price: 150000 },
  { minQty: 40, price: 170000 },
  { minQty: 10, price: 180000 },
  { minQty: 5, price: 198000 },
  { minQty: 3, price: 217000 },
  { minQty: 1, price: 250000 },
];

function getPriceByQty(totalQty: number): number {
  for (const bracket of TIER_BRACKETS) {
    if (totalQty >= bracket.minQty) return bracket.price;
  }
  return 250000;
}

export function OrderForm({ customers, currentStock, submitting, onSubmit, onCancel, initialData }: OrderFormProps) {
  const { uploadTransferProof } = useFileUpload();
  const { mitraLevel } = useProfile();
  const { products } = useProducts();

  const mitraInfo = MITRA_LEVELS[mitraLevel];

  // Build default items keyed by product index
  const buildDefaultItems = (): OrderItem[] => {
    if (initialData?.items && initialData.items.length > 0) return initialData.items;
    if (products.length > 0) return products.map(p => ({ productId: p.id, productName: p.name, quantity: 0, pricePerBottle: p.default_sell_price, subtotal: 0 }));
    return [createEmptyItem(products)];
  };

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierType>(initialData?.tier || 'satuan');
  const [items, setItems] = useState<OrderItem[]>(buildDefaultItems());
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(initialData?.transferProofUrl || null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(initialData?.transferProofUrl || null);
  const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customPriceSet, setCustomPriceSet] = useState<Set<number>>(new Set());

  // Sync items with Etalase Produk when products load (async) — only for new orders
  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) return; // skip edits
    if (products.length === 0) return;
    setItems(products.map(p => ({
      productId: p.id,
      productName: p.name,
      quantity: 0,
      pricePerBottle: p.default_sell_price,
      subtotal: 0,
    })));
    setCustomPriceSet(new Set());
  }, [products, initialData]);

  // Custom price modal state
  const [customPriceProductIdx, setCustomPriceProductIdx] = useState<number | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState('');

  // Search customers
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Totals
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalSellPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const totalBuyPrice = mitraInfo.buyPricePerBottle * totalQuantity;
  const estimatedMargin = totalSellPrice - totalBuyPrice;

  // Recent + favorite customers
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
    if (c.tier && TIER_PRICING[c.tier as TierType]) setSelectedTier(c.tier as TierType);
    setShowSearch(false);
  };

  const incrementItem = (idx: number) => {
    setItems(prev => {
      const newItems = prev.map((item, i) => {
        if (i !== idx) return item;
        const newQty = item.quantity + 1;
        return { ...item, quantity: newQty };
      });
      // Recalculate prices based on total qty for non-custom-priced items
      const newTotal = newItems.reduce((s, it) => s + it.quantity, 0);
      const autoPrice = getPriceByQty(newTotal);
      return newItems.map((item, i) => {
        if (customPriceSet.has(i)) return { ...item, subtotal: item.quantity * item.pricePerBottle };
        return { ...item, pricePerBottle: autoPrice, subtotal: item.quantity * autoPrice };
      });
    });
  };

  const decrementItem = (idx: number) => {
    setItems(prev => {
      const newItems = prev.map((item, i) => {
        if (i !== idx) return item;
        const newQty = Math.max(0, item.quantity - 1);
        return { ...item, quantity: newQty };
      });
      const newTotal = newItems.reduce((s, it) => s + it.quantity, 0);
      const autoPrice = getPriceByQty(newTotal);
      return newItems.map((item, i) => {
        if (customPriceSet.has(i)) return { ...item, subtotal: item.quantity * item.pricePerBottle };
        return { ...item, pricePerBottle: autoPrice, subtotal: item.quantity * autoPrice };
      });
    });
  };

  const openCustomPrice = (idx: number) => {
    setCustomPriceProductIdx(idx);
    setCustomPriceInput(String(items[idx].pricePerBottle));
  };

  const applyCustomPrice = () => {
    if (customPriceProductIdx === null) return;
    const price = parseInt(customPriceInput.replace(/\D/g, ''), 10) || 0;
    setCustomPriceSet(prev => new Set([...prev, customPriceProductIdx]));
    setItems(prev => prev.map((item, i) => {
      if (i !== customPriceProductIdx) return item;
      return { ...item, pricePerBottle: price, subtotal: item.quantity * price };
    }));
    setCustomPriceProductIdx(null);
  };

  const handleKeypad = (key: string) => {
    if (key === 'C') { setCustomPriceInput(''); return; }
    if (key === '⌫') { setCustomPriceInput(p => p.slice(0, -1)); return; }
    setCustomPriceInput(p => p + key);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setTransferProofPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const url = await uploadTransferProof(file);
      setTransferProofUrl(url);
      toast.success('Bukti transfer berhasil diupload');
    } catch {
      toast.error('Gagal upload bukti transfer');
      setTransferProofPreview(null);
    } finally { setUploading(false); }
  };

  const handleSubmit = () => {
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
      toast.error(`Stok tidak cukup. Tersisa ${currentStock} pcs`);
      return;
    }
    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      tier: selectedTier,
      items: activeItems,
      transferProofUrl: transferProofUrl || undefined,
      customerId: selectedCustomerId || undefined,
      createdAt: orderDate ? new Date(orderDate).toISOString() : undefined,
    });
  };

  const hasCustomPrice = items.some((item, idx) => {
    if (!products[idx]) return false;
    return item.pricePerBottle !== products[idx].default_sell_price;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 bg-white relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Express Order</h1>
            <p className="text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Zap className="h-4 w-4" />
              Mode Cepat Aktif
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-8 py-4 pb-44 relative z-0">

        {/* ── PILIH PELANGGAN ── */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Pilih Pelanggan
            </h2>
            <button
              className="text-emerald-600 text-sm font-bold"
              onClick={() => setShowSearch(v => !v)}
            >
              + Baru
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Recent */}
            {recentCustomer && (
              <button
                onClick={() => selectCustomer(recentCustomer)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-2xl shadow-md border-2 transition-all text-left active:scale-95",
                  customerName === recentCustomer.name
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white border-slate-100 text-slate-800 hover:border-emerald-200"
                )}
              >
                <span className={cn("text-[10px] uppercase tracking-widest font-black mb-1",
                  customerName === recentCustomer.name ? "opacity-80" : "text-slate-400")}>Terakhir</span>
                <span className="text-lg font-bold leading-tight">{recentCustomer.name}</span>
                <span className={cn("text-xs mt-1", customerName === recentCustomer.name ? "opacity-90" : "text-slate-500")}>
                  {TIER_PRICING[recentCustomer.tier as TierType]?.label || recentCustomer.tier} • {(recentCustomer as any).address?.split(',')[0] || '–'}
                </span>
              </button>
            )}

            {/* Favorites */}
            {favoriteCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-2xl border-2 shadow-sm transition-all text-left active:scale-95",
                  customerName === c.name
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white border-slate-100 text-slate-800 hover:border-emerald-200"
                )}
              >
                <span className={cn("text-[10px] uppercase tracking-widest font-black mb-1",
                  customerName === c.name ? "opacity-80" : "text-slate-400")}>Favorit</span>
                <span className="text-lg font-bold leading-tight">{c.name}</span>
                <span className={cn("text-xs mt-1", customerName === c.name ? "opacity-90" : "text-slate-500")}>
                  {TIER_PRICING[c.tier as TierType]?.label || c.tier} • {(c as any).address?.split(',')[0] || '–'}
                </span>
              </button>
            ))}

            {/* Search tile */}
            <button
              onClick={() => setShowSearch(v => !v)}
              className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 transition-all text-slate-500 hover:bg-slate-100 active:scale-95"
            >
              <Search className="h-5 w-5 mr-2" />
              <span className="font-bold">Cari Lainnya</span>
            </button>
          </div>

          {/* Search / New Customer panel */}
          {showSearch && (
            <div className="mt-4 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
              <div className="p-3 border-b border-slate-100">
                <input
                  autoFocus
                  placeholder="Cari nama atau nomor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-base font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
              </div>

              {/* Manual entry if no match */}
              <div className="p-3 border-b border-slate-100 space-y-2">
                <input
                  placeholder="Nama pelanggan *"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-base font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
                <input
                  placeholder="No. WhatsApp *"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-base font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
                <input
                  placeholder="Alamat (opsional)"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-base font-medium outline-none border border-slate-200 focus:border-emerald-400"
                />
              </div>

              {/* Search results */}
              {filteredCustomers.length > 0 && (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.phone} · {TIER_PRICING[c.tier as TierType]?.label || c.tier}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3">
                <button
                  onClick={() => setShowSearch(false)}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Konfirmasi Pelanggan
                </button>
              </div>
            </div>
          )}

          {/* Selected customer indicator */}
          {customerName && !showSearch && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <Users className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-800 font-bold text-sm truncate">{customerName}</span>
              <span className="text-emerald-600 text-sm">{customerPhone}</span>
            </div>
          )}
        </section>

        {/* ── PRODUK ── */}
        <section>
          <div className="px-6 flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Produk Terlaris
            </h2>
            <span className="text-sm text-slate-500 font-medium">Stok: {currentStock}</span>
          </div>

          <div className="flex overflow-x-auto gap-4 px-6 pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {items.map((item, idx) => {
              const product = products[idx];
              const isCustomPrice = product && item.pricePerBottle !== product.default_sell_price;
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative"
                >
                  {/* Product image / placeholder */}
                  <div className="h-40 bg-gradient-to-br from-emerald-50 to-slate-100 relative overflow-hidden flex items-center justify-center">
                    <Package className="h-16 w-16 text-emerald-200" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-emerald-700">
                      STOK {currentStock}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{item.productName || 'Produk'}</h3>

                    {/* Price with edit */}
                    <button
                      type="button"
                      onClick={() => openCustomPrice(idx)}
                      className="mt-2 flex items-center gap-2 px-3 py-1 -ml-3 rounded-lg hover:bg-slate-50 active:bg-emerald-50 transition-colors w-full text-left"
                    >
                      <span className={cn("font-bold text-lg", isCustomPrice ? "text-amber-500" : "text-emerald-600")}>
                        {formatCurrency(item.pricePerBottle)}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Pencil className="h-3.5 w-3.5" />
                      </span>
                      {isCustomPrice && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">CUSTOM</span>
                      )}
                    </button>

                    {/* Quantity control */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => decrementItem(idx)}
                          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 active:bg-slate-50 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-2xl font-black w-8 text-center">{item.quantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => incrementItem(idx)}
                        className="w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center active:scale-90 transition-transform hover:bg-emerald-700"
                      >
                        <Plus className="h-8 w-8" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── RINGKASAN ── */}
        <section className="px-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {hasCustomPrice && (
              <div className="absolute top-0 right-0 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Harga Custom Aktif
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Ringkasan Pesanan</span>
              <span className="bg-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {totalQuantity > 0 ? `${totalQuantity} pcs` : 'Baru'}
              </span>
            </div>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-end">
                <span className="text-slate-300">Total Harga</span>
                <span className="text-2xl font-black">{formatCurrency(totalSellPrice)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-emerald-400 font-bold">Estimasi Profit</span>
                <span className={cn("text-xl font-black", estimatedMargin >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatCurrency(estimatedMargin)}
                </span>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="w-full py-4 bg-white/10 rounded-2xl border border-white/20 text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Opsi Pengiriman &amp; Lainnya
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Advanced section */}
            {showAdvanced && (
              <div className="mt-4 space-y-3">
                <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tanggal Order</p>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={e => setOrderDate(e.target.value)}
                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none border border-white/20 focus:border-emerald-400"
                  />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider pt-1">Tier Pelanggan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(TIER_PRICING).map(tier => (
                      <button
                        key={tier.tier}
                        type="button"
                        onClick={() => setSelectedTier(tier.tier)}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-bold transition-colors",
                          selectedTier === tier.tier
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        )}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider pt-1">Bukti Transfer</p>
                  <input type="file" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                  {transferProofPreview ? (
                    <div className="relative">
                      {uploading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      <img src={transferProofPreview} alt="Bukti transfer" className="h-32 w-full rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={() => { setTransferProofUrl(null); setTransferProofPreview(null); }}
                        className="absolute right-2 top-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-white/10 rounded-xl border border-dashed border-white/30 text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Bukti Transfer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── FIXED SAVE BUTTON ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-6 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-20">
        <div className="pointer-events-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting || totalQuantity === 0 || totalQuantity > currentStock}
            className={cn(
              "w-full h-20 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all font-black text-2xl tracking-tight",
              submitting || totalQuantity === 0 || totalQuantity > currentStock
                ? "bg-slate-300 text-slate-500 shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
            )}
          >
            {submitting ? (
              <><Loader2 className="h-6 w-6 animate-spin" /> Menyimpan...</>
            ) : (
              <>
                SIMPAN ORDER
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── CUSTOM PRICE MODAL ── */}
      {customPriceProductIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setCustomPriceProductIdx(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center mb-6">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wide">Ubah Harga Satuan</h3>
              <p className="text-slate-800 font-bold text-lg leading-tight mt-1">
                {items[customPriceProductIdx]?.productName}
              </p>
            </div>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-2xl">Rp</span>
              </div>
              <div className="w-full pl-14 pr-4 py-4 text-4xl font-black text-emerald-600 bg-slate-50 border-2 border-emerald-500 rounded-2xl text-center shadow-inner">
                {customPriceInput ? parseInt(customPriceInput).toLocaleString('id-ID') : '0'}
              </div>
            </div>
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                <button
                  key={k}
                  onClick={() => handleKeypad(k)}
                  className="flex items-center justify-center text-2xl font-bold bg-white rounded-xl shadow-sm border border-slate-200 active:bg-emerald-50 active:border-emerald-500 transition-colors h-14"
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCustomPriceProductIdx(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl"
              >Batal</button>
              <button
                onClick={applyCustomPrice}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200"
              >Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
