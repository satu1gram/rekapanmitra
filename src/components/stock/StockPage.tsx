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
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { useOrders } from '@/hooks/useOrdersDb';

type StockEntry = Tables<'stock_entries'>;

type View = 'main' | 'restok' | 'initial' | 'history';

export function StockPage() {
  const { currentStock, stockEntries, loading, addStock, updateStockEntry, deleteStockEntry, isLowStock } = useStock();
  const { uploadTransferProof } = useFileUpload();
  const { mitraLevel } = useProfile();
  const { orders } = useOrders();

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

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [historyStartDate, setHistoryStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [historyEndDate, setHistoryEndDate] = useState(lastDay.toISOString().split('T')[0]);

  useEffect(() => {
    setBuyPrice(mitraInfo.buyPricePerBottle);
  }, [mitraInfo]);

  const resetForm = () => {
    setQuantity(1);
    setBuyPrice(mitraInfo.buyPricePerBottle);
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
    setBuyPrice(entry.buy_price_per_bottle || mitraInfo.buyPricePerBottle);
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
    return <LoadingScreen variant="list" />;
  }

  /* ─── RESTOK FORM ─── */
  if (view === 'restok') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Stok</h1>
            <p className="text-sm text-gray-600 font-medium mt-0.5">Kelola persediaan produk</p>
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
              className="w-11 h-11 rounded-xl bg-red-50 text-primary border border-red-100 hover:bg-red-100 flex items-center justify-center font-bold transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Stock info bar */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok Saat Ini</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentStock}</span>
              <span className="text-sm font-semibold text-gray-600">botol</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRestok} className="flex-1 mx-4 mt-3 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="w-1.5 h-5 bg-success rounded-full mr-2.5" />
            {editingEntry ? 'Edit Restok' : 'Restok dari Distributor'}
          </h3>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Jumlah Botol</label>
            <div className="flex items-center gap-3">
              <button type="button"
                className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-500 active:bg-gray-50 transition-all shadow-sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                <Minus className="h-5 w-5" />
              </button>
              <div className="flex-1 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-inner">
                <input
                  type="number" inputMode="numeric" min={1} value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value.replace(/^0+/, '')) || 1)}
                  className="w-full h-full bg-transparent text-center text-xl font-bold text-gray-900 border-none focus:ring-0 p-0"
                />
              </div>
              <button type="button"
                className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 active:bg-emerald-100 transition-all shadow-sm"
                onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Buy price */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Harga Beli per Botol</label>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(buyPrice)}</p>
              <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mt-0.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Level: {mitraInfo.label}
              </p>
            </div>
          </div>

          {/* Total summary */}
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Pembelian</p>
              <p className="text-xs text-gray-500 font-medium">{quantity} botol × {formatCurrency(buyPrice)}</p>
            </div>
            <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(quantity * buyPrice)}</span>
          </div>

          {/* Date */}
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-800 mb-2">Tanggal Restok</label>
            <input
              type="date" value={stockDate}
              onChange={e => setStockDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {stockDate && (
              <p className="mt-1 text-xs text-gray-500 font-medium pl-1">
                {formattedDate(stockDate)}
              </p>
            )}
          </div>

          {/* Advanced options */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Settings2 className="h-5 w-5 text-gray-500" />
                Opsi Lainnya
              </div>
              <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform duration-300', showAdvanced && 'rotate-180')} />
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-4 px-1">
                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Catatan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Tulis catatan disini..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 p-3 placeholder-gray-400 shadow-sm resize-none"
                  />
                </div>

                {/* Upload proof */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Bukti Pembayaran</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  {transferProofPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      {uploading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </div>
                      )}
                      <img src={transferProofPreview} alt="Bukti" className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => { setTransferProofUrl(null); setTransferProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-12 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-[0.99]">
                      <Upload className="h-4 w-4" />
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
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {editingEntry ? 'Simpan Perubahan' : 'Tambah ke Stok'}
          </button>
        </form>
      </div>
    );
  }

  /* ─── INITIAL STOCK FORM ─── */
  if (view === 'initial') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Stok Awal</h1>
            <p className="text-sm text-gray-600 font-medium mt-0.5">Inisiasi stok tanpa harga</p>
          </div>
          <button onClick={() => setView('main')}
            className="w-9 h-9 rounded-lg bg-red-50 text-primary border border-red-100 hover:bg-red-100 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleInitialStock} className="flex-1 mx-4 mt-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="w-1.5 h-5 bg-success rounded-full mr-2.5" />
            Jumlah Botol Awal
          </h3>

          <div className="flex items-center gap-3">
            <button type="button"
              className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-500 transition-all shadow-sm"
              onClick={() => setInitialQty(Math.max(1, initialQty - 1))} disabled={initialQty <= 1}>
              <Minus className="h-5 w-5" />
            </button>
            <div className="flex-1 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-inner">
              <input type="number" inputMode="numeric" min={1} value={initialQty}
                onChange={e => setInitialQty(parseInt(e.target.value.replace(/^0+/, '')) || 1)}
                className="w-full h-full bg-transparent text-center text-xl font-bold text-gray-900 border-none focus:ring-0 p-0" />
            </div>
            <button type="button"
              className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all shadow-sm"
              onClick={() => setInitialQty(initialQty + 1)}>
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-5 w-5" />}
            Tambah Stok
          </button>
        </form>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center space-x-3 px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b border-border/50">
          <button
            onClick={() => setView('main')}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Riwayat Stok</h1>
            <p className="text-xs text-gray-500 font-medium">Transaksi stok barang</p>
          </div>
        </header>

        {/* Date Filter */}
        <div className="px-3 py-2 flex items-center gap-2 bg-white border-b border-gray-100 shadow-sm z-20 sticky top-[60px]">
          <input
            type="date"
            value={historyStartDate}
            onChange={e => setHistoryStartDate(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 text-[11px] font-semibold px-2 py-1.5"
          />
          <span className="text-gray-400 font-bold text-[10px]">s/d</span>
          <input
            type="date"
            value={historyEndDate}
            onChange={e => setHistoryEndDate(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 text-[11px] font-semibold px-2 py-1.5"
          />
        </div>

        <div className="px-3 py-2 space-y-1.5">
          {(() => {
            const filteredHistory = stockEntries.filter(entry => {
              const d = new Date(entry.created_at);
              d.setHours(0, 0, 0, 0);
              const start = new Date(historyStartDate); start.setHours(0, 0, 0, 0);
              const end = new Date(historyEndDate); end.setHours(23, 59, 59, 999);
              return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
            });

            if (filteredHistory.length === 0) {
              return (
                <div className="text-center py-10 text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-xs">Belum ada riwayat stok</p>
                </div>
              );
            }

            return filteredHistory.map(entry => {
              const isIn = entry.type === 'in';
              const orderRef = entry.order_id ? orders.find(o => o.id === entry.order_id) : null;
              let displayTitle = '';
              let badgeText = '';

              if (entry.notes === 'Stok awal') {
                displayTitle = 'Stok Awal';
                badgeText = 'AWAL';
              } else if (isIn) {
                displayTitle = 'Dari: Gudang Pusat';
                badgeText = 'RESTOK';
              } else if (!isIn && orderRef) {
                displayTitle = `Ke: ${orderRef.customer_name}`;
                badgeText = 'ORDER';
              } else {
                displayTitle = 'Barang Keluar';
                badgeText = 'KELUAR';
              }

              const totalValue = isIn
                ? (entry.buy_price_per_bottle || mitraInfo.buyPricePerBottle) * entry.quantity
                : (orderRef ? Number(orderRef.total_price) : 0);

              return (
                <div key={entry.id} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      isIn ? 'bg-blue-100' : 'bg-emerald-100'
                    )}>
                      {isIn
                        ? <ArrowDown className="h-4 w-4 text-blue-600" />
                        : <ArrowUp className="h-4 w-4 text-emerald-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 leading-none truncate">
                          {displayTitle}
                        </h3>
                        <span className={cn(
                          'text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider leading-none shrink-0',
                          isIn ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        )}>
                          {badgeText}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDateTime(orderRef ? orderRef.created_at : entry.created_at)}
                      </p>
                    </div>

                    {entry.type !== 'out' && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(entry)}
                          className="w-6 h-6 rounded-md bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                          <Edit className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleDelete(entry)}
                          className="w-6 h-6 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-1.5">
                    <div>
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Jumlah</p>
                      <p className={cn("text-sm font-black leading-none", isIn ? "text-blue-600" : "text-red-500")}>
                        {isIn ? '+' : '-'}{entry.quantity}{' '}
                        <span className="text-[9px] font-bold text-gray-500">btl</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                        {isIn ? 'Nilai Masuk' : 'Nilai Total'}
                      </p>
                      <p className="text-sm font-black text-emerald-600 leading-none">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  /* ─── MAIN VIEW ─── */
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Stok Produk</h1>
          <p className="text-sm text-gray-600 font-medium mt-0.5">Kelola stok produk</p>
        </div>
        <button onClick={() => setView('history')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 shadow-sm transition-colors text-sm">
          <History className="h-4 w-4" />
          <span>Riwayat</span>
        </button>
      </header>

      <main className="px-4 pt-3 pb-6 space-y-4">
        {/* Stock card */}
        <section className={cn('bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4',
          isLowStock ? 'border-red-200 bg-red-50' : 'border-gray-100')}>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            isLowStock ? 'bg-red-100' : 'bg-emerald-50 border border-emerald-100')}>
            {isLowStock
              ? <AlertTriangle className="h-6 w-6 text-red-500" />
              : <Package className="h-6 w-6 text-emerald-600" />}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok Saat Ini</h2>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentStock}</span>
              <span className="text-sm font-semibold text-gray-600">botol</span>
            </div>
            {isLowStock && <p className="text-xs font-bold text-red-500 mt-0.5">⚠ Stok Rendah!</p>}
          </div>
        </section>

        {/* Action buttons */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { resetForm(); setView('restok'); }}
            className="bg-primary text-primary-foreground rounded-2xl p-4 flex flex-col items-start gap-2.5 shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Restok Barang</p>
            </div>
          </button>
          <button
            onClick={() => setView('initial')}
            className="bg-card border border-border text-foreground rounded-2xl p-4 flex flex-col items-start gap-2.5 shadow-sm hover:bg-accent active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Stok Awal</p>
            </div>
          </button>
        </section>

        {/* Recent entries */}
        {stockEntries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-800 uppercase tracking-wide">Riwayat Terbaru</h3>
              <button onClick={() => setView('history')} className="text-emerald-600 font-black text-xs uppercase tracking-wide hover:text-emerald-700">
                Lihat semua →
              </button>
            </div>
            <div className="space-y-1.5">
              {stockEntries.slice(0, 3).map(entry => {
                const isIn = entry.type === 'in';
                const orderRef = entry.order_id ? orders.find(o => o.id === entry.order_id) : null;
                let displayTitle = '';
                let badgeText = '';

                if (entry.notes === 'Stok awal') {
                  displayTitle = 'Stok Awal';
                  badgeText = 'AWAL';
                } else if (isIn) {
                  displayTitle = 'Dari: Gudang Pusat';
                  badgeText = 'RESTOK';
                } else if (!isIn && orderRef) {
                  displayTitle = `Ke: ${orderRef.customer_name}`;
                  badgeText = 'ORDER';
                } else {
                  displayTitle = 'Barang Keluar';
                  badgeText = 'KELUAR';
                }

                const totalValue = isIn
                  ? (entry.buy_price_per_bottle || mitraInfo.buyPricePerBottle) * entry.quantity
                  : (orderRef ? Number(orderRef.total_price) : 0);

                return (
                  <div key={entry.id} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isIn ? 'bg-blue-100' : 'bg-emerald-100'
                      )}>
                        {isIn
                          ? <ArrowDown className="h-4 w-4 text-blue-600" />
                          : <ArrowUp className="h-4 w-4 text-emerald-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 leading-none truncate">
                            {displayTitle}
                          </h3>
                          <span className={cn(
                            'text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider leading-none shrink-0',
                            isIn ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(orderRef ? orderRef.created_at : entry.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-50 pt-1.5">
                      <div>
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Jumlah</p>
                        <p className={cn("text-sm font-black leading-none", isIn ? "text-blue-600" : "text-red-500")}>
                          {isIn ? '+' : '-'}{entry.quantity}{' '}
                          <span className="text-[9px] font-bold text-gray-500">btl</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                          {isIn ? 'Nilai Masuk' : 'Nilai Total'}
                        </p>
                        <p className="text-sm font-black text-emerald-600 leading-none">
                          {formatCurrency(totalValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
