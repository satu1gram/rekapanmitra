import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Loader2, CheckCircle2, User, Phone, MapPin, ShoppingBag, Package, Plus, Minus, Info, Search, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import { MITRA_LEVELS, TierType, TIER_PRICING } from '@/types';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIndonesianRegions } from '@/hooks/useIndonesianRegions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  id: string;
  name: string;
  default_sell_price: number;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
  package_type?: string;
}

const PRODUCT_DETAILS: Record<string, { desc: string; benefits: string[] }> = {
  'STEFFI': { desc: 'Skincare premium untuk perawatan kulit harian, menjaga kelembapan dan mencerahkan secara natural.', benefits: ['Mencerahkan kulit', 'Menyamarkan noda hitam', 'BPOM Approved'] },
  'BELGIE': { desc: 'Serum anti-aging mutakhir dari Eropa untuk merawat keremajaan kulit Anda.', benefits: ['Mengurangi kerutan halus', 'Kulit tampak lebih kenyal', 'Aman khusus kulit sensitif'] },
  'BP': { desc: 'British Propolis asli berkualitas tinggi, suplemen andalan untuk daya tahan tubuh keluarga.', benefits: ['Meningkatkan imunitas', 'Membantu proses pemulihan', 'Kaya antioksidan'] },
  'BRO': { desc: 'Rangkaian perawatan khusus pria agar wajah dan tubuh bebas kusam serta tampil penuh percaya diri.', benefits: ['Menyegarkan kulit wajah', 'Wangi maskulin tahan lama', 'Mencegah jerawat'] },
  'BRE': { desc: 'Solusi menyeluruh dari alam untuk perawatan rambut rontok dan merangsang pertumbuhan alami.', benefits: ['Menguatkan akar rambut', 'Merangsang folikel baru', 'Bahan alami & aman'] },
  'NORWAY': { desc: 'Minyak Ikan Salmon Norwegia premium yang kaya asupan nutrisi untuk masa depan.', benefits: ['Nutrisi kecerdasan anak', 'Menjaga kesehatan jantung', 'Bebas kontaminasi merkuri'] }
};

