import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Bot, ClipboardCopy, Package, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { OverviewData } from '@/lib/businessOverview';
import { createAssistantDemo } from '@/data/assistantDemo';
import { estimateRestock, summarizeBusiness } from '@/lib/businessOverview';
import { formatCurrency } from '@/lib/formatters';

interface AssistantExperienceProps {
  demo?: boolean;
  previewOnly?: boolean;
  query: {
    data?: OverviewData;
    isFetching: boolean;
    isPending: boolean;
    isError: boolean;
    refetch: () => unknown;
  };
}

export default function AssistantExperience({ demo = false, previewOnly = false, query }: AssistantExperienceProps) {
  const navigate = useNavigate();
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const [leadDays, setLeadDays] = useState(3);
  const [safetyDays, setSafetyDays] = useState(2);
  const [demoData] = useState(createAssistantDemo);
  const data = demo ? demoData : query.data;
  const summary = data ? summarizeBusiness(data, days) : null;
  const restock = data ? estimateRestock(data, leadDays, safetyDays) : null;
  const recap = summary ? [
    demo ? 'CONTOH — bukan transaksi asli' : 'Rekap Rekapan Mitra',
    `${summary.start} s.d. ${summary.end} (WIB)`,
    `${summary.orderCount} pesanan tercatat • ${summary.quantity} botol`,
    `Omzet tercatat: ${formatCurrency(summary.revenue)}`,
    `Estimasi laba bersih: ${formatCurrency(summary.estimatedNetProfit)}`,
    `Biaya umum: ${formatCurrency(summary.expenses)} • Pendapatan lain: ${formatCurrency(summary.income)}`,
    `Menunggu konfirmasi: ${summary.pendingCount} pesanan`,
    `Saldo stok sistem: ${summary.currentStock === null ? 'belum tersedia' : `${summary.currentStock} botol`}`,
    'Omzet mencakup seluruh status pesanan; bukan bukti kas diterima. Cocokkan stok dengan barang fisik.',
  ].join('\n') : '';

  async function copyRecap() {
    try { await navigator.clipboard.writeText(recap); toast.success('Rekap disalin, siap dibagikan.'); }
    catch { toast.error('Belum bisa menyalin. Silakan pilih teks rekap di bawah.'); }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <button type="button" aria-label="Kembali" onClick={() => navigate(previewOnly ? '/' : demo ? '/login' : '/dashboard')} className="rounded-xl border p-3"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1"><p className="text-xs font-bold text-emerald-700">REKAPAN MITRA BP</p><h1 className="text-2xl font-extrabold text-slate-900">Asisten Mitra</h1></div>
        {!demo && <button type="button" aria-label="Muat ulang ringkasan" disabled={query.isFetching} onClick={() => void query.refetch()} className="rounded-xl border p-3"><RefreshCw className={`h-5 w-5 ${query.isFetching ? 'animate-spin' : ''}`} /></button>}
      </header>

      {demo && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Mode contoh • Data simulasi. Tidak ada transaksi yang dikirim atau disimpan.</p>}

      <section className="rounded-3xl bg-emerald-950 p-5 text-white">
        <Sparkles className="mb-3 h-7 w-7 text-emerald-300" />
        <h2 className="text-xl font-bold">Rekap lebih ringan.<br />Stok lebih terencana.</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-100">Tempel chat pesanan untuk dibaca AI, periksa hasilnya, lalu konfirmasi. Harga mengikuti katalog dan level mitra Anda.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" disabled={demo} onClick={() => navigate('/riwayat', { state: { openAssistant: true } })} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-bold text-emerald-950 disabled:opacity-50"><Bot className="h-4 w-4" />Catat penjualan</button>
          <button type="button" disabled={demo} onClick={() => navigate('/produk', { state: { openAssistant: true } })} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-700 px-3 py-3 text-sm font-bold disabled:opacity-50"><Package className="h-4 w-4" />Catat restok</button>
        </div>
        <p className="mt-3 text-xs text-emerald-200">AI membaca teks; kalkulasi memakai aturan aplikasi. Pencatatan memerlukan koneksi internet.</p>
      </section>

      {!demo && query.isPending && <p role="status" className="py-8 text-center text-sm">Mengambil penjualan, biaya, dan saldo stok…</p>}
      {!demo && query.isError && <div role="alert" className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>Ringkasan belum tersedia. Data gagal dimuat; angka tidak ditampilkan agar tidak menyesatkan.</p><p>Periksa koneksi dan akses akun Anda, lalu muat ulang.</p><button type="button" className="min-h-11 font-bold underline" onClick={() => void query.refetch()}>Coba lagi</button></div>}

      {summary && restock && (!query.isError || demo) && <>
        <section className="space-y-3" aria-labelledby="recap-title">
          <div className="flex items-center justify-between"><h2 id="recap-title" className="text-lg font-bold">Ringkasan usaha</h2><span className="text-xs text-slate-500">WIB</span></div>
          <div role="group" aria-label="Periode rekap" className="flex gap-2">{([1, 7, 30] as const).map(value => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)} className={`min-h-11 flex-1 rounded-xl border px-3 text-sm font-semibold ${days === value ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'bg-white text-slate-600'}`}>{value === 1 ? 'Hari ini' : `${value} hari`}</button>)}</div>
          <p className="text-xs text-slate-500">{summary.start} — {summary.end} · Semua status pesanan</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Omzet tercatat', formatCurrency(summary.revenue)],
              ['Estimasi laba bersih', formatCurrency(summary.estimatedNetProfit)],
              ['Pesanan / botol', `${summary.orderCount} / ${summary.quantity}`],
              ['Saldo stok sistem', summary.currentStock === null ? 'Belum tersedia' : `${summary.currentStock} botol`],
            ].map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 break-words text-lg font-extrabold text-slate-900">{value}</p></div>)}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">Laba = margin pesanan − biaya umum + pendapatan lain. Biaya per order sudah termasuk dalam margin. Omzet tercatat bukan bukti uang diterima. Ada {summary.pendingCount} pesanan menunggu konfirmasi.</p>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="restock-title">
          <h2 id="restock-title" className="flex items-center gap-2 text-lg font-bold"><Package className="h-5 w-5 text-emerald-600" />Rencana restok</h2>
          <p className="text-sm text-slate-600">Rata-rata {restock.dailyDemand.toLocaleString('id-ID', { maximumFractionDigits: 1 })} botol/hari dari pesanan selesai pada 30 hari penuh sebelumnya.</p>
          <div className="grid grid-cols-2 gap-3">{([
            ['Lama kirim (hari)', leadDays, setLeadDays],
            ['Cadangan (hari)', safetyDays, setSafetyDays],
          ] as const).map(([label, value, setter]) => <label key={label} className="space-y-1 text-xs font-semibold text-slate-600"><span>{label}</span><input type="number" min="0" max="90" step="1" value={value} onChange={event => setter(Math.max(0, Math.min(90, Math.floor(Number(event.target.value) || 0))))} className="min-h-11 w-full rounded-xl border px-3 text-base text-slate-900" /></label>)}</div>
          <div className={`rounded-xl p-3 ${restock.lowStock ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
            <p className="font-bold">{restock.suggestedQuantity === null ? 'Belum cukup data untuk menyarankan jumlah restok.' : restock.suggestedQuantity > 0 ? `Pertimbangkan restok ${restock.suggestedQuantity} botol` : 'Saldo stok mencukupi target cadangan saat ini.'}</p>
            <p className="mt-1 text-xs">{restock.coverageDays !== null ? `Perkiraan cakupan stok ${restock.coverageDays.toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari. ` : ''}Target saldo {restock.targetStock} botol; batas stok rendah mengikuti aplikasi (3 botol).</p>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">Estimasi total seluruh produk, belum per SKU. Target = rata-rata penjualan × (lama kirim + cadangan), minimal 3 botol. Cocokkan saldo dengan stok fisik sebelum membeli. Saran ini tidak membuat pembelian otomatis.</p>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="font-bold">Rekap siap dibagikan</h2><button type="button" onClick={() => void copyRecap()} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold"><ClipboardCopy className="h-4 w-4" />Salin</button></div>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-600">{recap}</pre>
        </section>
      </>}
      {demo && !previewOnly && <button type="button" onClick={() => navigate('/login')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white">Masuk ke akun mitra<ArrowUpRight className="h-4 w-4" /></button>}
    </div>
  );
}
