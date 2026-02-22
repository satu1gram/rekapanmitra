import { useState, useRef, useEffect } from 'react';
import { useStock } from '@/hooks/useStockDb';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { TierType, MITRA_LEVELS } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import {
  Minus, Plus, Package, AlertTriangle, Upload, X, Loader2, History,
  ChevronDown, Check, Edit, Trash2, ArrowDown, ArrowUp, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type StockEntry = Tables<'stock_entries'>;

type View = 'main' | 'restok' | 'initial' | 'history';

export function StockPage() {
  const { currentStock, stockEntries, loading, addStock, updateStockEntry, deleteStockEntry, isLowStock } = useStock();
  const { uploadTransferProof } = useFileUpload();
  const { mitraLevel } = useProfile();

  const mitraInfo = MITRA_LEVELS[mitraLevel];

  const [view, setView] = useState<View>('main');
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(mitraInfo.buyPricePerBottle);
  const [notes, setNotes] = useState('');
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialQty, setInitialQty] = useState(1);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBuyPrice(MITRA_LEVELS[mitraLevel].buyPricePerBottle);
  }, [mitraLevel]);

  const resetForm = () => {
    setQuantity(1);
    setBuyPrice(MITRA_LEVELS[mitraLevel].buyPricePerBottle);
    setNotes('');
    setStockDate(new Date().toISOString().split('T')[0]);
    setShowAdvanced(false);
    setTransferProofUrl(null);
    setTransferProofPreview(null);
    setEditingEntry(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      toast.success('Bukti bayar berhasil diupload');
    } catch {
      toast.error('Gagal upload bukti bayar');
      setTransferProofPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRestok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) { toast.error('Jumlah minimal 1 botol'); return; }
    setSubmitting(true);
    try {
      if (editingEntry) {
        await updateStockEntry(editingEntry.id, {
          quantity, tier: mitraLevel as TierType, buyPricePerBottle: buyPrice,
          transferProofUrl: transferProofUrl || undefined,
          notes: notes.trim() || undefined,
          createdAt: stockDate ? new Date(stockDate).toISOString() : undefined
        }, editingEntry.quantity);
        toast.success('Restok berhasil diupdate!');
      } else {
        await addStock({
          quantity, tier: mitraLevel as TierType, buyPricePerBottle: buyPrice,
          transferProofUrl: transferProofUrl || undefined,
          notes: notes.trim() || undefined,
          createdAt: stockDate ? new Date(stockDate).toISOString() : undefined,
        });
        toast.success(`Berhasil menambah ${quantity} botol ke stok!`);
      }
      resetForm();
      setView('main');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal menambah stok');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialQty < 1) { toast.error('Jumlah minimal 1 botol'); return; }
    setSubmitting(true);
    try {
      await addStock({ quantity: initialQty, tier: mitraLevel as TierType, isInitialStock: true });
      toast.success(`Berhasil menambah ${initialQty} botol stok awal!`);
      setInitialQty(1);
      setView('main');
    } catch {
      toast.error('Gagal menambah stok awal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: StockEntry) => {
    try {
      await deleteStockEntry(entry.id, entry.quantity, entry.type);
      toast.success('Riwayat stok berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const openEdit = (entry: StockEntry) => {
    setEditingEntry(entry);
    setQuantity(entry.quantity);
    setBuyPrice(entry.buy_price_per_bottle || MITRA_LEVELS[mitraLevel].buyPricePerBottle);
    setNotes(entry.notes || '');
    setTransferProofUrl(entry.transfer_proof_url);
    setTransferProofPreview(entry.transfer_proof_url);
    if (entry.created_at) setStockDate(new Date(entry.created_at).toISOString().split('T')[0]);
    setView('restok');
  };

  const formattedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  /* ─── RESTOK FORM ─── */
  if (view === 'restok') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-5 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200/50">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stok</h1>
            <p className="text-base text-gray-600 font-medium mt-0.5">Kelola persediaan produk</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setView('history'); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 shadow-sm transition-colors"
            >
              <History className="h-5 w-5" />
              <span>Riwayat</span>
            </button>
            <button
              onClick={() => { resetForm(); setView('main'); }}
              className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex items-center justify-center font-bold transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Stock info bar */}
        <div className="mx-5 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Package className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Stok Saat Ini</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{currentStock}</span>
              <span className="text-xl font-semibold text-gray-600">botol</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRestok} className="flex-1 mx-5 mt-5 mb-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3" />
            {editingEntry ? 'Edit Restok' : 'Restok dari Distributor'}
          </h3>

          {/* Quantity */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Jumlah Botol</label>
            <div className="flex items-center gap-4">
              <button type="button"
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-500 active:bg-gray-50 transition-all shadow-sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                <Minus className="h-7 w-7" />
              </button>
              <div className="flex-1 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
                <input
                  type="number" inputMode="numeric" min={1} value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value.replace(/^0+/, '')) || 1)}
                  className="w-full h-full bg-transparent text-center text-3xl font-bold text-gray-900 border-none focus:ring-0 p-0"
                />
              </div>
              <button type="button"
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 active:bg-emerald-100 transition-all shadow-sm"
                onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-7 w-7" />
              </button>
            </div>
          </div>

          {/* Buy price */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Harga Beli per Botol</label>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(buyPrice)}</p>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-1 mt-1">
                <Check className="h-4 w-4 text-emerald-600" />
                Level: {mitraInfo.label}
              </p>
            </div>
          </div>

          {/* Total summary */}
          <div className="bg-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border border-gray-200">
            <div>
              <p className="text-base font-bold text-gray-600 uppercase tracking-wide">Total Pembelian</p>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{quantity} botol × {formatCurrency(buyPrice)}</p>
            </div>
            <span className="text-3xl font-extrabold text-emerald-600">{formatCurrency(quantity * buyPrice)}</span>
          </div>

          {/* Advanced options */}
          <div className="border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-lg font-bold text-gray-700">
                <Settings2 className="h-6 w-6 text-gray-500" />
                Opsi Lainnya
              </div>
              <ChevronDown className={cn('h-7 w-7 text-gray-400 transition-transform duration-300', showAdvanced && 'rotate-180')} />
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-6 px-1">
                {/* Date */}
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">Pilih Tanggal</label>
                  <input
                    type="date" value={stockDate}
                    onChange={e => setStockDate(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 px-5 text-xl font-bold text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {stockDate && (
                    <p className="mt-1.5 text-base text-gray-600 font-medium pl-1">
                      {formattedDate(stockDate)}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">Catatan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Tulis catatan disini..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-200 bg-white text-gray-900 text-lg font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 p-4 placeholder-gray-400 shadow-sm resize-none"
                  />
                </div>

                {/* Upload proof */}
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">Bukti Pembayaran</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  {transferProofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden">
                      {uploading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                        </div>
                      )}
                      <img src={transferProofPreview} alt="Bukti" className="w-full h-36 object-cover" />
                      <button type="button" onClick={() => { setTransferProofUrl(null); setTransferProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-16 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 font-bold text-lg flex items-center justify-center gap-3 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-[0.99]">
                      <Upload className="h-6 w-6" />
                      Unggah Foto Bukti
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-7 w-7" />}
            {editingEntry ? 'Simpan Perubahan' : 'Tambah ke Stok'}
          </button>
        </form>
      </div>
    );
  }

  /* ─── INITIAL STOCK FORM ─── */
  if (view === 'initial') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="flex items-center justify-between px-5 py-5 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200/50">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stok Awal</h1>
            <p className="text-base text-gray-600 font-medium mt-0.5">Inisiasi stok toko tanpa harga beli</p>
          </div>
          <button onClick={() => setView('main')}
            className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex items-center justify-center transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleInitialStock} className="flex-1 mx-5 mt-6 mb-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3" />
            Jumlah Botol Awal
          </h3>

          <div className="flex items-center gap-4">
            <button type="button"
              className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-500 transition-all shadow-sm"
              onClick={() => setInitialQty(Math.max(1, initialQty - 1))} disabled={initialQty <= 1}>
              <Minus className="h-7 w-7" />
            </button>
            <div className="flex-1 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
              <input type="number" inputMode="numeric" min={1} value={initialQty}
                onChange={e => setInitialQty(parseInt(e.target.value.replace(/^0+/, '')) || 1)}
                className="w-full h-full bg-transparent text-center text-3xl font-bold text-gray-900 border-none focus:ring-0 p-0" />
            </div>
            <button type="button"
              className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-sm"
              onClick={() => setInitialQty(initialQty + 1)}>
              <Plus className="h-7 w-7" />
            </button>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Package className="h-7 w-7" />}
            Tambah Stok Awal
          </button>
        </form>
      </div>
    );
  }

  /* ─── HISTORY VIEW ─── */
  if (view === 'history') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="flex items-center justify-between px-5 py-5 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200/50">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Riwayat Stok</h1>
          </div>
          <button onClick={() => setView('main')}
            className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex items-center justify-center transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="px-5 py-4 space-y-3">
          {stockEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">Belum ada riwayat stok</p>
            </div>
          ) : stockEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn('rounded-full p-2.5', entry.type === 'out' ? 'bg-red-50' : 'bg-emerald-50')}>
                  {entry.type === 'out'
                    ? <ArrowUp className="h-5 w-5 text-red-500" />
                    : <ArrowDown className="h-5 w-5 text-emerald-600" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {entry.notes === 'Stok awal' ? 'Stok Awal' : entry.type === 'in' ? 'Restok' : 'Keluar'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(entry.created_at)}</p>
                  {entry.notes && entry.notes !== 'Stok awal' && (
                    <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={cn('font-black text-base', entry.type === 'out' ? 'text-red-500' : 'text-emerald-600')}>
                    {entry.type === 'out' ? '-' : '+'}{entry.quantity} botol
                  </p>
                </div>
                {entry.type !== 'out' && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(entry)}
                      className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(entry)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── MAIN VIEW ─── */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-5 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200/50">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stok</h1>
          <p className="text-base text-gray-600 font-medium mt-0.5">Kelola persediaan produk</p>
        </div>
        <button onClick={() => setView('history')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 shadow-sm transition-colors">
          <History className="h-5 w-5" />
          <span>Riwayat</span>
        </button>
      </header>

      <main className="px-5 pt-4 pb-6 space-y-5">
        {/* Stock card */}
        <section className={cn('bg-white rounded-3xl p-6 shadow-sm border flex items-center gap-5',
          isLowStock ? 'border-red-200 bg-red-50' : 'border-gray-100')}>
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center shrink-0',
            isLowStock ? 'bg-red-100' : 'bg-emerald-50 border border-emerald-100')}>
            {isLowStock
              ? <AlertTriangle className="h-8 w-8 text-red-500" />
              : <Package className="h-8 w-8 text-emerald-600" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Stok Saat Ini</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-gray-900 tracking-tight">{currentStock}</span>
              <span className="text-xl font-semibold text-gray-600">botol</span>
            </div>
            {isLowStock && <p className="text-sm font-bold text-red-500 mt-1">⚠ Stok Rendah!</p>}
          </div>
        </section>

        {/* Action buttons */}
        <section className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { resetForm(); setView('restok'); }}
            className="bg-emerald-600 text-white rounded-3xl p-6 flex flex-col items-start gap-3 shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Plus className="h-7 w-7" />
            </div>
            <div>
              <p className="font-black text-lg leading-tight">Restok</p>
              <p className="text-emerald-100 text-sm font-medium">Tambah dari distributor</p>
            </div>
          </button>
          <button
            onClick={() => setView('initial')}
            className="bg-white border-2 border-gray-200 text-gray-800 rounded-3xl p-6 flex flex-col items-start gap-3 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Package className="h-7 w-7 text-gray-600" />
            </div>
            <div>
              <p className="font-black text-lg leading-tight">Stok Awal</p>
              <p className="text-gray-500 text-sm font-medium">Inisiasi tanpa harga</p>
            </div>
          </button>
        </section>

        {/* Recent entries */}
        {stockEntries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">Riwayat Terbaru</h3>
              <button onClick={() => setView('history')} className="text-emerald-600 font-semibold text-sm hover:text-emerald-700">
                Lihat semua →
              </button>
            </div>
            <div className="space-y-3">
              {stockEntries.slice(0, 3).map(entry => (
                <div key={entry.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn('rounded-full p-2.5', entry.type === 'out' ? 'bg-red-50' : 'bg-emerald-50')}>
                      {entry.type === 'out'
                        ? <ArrowUp className="h-5 w-5 text-red-500" />
                        : <ArrowDown className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {entry.notes === 'Stok awal' ? 'Stok Awal' : entry.type === 'in' ? 'Restok' : 'Keluar'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                  <p className={cn('font-black text-base', entry.type === 'out' ? 'text-red-500' : 'text-emerald-600')}>
                    {entry.type === 'out' ? '-' : '+'}{entry.quantity} botol
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