export function TambahOrderFlow({ customers, currentStock, submitting, onSubmit, onCancel, initialSelectedCustomerId }: TambahOrderFlowProps) {
  const { profile } = useProfile();
  const { products, loading: productsLoading } = useProducts();
  const mitraLevel = profile?.mitra_level || 'reseller';

  const productCategories = useMemo(() => {
    const categories: Record<string, Product[]> = {};
    for (const p of products) {
      // Split by space OR underscore to get the root brand name (e.g. "BELGIE_FW" -> "BELGIE")
      const groupName = p.category || p.name.split(/[ _]/)[0] || 'Lainnya';
      if (!categories[groupName]) categories[groupName] = [];
      categories[groupName].push(p);
    }
    for (const cat of Object.keys(categories)) {
      categories[cat].sort((a, b) => b.quantity_per_package - a.quantity_per_package);
    }
    return categories;
  }, [products]);

  const [step, setStep] = useState<Step>('info'); // Start with info
  const [items, setItems] = useState<ProductItem[]>([]);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerProvince, setCustomerProvince] = useState('');
  const [tier, setTier] = useState<TierType>('satuan');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialSelectedCustomerId || null);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { provinces, cities, fetchCities, loadingProvinces, loadingCities } = useIndonesianRegions();
  const [selectedProvinceId, setSelectedProvinceId] = useState('');

  // Sync province ID when data loads or selection changes
  useEffect(() => {
    if (provinces.length > 0 && customerProvince && !selectedProvinceId) {
      const prov = provinces.find(p => p.name.toLowerCase() === customerProvince.toLowerCase());
      if (prov) {
        setSelectedProvinceId(prov.id);
        fetchCities(prov.id);
      }
    }
  }, [provinces, customerProvince, selectedProvinceId, fetchCities]);

  const recalcItems = useCallback((newItems: ProductItem[], currentTier: TierType): ProductItem[] => {
    return newItems.map(item => {
      const tiers = productCategories[item.name] || [];
      let pricePerBottle = item.default_sell_price;
      let applicableTier: any = null;

      if (currentTier !== 'satuan') {
        const expectedQty = TIER_PRICING[currentTier]?.bottles || 1;

        // 1. Exact match by quantity
        applicableTier = tiers.find(t => t.quantity_per_package === expectedQty);
        
        // 2. Fuzzy match by name/label if exact qty fails
        if (!applicableTier) {
          const label = currentTier.toLowerCase().substring(0, 3); // 'sap', 'age', 'res'
          applicableTier = tiers.find(t => {
            const pkg = (t.package_type || '').toLowerCase();
            const nm = (t.name || '').toLowerCase();
            return pkg.includes(label) || nm.includes(label);
          });
        }
      }

      if (applicableTier) {
        pricePerBottle = applicableTier.default_sell_price / (applicableTier.quantity_per_package || 1);
      } else {
        // Fallback to static mapping
        const mappedKey = currentTier === 'satuan' ? 'reseller' : currentTier;
        if (MITRA_LEVELS[mappedKey as any]) {
          pricePerBottle = MITRA_LEVELS[mappedKey as any].buyPricePerBottle;
        }
      }

      return {
        ...item,
        pricePerBottle,
        subtotal: item.quantity * pricePerBottle
      };
    });
  }, [productCategories]);

  // Initialize Items
  useEffect(() => {
    if (productsLoading || Object.keys(productCategories).length === 0) return;
    
    const initialItems = Object.keys(productCategories).map(cat => {
      let defaultPricePerBottle = 250000;
      const smallestTier = productCategories[cat][productCategories[cat].length - 1];
      if (smallestTier && smallestTier.quantity_per_package > 0) {
        defaultPricePerBottle = smallestTier.default_sell_price / smallestTier.quantity_per_package;
      }
      return {
        id: smallestTier?.id || cat,
        name: cat,
        default_sell_price: defaultPricePerBottle,
        quantity: 0,
        pricePerBottle: defaultPricePerBottle,
        subtotal: 0,
      };
    });
    setItems(recalcItems(initialItems, tier));
  }, [productCategories, productsLoading, tier, recalcItems]);

  // Calculations
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const activeItems = items.filter(i => i.quantity > 0);
  
  const isMitra = tier !== 'satuan';
  const customerTypeLabel = isMitra ? 'Mitra' : 'Pelanggan';

  const totalProfit = useMemo(() => {
    const buyPrice = MITRA_LEVELS[mitraLevel]?.buyPricePerBottle || 217000;
    return activeItems.reduce((acc, item) => acc + ((item.pricePerBottle - buyPrice) * item.quantity), 0);
  }, [activeItems, mitraLevel]);

  const changeQty = (categoryId: string, delta: number) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.name !== categoryId ? item : { ...item, quantity: Math.max(0, item.quantity + delta) }
      );
      return recalcItems(updated, tier);
    });
  };

  const handleFinalSubmit = async () => {
    if (!customerName || activeItems.length === 0) return;
    const orderData = {
      customerName, customerPhone, customerAddress, customerCity, customerProvince,
      tier: tier || 'satuan',
      items: activeItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        pricePerBottle: item.pricePerBottle,
        subtotal: item.subtotal
      })),
      customerId: selectedCustomerId,
      createdAt: new Date().toISOString()
    };

    if (await onSubmit(orderData)) setStep('success');
  };

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerAddress(c.address || '');
    setCustomerCity(c.city || '');
    setCustomerProvince(c.province || '');
    setTier((c.tier || 'satuan').toLowerCase() as TierType);
    setSelectedCustomerId(c.id);
    setShowCustomerModal(false);

    const prov = provinces.find(p => p.name.toLowerCase() === (c.province || '').toLowerCase());
    if (prov) {
      setSelectedProvinceId(prov.id);
      fetchCities(prov.id);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomerId) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          province: customerProvince,
          tier: tier
        })
        .eq('id', selectedCustomerId);
      
      if (error) throw error;
      toast.success('Data pelanggan diperbarui');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui data pelanggan');
    }
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes((searchQuery || customerName).toLowerCase()));

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10 text-[#059669]" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Order Berhasil!</h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          Pesanan <strong className="text-slate-900">{customerName}</strong> senilai <strong className="text-emerald-600">{formatCurrency(totalPrice)}</strong> dicatat.
        </p>
        <div className="mt-8 w-full max-w-xs bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mx-auto">
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Profit Estimasi</p>
          <p className="text-2xl font-black text-[#059669]">+{formatCurrency(totalProfit)}</p>
        </div>
        <button onClick={onCancel} className="mt-10 w-full max-w-xs h-12 bg-[#059669] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
      {/* Header Compact */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <h1 className="text-sm font-black text-slate-800 flex-1">Tambah Order</h1>
        {totalQty > 0 && <span className="bg-[#059669] text-white px-2 py-0.5 rounded-full text-[10px] font-black">{totalQty} Item</span>}
      </header>

      {/* Steps Progress Compact */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1">
          {['info', 'products', 'summary'].map((s, idx) => {
            const stepIdx = ['info', 'products', 'summary'].indexOf(step);
            const labels = ['Pelanggan', 'Produk', 'Selesai'];
            return (
              <div key={s} className="flex flex-col items-center flex-1 gap-1">
                <div className={cn('h-1 w-full rounded-full transition-all', stepIdx >= idx ? 'bg-[#059669]' : 'bg-slate-100')} />
                <span className={cn('text-[9px] font-black uppercase tracking-wider', stepIdx >= idx ? 'text-[#059669]' : 'text-slate-300')}>{labels[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-4 max-w-md mx-auto space-y-3 pb-24">
        {/* ── STEP 1: INFO (CUSTOMER) ── */}
        {step === 'info' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-[#059669]" />
                </div>
                <h2 className="font-black text-slate-800">Identitas {customerTypeLabel}</h2>
              </div>
              
              <div className="space-y-1 relative">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Nama Lengkap *</Label>
                <div className="relative">
                  <Input 
                    className="h-10 text-sm bg-slate-50 border-slate-100 focus:ring-[#059669]/20" 
                    placeholder="Ketik untuk mencari / tambah baru" 
                    value={customerName} 
                    onChange={e => { setCustomerName(e.target.value); setSelectedCustomerId(null); setShowCustomerModal(true); }}
                    onFocus={() => setShowCustomerModal(true)}
                  />
                  {customerName && <button onClick={() => {setCustomerName(''); setSelectedCustomerId(null);}} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-400"><X className="h-4 w-4" /></button>}
                </div>

                {showCustomerModal && customerName.length > 0 && !selectedCustomerId && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto py-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">Gunakan sebagai nama baru: <span className="font-bold text-slate-800">"{customerName}"</span></div>
                    ) : (
                      filteredCustomers.map(c => (
                        <button key={c.id} onClick={() => selectCustomer(c)} className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-[13px] font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.city || 'Tanpa kota'}</p>
                          </div>
                          <span className="text-[9px] font-black bg-green-50 text-[#059669] px-1.5 py-0.5 rounded uppercase">{c.tier}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">No. WhatsApp</Label>
                  <Input className="h-10 text-sm bg-slate-50 border-slate-100" placeholder="08..." type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Provinsi</Label>
                  <Select 
                    value={selectedProvinceId} 
                    onValueChange={(val) => {
                      setSelectedProvinceId(val);
                      const p = provinces.find(x => x.id === val);
                      if (p) setCustomerProvince(p.name);
                      fetchCities(val);
                    }}
                    disabled={loadingProvinces}
                  >
                    <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-100 focus:ring-[#059669]/20">
                      <SelectValue placeholder={loadingProvinces ? "Memuat..." : "Pilih Provinsi..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[201]">
                      {provinces.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Kota/Kab</Label>
                  <Select 
                    value={customerCity} 
                    onValueChange={setCustomerCity}
                    disabled={!selectedProvinceId || loadingCities}
                  >
                    <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-100 focus:ring-[#059669]/20">
                      <SelectValue placeholder={loadingCities ? "Memuat..." : (!selectedProvinceId ? "Pilih Prov dulu" : "Pilih Kota...")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[201]">
                      {cities.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Level Harga</Label>
                <div className="flex gap-2">
                  <select className="flex-1 h-10 border border-slate-100 rounded-lg px-3 text-sm bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20" value={tier} onChange={(e) => setTier(e.target.value.toLowerCase() as TierType)}>
                    <option value="satuan">Konsumen Satuan</option>
                    <option value="reseller">Reseller</option>
                    <option value="agen">Agen</option>
                    <option value="agen_plus">Agen Plus</option>
                    <option value="sap">SAP (Agen Spesial Plus)</option>
                    <option value="se">SE (Special Entrepreneur)</option>
                  </select>
                  {selectedCustomerId && (
                    <button 
                      onClick={handleUpdateCustomer}
                      className="px-3 bg-emerald-50 text-[#059669] rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm"
                    >
                      Update Data
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">*Harga akan menyesuaikan otomatis di tahap berikutnya.</p>
              </div>

              <button onClick={() => setStep('products')} disabled={!customerName.trim()} className="w-full py-3.5 bg-[#059669] text-white rounded-xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-4">
                Lanjut Pilih Produk <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PRODUCTS ── */}
        {step === 'products' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-[#1A1F2C] rounded-2xl p-4 flex items-center justify-between text-white shadow-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{customerTypeLabel}</p>
                  <p className="text-sm font-bold truncate max-w-[150px]">{customerName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level Harga</p>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{tier.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-[#059669]" />
                <h2 className="font-black text-slate-800">Daftar Produk</h2>
              </div>
              
              {productsLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#059669]" /></div>
              ) : (
                <div className="space-y-2.5">
                  {items.map(item => (
                    <div key={item.id} className={cn('rounded-xl p-3 border transition-all', item.quantity > 0 ? 'border-[#059669]/30 bg-green-50/30' : 'border-slate-50 bg-slate-50/50')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-bold text-slate-800 text-[13px] truncate">{item.name}</p>
                            {item.package_type && item.package_type !== 'satuan' && <span className="text-[8px] font-black bg-[#059669] text-white px-1 py-0.5 rounded uppercase">Hrg {item.package_type.replace('_', ' ')}</span>}
                          </div>
                          <p className="text-[11px] font-bold text-[#059669]">{formatCurrency(item.pricePerBottle)}<span className="text-slate-400 font-medium ml-1">/ btl</span></p>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                          <button onClick={() => changeQty(item.name, -1)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-50 text-slate-400"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                          <button onClick={() => changeQty(item.name, 1)} className="h-7 w-7 flex items-center justify-center rounded bg-[#059669]/10 text-[#059669] hover:bg-[#059669]/20"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1A1F2C] rounded-2xl p-4 flex items-center gap-3 shadow-xl sticky bottom-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400">{totalQty} botol dipesan</p>
                <p className="text-lg font-black text-white">{formatCurrency(totalPrice)}</p>
              </div>
              <button onClick={() => setStep('summary')} disabled={totalQty === 0} className="bg-[#059669] text-white px-5 py-3 rounded-xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all">
                Cek Order <ArrowRight className="h-4 w-4 ml-1 inline" />
              </button>
            </div>
            
            <button onClick={() => setStep('info')} className="w-full py-3 text-slate-500 font-bold text-xs">← Ubah Data Pelanggan</button>
          </div>
        )}

        {/* ── STEP 3: SUMMARY ── */}
        {step === 'summary' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-base">Konfirmasi Pesanan</h2>
                <div className="px-2 py-1 bg-emerald-50 rounded-lg"><p className="text-[9px] font-black text-[#059669] uppercase tracking-widest">{tier}</p></div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" /><p className="text-[13px] font-bold text-slate-800">{customerName}</p></div>
                {customerPhone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /><p className="text-[12px] font-semibold text-slate-600">{customerPhone}</p></div>}
                <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5" /><p className="text-[12px] font-medium text-slate-600 leading-tight">{customerCity || 'Kota tidak diisi'}</p></div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Produk</p>
                {activeItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.quantity} botol × {formatCurrency(item.pricePerBottle)}</p>
                    </div>
                    <p className="text-[13px] font-black text-slate-800">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <p className="font-black text-slate-600 text-sm">Total Bayar</p>
                <p className="text-xl font-black text-[#009624]">{formatCurrency(totalPrice)}</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Profit Estimasi</p>
                  <p className="text-[10px] text-slate-400">Level {mitraLevel}</p>
                </div>
                <p className="text-base font-black text-emerald-400">+{formatCurrency(totalProfit)}</p>
              </div>
            </div>

            <button onClick={handleFinalSubmit} disabled={submitting} className="w-full py-4 bg-[#059669] text-white rounded-xl font-black text-base disabled:opacity-50 shadow-xl active:scale-95 transition-all">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Simpan & Selesai'}
            </button>

            <button onClick={() => setStep('products')} disabled={submitting} className="w-full py-3 text-slate-400 font-bold text-xs">Kembali Ubah Produk</button>
          </div>
        )}
      </main>
      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-0 md:p-4" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-white w-full h-[85vh] md:h-[600px] max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <button onClick={() => setShowCustomerModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <h3 className="font-extrabold text-slate-800 flex-1 text-sm">Pilih Kontak Tersimpan</h3>
            </div>
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="w-full pl-10 h-11 bg-white border-slate-200 text-sm" placeholder="Cari nama atau telepon..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-xs">Tidak ada kontak ditemukan</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-3 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-colors flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#059669]/10 rounded-full flex items-center justify-center text-[#059669]">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{c.phone || c.city || 'Tidak ada info'}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#059669] bg-green-50 px-2 py-1 rounded-md">{c.tier.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

