import { useState } from 'react';
import { TIER_PRICING, MITRA_LEVELS, MitraLevel } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProducts, Product } from '@/hooks/useProducts';
import {
  LogOut, Loader2, Package, Plus, Trash2, Edit, Check, X,
  TrendingUp, ChevronRight, Rocket, Store, Info,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LEVEL_ORDER: MitraLevel[] = ['reseller', 'agen', 'agenplus', 'se', 'nl'];
const NEXT_LEVEL_LABEL: Record<string, string> = {
  reseller: 'Agen', agen: 'Agen Plus', agenplus: 'Special Entrepreneur', se: 'National Leader', nl: '—',
};

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, mitraLevel, updateMitraLevel, loading: profileLoading } = useProfile();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();

  const [loggingOut, setLoggingOut] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(250000);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [showPricingTable, setShowPricingTable] = useState(false);

  const currentLevelIdx = LEVEL_ORDER.indexOf(mitraLevel as MitraLevel);
  const progressPct = Math.round(((currentLevelIdx + 1) / LEVEL_ORDER.length) * 100);
  const currentMitra = MITRA_LEVELS[mitraLevel];

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); toast.success('Berhasil keluar'); }
    catch { toast.error('Gagal keluar'); }
    finally { setLoggingOut(false); }
  };

  const handleMitraLevelChange = async (level: MitraLevel) => {
    setSavingLevel(true);
    try { await updateMitraLevel(level); toast.success(`Level diubah ke ${MITRA_LEVELS[level].label}`); }
    catch { toast.error('Gagal mengubah level mitra'); }
    finally { setSavingLevel(false); }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) { toast.error('Nama produk wajib diisi'); return; }
    setSavingProduct(true);
    try {
      await addProduct(newProductName.trim(), newProductPrice);
      toast.success(`Produk "${newProductName}" ditambahkan`);
      setNewProductName(''); setNewProductPrice(250000); setShowAddProduct(false);
    } catch { toast.error('Gagal menambah produk'); }
    finally { setSavingProduct(false); }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editName.trim()) return;
    setSavingProduct(true);
    try {
      await updateProduct(editingProduct.id, { name: editName.trim(), default_sell_price: editPrice });
      toast.success('Produk berhasil diupdate'); setEditingProduct(null);
    } catch { toast.error('Gagal mengupdate produk'); }
    finally { setSavingProduct(false); }
  };

  const handleDeleteProduct = async (product: Product) => {
    setSavingProduct(true);
    try { await deleteProduct(product.id); toast.success(`Produk "${product.name}" dihapus`); }
    catch { toast.error('Gagal menghapus produk'); }
    finally { setSavingProduct(false); }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product); setEditName(product.name); setEditPrice(product.default_sell_price);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-8">
      {/* ─── HERO HEADER ─── */}
      <header className="relative overflow-hidden pt-10 pb-14 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-b-[3rem] shadow-2xl">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-orange-400 opacity-20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1 opacity-75">Dashboard Pencapaian</span>
          <h1 className="text-2xl font-extrabold mb-6 leading-tight">Halo, Wirausahawan Hebat!</h1>

          {/* Level badge */}
          <div className="relative">
            <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center border-8 border-indigo-400/30 shadow-2xl">
              <span className="text-[#FF3D00] font-black text-4xl tracking-tighter">
                {mitraLevel.toUpperCase().slice(0, 2)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Level Anda</span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg whitespace-nowrap">
              ⭐ {currentMitra.label.toUpperCase()}
            </div>
          </div>

          {/* Progress to next */}
          <div className="mt-10 w-full max-w-xs">
            <div className="flex justify-between text-[11px] font-bold mb-2 uppercase tracking-wider">
              <span className="opacity-75">Progress Level</span>
              <span className="text-amber-300">Next: {NEXT_LEVEL_LABEL[mitraLevel] || '—'}</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2.5 text-xs font-medium opacity-80">
              Level {currentLevelIdx + 1} dari {LEVEL_ORDER.length} •{' '}
              <span className="font-bold underline">Modal Rp{formatShortCurrency(currentMitra.buyPricePerBottle)}/btl</span>
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-4 space-y-5">

        {/* ─── ETALASE PRODUK ─── */}
        <section className="bg-white rounded-[1.75rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Etalase Produk</h2>
                <p className="text-xs text-slate-500 font-medium italic">Koleksi jualan Anda</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-orange-600 leading-none">{products.length}</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Item Aktif</p>
            </div>
          </div>

          {/* Add product form */}
          {showAddProduct && (
            <div className="mb-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 space-y-3">
              <Label className="text-base font-bold text-slate-700">Nama Produk</Label>
              <Input placeholder="Contoh: BP Merah, Steffi..." value={newProductName}
                onChange={e => setNewProductName(e.target.value)} disabled={savingProduct}
                className="h-11 text-base bg-white" />
              <Label className="text-base font-bold text-slate-700">Harga Jual Default</Label>
              <Input type="number" step={1000} value={newProductPrice}
                onChange={e => setNewProductPrice(parseInt(e.target.value) || 0)} disabled={savingProduct}
                className="h-11 text-base bg-white" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowAddProduct(false); setNewProductName(''); }}
                  className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm">
                  Batal
                </button>
                <button onClick={handleAddProduct} disabled={savingProduct || !newProductName.trim()}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                  {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Simpan
                </button>
              </div>
            </div>
          )}

          {/* Product list */}
          {productsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-orange-400" /></div>
          ) : products.length === 0 && !showAddProduct ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white shadow-md rounded-full flex items-center justify-center mb-3">
                <Store className="h-8 w-8 text-orange-400" />
              </div>
              <p className="text-slate-600 font-bold mb-1">Mulai Isi Toko Anda</p>
              <p className="text-xs text-slate-400 mb-4 max-w-[180px]">Tambah produk pertama untuk mempermudah pembuatan order.</p>
              <button onClick={() => setShowAddProduct(true)}
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors">
                TAMBAH PRODUK
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <div key={product.id} className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  {editingProduct?.id === product.id ? (
                    <div className="space-y-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-10 text-sm" disabled={savingProduct} />
                      <Input type="number" value={editPrice} onChange={e => setEditPrice(parseInt(e.target.value) || 0)} className="h-10 text-sm" disabled={savingProduct} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingProduct(null)} className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm">Batal</button>
                        <button onClick={handleEditProduct} disabled={savingProduct || !editName.trim()} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-1">
                          <Check className="h-4 w-4" /> Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(product.default_sell_price)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(product)} className="w-8 h-8 rounded-lg bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center border border-slate-200">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!showAddProduct && (
                <button onClick={() => setShowAddProduct(true)}
                  className="w-full py-3 border-2 border-dashed border-orange-200 rounded-2xl text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Tambah Produk
                </button>
              )}
            </div>
          )}
        </section>

        {/* ─── POTENSI PROFIT ─── */}
        <section className="bg-white rounded-[1.75rem] p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Potensi Profit</h2>
              <p className="text-xs text-slate-500 font-medium">Bandingkan margin & keuntungan</p>
            </div>
          </div>

          {/* Current level highlight */}
          <div className="relative bg-emerald-50 rounded-2xl p-5 border border-emerald-100 overflow-hidden">
            <div className="absolute -right-3 -top-3 opacity-10">
              <Check className="h-24 w-24 text-emerald-600" />
            </div>
            <span className="bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-2 block w-fit">Status Sekarang</span>
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(currentMitra.buyPricePerBottle)} <span className="text-xs font-bold text-slate-500">/ btl</span></h3>
            <p className="text-xs font-bold text-emerald-700">{currentMitra.label}</p>
          </div>

          {/* Level selector */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ubah Level Mitra</p>
            <div className="space-y-2">
              {Object.values(MITRA_LEVELS).map(level => (
                <button
                  key={level.level}
                  onClick={() => handleMitraLevelChange(level.level as MitraLevel)}
                  disabled={savingLevel}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all',
                    mitraLevel === level.level
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  )}
                >
                  <div className="text-left">
                    <p className="font-black text-sm">{level.label}</p>
                    <p className="text-xs opacity-70">Modal {formatShortCurrency(level.buyPricePerBottle)}/btl</p>
                  </div>
                  {mitraLevel === level.level
                    ? <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">AKTIF</span>
                    : savingLevel ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-300" />}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-amber-500/20">
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-tight opacity-90">Mau Profit Lebih Gede?</p>
                <p className="text-sm font-black leading-tight">Ambil Paket 40 Botol — Margin Lebih Besar!</p>
              </div>
            </div>
          </div>

          {/* Pricing table toggle */}
          <button onClick={() => setShowPricingTable(!showPricingTable)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Tabel Harga Jual
            </div>
            <ChevronRight className={cn('h-4 w-4 transition-transform', showPricingTable && 'rotate-90')} />
          </button>
          {showPricingTable && (
            <div className="space-y-2 pt-1">
              {Object.values(TIER_PRICING).map(tier => (
                <div key={tier.tier} className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{tier.label}</p>
                    <p className="text-xs text-slate-500">{tier.bottles} botol • {formatShortCurrency(tier.pricePerBottle)}/btl</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{formatCurrency(tier.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── PROFIL & LOGOUT ─── */}
        <section className="bg-white rounded-[1.75rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-2xl font-black text-slate-400">
                {user?.email?.slice(0, 1).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{user?.email}</h3>
              <p className="text-xs text-slate-500 font-medium">📍 {profile?.location || 'Malang, Indonesia'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout} disabled={loggingOut}
            className="w-full group flex items-center justify-between bg-rose-50 hover:bg-rose-100 p-5 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-200/50 rounded-xl flex items-center justify-center text-rose-600">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-rose-600">
                {loggingOut ? 'Keluar...' : 'Keluar Aplikasi'}
              </span>
            </div>
            {loggingOut
              ? <Loader2 className="h-5 w-5 animate-spin text-rose-300" />
              : <ChevronRight className="h-5 w-5 text-rose-300 group-hover:translate-x-1 transition-transform" />}
          </button>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="text-center py-6">
          <p className="text-sm font-black text-slate-300 tracking-[0.2em] uppercase">BP Community Manager</p>
          <div className="flex justify-center items-center gap-2 mt-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version 1.1.0</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Made in Malang 🇮🇩</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
