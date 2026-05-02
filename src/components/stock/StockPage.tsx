import { useState, useRef, useEffect, useMemo } from 'react';
import { useStock } from '@/hooks/useStockDb';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { TierType, MITRA_LEVELS } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import {
  Minus, Plus, Package, AlertTriangle, Upload, X, Loader2, History,
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Check, Edit, Trash2, ArrowDown, ArrowUp, Settings2, BarChart3,
  TrendingUp, ShoppingCart, ArrowLeft
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { useOrders } from '@/hooks/useOrdersDb';
import { StockPerformancePage } from './StockPerformancePage';

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface DailyStockSummary {
  date: Date;
  dayName: string;
  dayNum: number;
  totalQtyIn: number;
  totalValueIn: number;
  totalQtyOut: number;
  totalValueOut: number;
  entries: StockEntry[];
}

type StockEntry = Tables<'stock_entries'>;

type View = 'main' | 'restok' | 'initial' | 'history';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const TROPHIES = ['🥇', '🥈', '🥉'];

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
  const getLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const now = new Date();
  const [stockDate, setStockDate] = useState(getLocalYYYYMMDD(now));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialQty, setInitialQty] = useState(1);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const [historyStartDate, setHistoryStartDate] = useState(getLocalYYYYMMDD(firstDay));
  const [historyEndDate, setHistoryEndDate] = useState(getLocalYYYYMMDD(now));
  const [historyType, setHistoryType] = useState<'all' | 'in' | 'out'>('all');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const [showPerformance, setShowPerformance] = useState(false);
  
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAllDays, setShowAllDays] = useState(false);

  const filteredHistory = useMemo(() => {
    return stockEntries.filter(entry => {
      const d = new Date(entry.created_at);
      d.setHours(0, 0, 0, 0);
      const start = new Date(historyStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(historyEndDate); end.setHours(23, 59, 59, 999);
      const inDate = d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
      const inType = historyType === 'all' ? true : entry.type === historyType;
      return inDate && inType;
    });
  }, [stockEntries, historyStartDate, historyEndDate, historyType]);

  const dailySummaries = useMemo((): DailyStockSummary[] => {
    const map = new Map<string, DailyStockSummary>();
    for (const e of filteredHistory) {
      const d = new Date(e.created_at);
      const key = d.toDateString();
      if (!map.has(key)) {
        map.set(key, {
          date: d,
          dayName: DAY_NAMES_ID[d.getDay()],
          dayNum: d.getDate(),
          totalQtyIn: 0,
          totalValueIn: 0,
          totalQtyOut: 0,
          totalValueOut: 0,
          entries: [],
        });
      }
      const day = map.get(key)!;
      if (e.type === 'in') {
        day.totalQtyIn += e.quantity;
        day.totalValueIn += ((e.buy_price_per_bottle || mitraInfo.buyPricePerBottle) * e.quantity);
      } else {
        const orderRef = e.order_id ? orders.find(o => o.id === e.order_id) : null;
        day.totalQtyOut += e.quantity;
        day.totalValueOut += (orderRef ? Number(orderRef.total_price) : 0);
      }
      day.entries.push(e);
    }
    return Array.from(map.values())
      .filter(d => d.totalQtyIn > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredHistory, mitraInfo, orders]);

  const visibleDays = showAllDays ? dailySummaries : dailySummaries.slice(0, 5);


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

        {/* Form */}
        <form onSubmit={handleRestok} className="flex-1 mx-4 mt-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-5">
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

  if (showPerformance) {
    return (
      <StockPerformancePage
        onBack={() => setShowPerformance(false)}
        stockEntries={stockEntries}
        mitraInfo={mitraInfo}
      />
    );
  }

  /* ─── MAIN VIEW ─── */
  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-900">
      {/* Header - Compact & Integrated */}
      <header className="px-5 pt-4 pb-3 bg-white/95 backdrop-blur-md shadow-sm z-[40] sticky top-0 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-xl font-black tracking-tight text-slate-900">Stok</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPerformance(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm active:scale-95 transition-all"
              title="Lihat Grafik Performa"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('initial')}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              title="Update Stok Awal"
            >
              <Package className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Compact Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex bg-slate-100/50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 transition-all divide-x divide-slate-200 shadow-sm">
            <button
              onClick={() => setShowMonthPicker(p => !p)}
              className="flex items-center justify-center px-2.5 bg-white hover:bg-slate-50 transition-colors shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            </button>

            <div className="flex-1 flex items-center divide-x divide-slate-100">
              <div className="flex-1 flex items-center px-2.5 py-1.5 min-w-0">
                <span className="text-[8px] font-black text-slate-400 mr-1.5 shrink-0 uppercase tracking-tighter">Dari</span>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={e => setHistoryStartDate(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-slate-900 outline-none min-w-0"
                />
              </div>
              <div className="flex-1 flex items-center px-2.5 py-1.5 min-w-0">
                <span className="text-[8px] font-black text-slate-400 mr-1.5 shrink-0 uppercase tracking-tighter">Sampai</span>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={e => setHistoryEndDate(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-slate-900 outline-none min-w-0"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-3 pb-6 space-y-4">
        {/* Main Action (Ultra Compact) */}
        <button
          onClick={() => { resetForm(); setView('restok'); }}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-black text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Restok Barang</span>
        </button>


          {/* Month Picker dropdown */}
          {showMonthPicker && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg mt-1 mb-2">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                <button onClick={() => setPickerYear(y => y - 1)} className="p-1.5 rounded-xl hover:bg-slate-100">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-sm font-black text-slate-900">{pickerYear}</span>
                <button onClick={() => setPickerYear(y => y + 1)} className="p-1.5 rounded-xl hover:bg-slate-100">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-2.5">
                {MONTHS_FULL.map((name, idx) => {
                  const start = new Date(pickerYear, idx, 1);
                  const end = new Date(pickerYear, idx + 1, 0);
                  const startStr = getLocalYYYYMMDD(start);
                  const endStr = getLocalYYYYMMDD(end);
                  const isSelected = historyStartDate === startStr && historyEndDate === endStr;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setHistoryStartDate(startStr);
                        setHistoryEndDate(endStr);
                        setShowMonthPicker(false);
                      }}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-colors",
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Ringkasan Section */}
        <div className="space-y-2">
          <h2 className="text-sm font-black text-slate-800 px-1 uppercase tracking-wider">Ringkasan</h2>
          <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Barang Masuk (Restok)</span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {dailySummaries.reduce((a, b) => a + b.totalQtyIn, 0)} <span className="text-[10px] font-bold text-slate-400">btl</span>
              </p>
              <p className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {formatCurrency(dailySummaries.reduce((a, b) => a + b.totalValueIn, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Grouping List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-bold text-slate-800">Rincian Harian</h2>
            <div className="flex gap-1.5">
              {dailySummaries.length > 0 && (
                <button
                  onClick={() => {
                    if (expandedDays.size === dailySummaries.length) {
                      setExpandedDays(new Set());
                    } else {
                      setExpandedDays(new Set(dailySummaries.map(d => d.date.toDateString())));
                    }
                  }}
                  className="text-slate-600 font-bold text-[10px] bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {expandedDays.size === dailySummaries.length ? 'Tutup' : 'Buka Semua'}
                </button>
              )}
              {dailySummaries.length > 5 && (
                <button
                  onClick={() => setShowAllDays(v => !v)}
                  className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded-lg"
                >
                  {showAllDays ? 'Lebih Sedikit' : 'Lihat Semua'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {visibleDays.map(day => {
              const dayKey = day.date.toDateString();
              const isExpanded = expandedDays.has(dayKey);
              return (
                <div key={dayKey} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <button
                    className="w-full bg-white px-4 py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors"
                    onClick={() => setExpandedDays(prev => {
                      const next = new Set(prev);
                      if (next.has(dayKey)) next.delete(dayKey); else next.add(dayKey);
                      return next;
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0",
                        day.date.getDay() === 0 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-100 text-slate-700"
                      )}>
                        <span className="text-[9px] uppercase font-bold leading-none">{day.dayName}</span>
                        <span className="text-base font-black leading-tight">{day.dayNum}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">Masuk: {day.totalQtyIn} btl</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Nilai: {formatCurrency(day.totalValueIn)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className={cn("h-5 w-5 text-slate-300 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-slate-50/30 p-2.5 space-y-2">
                      {day.entries.filter(e => e.type === 'in').length === 0 ? (
                        <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase">Tidak ada penambahan stok</p>
                      ) : day.entries.filter(e => e.type === 'in').map(entry => {
                        const isIn = entry.type === 'in';

                        const orderRef = entry.order_id ? orders.find(o => o.id === entry.order_id) : null;
                        
                        let displayTitle = '';
                        let badgeText = '';
                        if (entry.notes === 'Stok awal') { displayTitle = 'Stok Awal'; badgeText = 'AWAL'; }
                        else if (isIn) { displayTitle = 'Restok Barang'; badgeText = 'RESTOK'; }
                        else if (!isIn && orderRef) { displayTitle = `Ke: ${orderRef.customer_name}`; badgeText = 'ORDER'; }
                        else { displayTitle = 'Barang Keluar'; badgeText = 'KELUAR'; }

                        const totalValue = isIn 
                          ? (entry.buy_price_per_bottle || mitraInfo.buyPricePerBottle) * entry.quantity
                          : (orderRef ? Number(orderRef.total_price) : 0);

                        return (
                          <div key={entry.id} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 flex flex-col gap-1.5">
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                isIn ? 'bg-blue-100' : 'bg-emerald-100'
                              )}>
                                {isIn ? <ArrowDown className="h-4 w-4 text-blue-600" /> : <ArrowUp className="h-4 w-4 text-emerald-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="text-sm font-bold text-gray-900 leading-none truncate">{displayTitle}</h3>
                                  <span className={cn(
                                    'text-[8px] font-bold px-1 py-0.5 rounded tracking-wider leading-none',
                                    isIn ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  )}>
                                    {badgeText}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                                  {new Date(entry.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </p>
                              </div>
                              {entry.type !== 'out' && (
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => openEdit(entry)} className="w-7 h-7 rounded-lg bg-gray-50 text-slate-400 flex items-center justify-center hover:bg-slate-100">
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(entry)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-end border-t border-gray-50 pt-1.5">
                              <div>
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Jumlah</p>
                                <p className={cn("text-sm font-black leading-none", isIn ? "text-blue-600" : "text-red-500")}>
                                  {isIn ? '+' : '-'}{entry.quantity} <span className="text-[9px] font-bold text-gray-500">btl</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{isIn ? 'Nilai Restok' : 'Nilai Transaksi'}</p>
                                <p className="text-sm font-black text-emerald-600 leading-none">{formatCurrency(totalValue)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
