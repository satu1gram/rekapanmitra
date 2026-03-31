import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, TrendingUp, Download, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TierType, MITRA_LEVELS } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const TROPHIES = ['🥇', '🥈', '🥉'];

interface StockPerformancePageProps {
  onBack: () => void;
  stockEntries: Tables<'stock_entries'>[];
  mitraInfo: {
    label: string;
    buyPricePerBottle: number;
  };
}

type MetricType = 'value' | 'qty';

export function StockPerformancePage({ onBack, stockEntries, mitraInfo }: StockPerformancePageProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [metric, setMetric] = useState<MetricType>('value');

  const inEntries = useMemo(() => stockEntries.filter(e => e.type === 'in'), [stockEntries]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((_, idx) => {
      const monthEntries = inEntries.filter(e => {
        const d = new Date(e.created_at);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const value = monthEntries.reduce((s, e) => s + ((e.buy_price_per_bottle || mitraInfo.buyPricePerBottle) * e.quantity), 0);
      const qty = monthEntries.reduce((s, e) => s + e.quantity, 0);
      return { value, qty };
    });
  }, [inEntries, selectedYear, mitraInfo]);

  const availableYears = useMemo(() => {
    const years = new Set(inEntries.map(e => new Date(e.created_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [inEntries]);

  const displayYears = useMemo(() => {
    const base = Array.from(new Set([...availableYears, now.getFullYear()])).sort((a, b) => a - b);
    return base;
  }, [availableYears]);

  const values = monthlyData.map(m => metric === 'value' ? m.value : m.qty);
  const maxVal = Math.max(...values, 1);
  const totalValue = values.reduce((s, v) => s + v, 0);

  const top3 = useMemo(() => {
    return [...monthlyData]
      .map((m, idx) => ({ idx, value: metric === 'value' ? m.value : m.qty }))
      .filter(m => m.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [monthlyData, metric]);

  const metricLabel = metric === 'value' ? 'Nilai Restok' : 'Jumlah Botol';
  const metricColor = metric === 'value' ? 'emerald' : 'blue';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      {/* Header - Aligned with PerformaPage (Riwayat) */}
      <header className="px-5 pt-8 pb-4 bg-white/95 backdrop-blur-md shadow-sm z-[40] sticky top-0 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Performa Restok {selectedYear}
          </h1>
        </div>

        {/* Year selector */}
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Pilih Tahun</p>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {displayYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "flex-1 py-2 px-1 rounded-lg font-black text-sm transition-all",
                  selectedYear === year
                    ? "bg-emerald-600 text-white shadow-md border border-emerald-900"
                    : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Metric tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setMetric('value')}
            className={cn(
              "flex-1 py-2 px-1 rounded-lg font-bold text-xs text-center transition-all leading-tight",
              metric === 'value' ? "bg-white shadow-sm text-emerald-700 font-black border border-slate-200" : "text-slate-500 hover:bg-slate-200/50"
            )}
          >
            Nilai Rupiah
          </button>
          <button
            onClick={() => setMetric('qty')}
            className={cn(
              "flex-1 py-2 px-1 rounded-lg font-bold text-xs text-center transition-all leading-tight",
              metric === 'qty' ? "bg-white shadow-sm text-blue-700 font-black border border-slate-200" : "text-slate-500 hover:bg-slate-200/50"
            )}
          >
            Jumlah Botol
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Summary Card */}
        <section className={cn(
          "bg-white p-5 rounded-2xl shadow-sm border-2 relative overflow-hidden",
          metricColor === 'emerald' ? 'border-emerald-100' : 'border-blue-100'
        )}>
          <div className={cn('absolute top-0 left-0 w-full h-1.5 rounded-t-2xl',
            metricColor === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-1">
            Total {metricLabel} {selectedYear}
          </p>
          <div className="flex items-end justify-between gap-2">
            <p className={cn(
              "text-3xl font-black tracking-tight leading-none",
              metricColor === 'emerald' ? 'text-emerald-600' : 'text-blue-700'
            )}>
              {metric === 'qty'
                ? `${totalValue.toLocaleString('id-ID')} btl`
                : formatCurrency(totalValue)
              }
            </p>
          </div>
          {totalValue === 0 && (
            <p className="text-slate-400 font-medium text-sm mt-2">Belum ada barang masuk di tahun ini</p>
          )}
        </section>

        {/* Bar Chart */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-bold text-slate-800">
              Grafik {metric === 'qty' ? 'Botol Masuk' : 'Restok Bulanan'}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-end justify-between h-44 w-full gap-0.5">
              {values.map((val, idx) => {
                const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const isTop = top3.some(t => t.idx === idx);
                const isHighest = top3[0]?.idx === idx;
                const colorClass = isHighest ? 'bg-emerald-700' : isTop ? 'bg-emerald-500' : heightPct > 60 ? 'bg-emerald-400' : 'bg-emerald-200';
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className={cn('w-full rounded-t-sm transition-all duration-500 min-h-[3px]', colorClass)}
                      style={{ height: `${Math.max(heightPct, val > 0 ? 3 : 0)}%` }}
                    />
                    <span className="text-[8px] font-bold mt-1 text-slate-400 uppercase">{MONTHS[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top 3 Bulan */}
        {top3.length > 0 && (
          <section className="pb-6">
            <h2 className="text-base font-bold text-slate-800 mb-3 px-1">
              {top3.length >= 3 ? '3' : top3.length} Bulan Terbaik Restok
            </h2>
            <div className="space-y-2">
              {top3.map((item, rank) => {
                const borderColors = ['border-yellow-400', 'border-slate-300', 'border-orange-300'];
                return (
                  <div key={item.idx} className={cn(
                    "bg-white px-4 py-3.5 rounded-2xl shadow-sm border-l-4 flex items-center gap-4",
                    borderColors[rank]
                  )}>
                    <span className="text-2xl">{TROPHIES[rank]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-base text-slate-900">{MONTHS_FULL[item.idx]}</h3>
                        {rank === 0 && (
                          <span className="text-[10px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md">TERTINGGI</span>
                        )}
                      </div>
                      <p className={cn(
                        "font-bold text-lg mt-0.5",
                        metric === 'value' ? 'text-emerald-600' : 'text-blue-700'
                      )}>
                        {metric === 'qty' ? `${item.value.toLocaleString('id-ID')} btl` : formatCurrency(item.value)}
                      </p>
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
