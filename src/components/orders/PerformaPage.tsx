import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrdersDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, TrendingUp, Download, Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const TROPHIES = ['🥇', '🥈', '🥉'];

interface PerformaPageProps {
  onBack: () => void;
}

type MetricType = 'profit' | 'omset' | 'qty';

export function PerformaPage({ onBack }: PerformaPageProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [metric, setMetric] = useState<MetricType>('profit');

  const { orders, loading: ordersLoading } = useOrders();
  const { expenses, loading: expensesLoading, getTotalExpenses } = useGeneralExpenses();
  const { income, loading: incomeLoading, getTotalIncome } = useGeneralIncome();

  const loading = ordersLoading || expensesLoading || incomeLoading;

  const monthlyData = useMemo(() => {
    return MONTHS.map((_, idx) => {
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const revenue = monthOrders.reduce((s, o) => s + Number(o.total_price), 0);
      const margin = monthOrders.reduce((s, o) => s + Number(o.margin), 0);

      const isCurrentMonth = idx === now.getMonth() && selectedYear === now.getFullYear();
      let netProfit = margin;
      if (isCurrentMonth) {
        const monthExpenses = expenses.filter(e => {
          const d = new Date(e.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === idx;
        });
        const monthIncome = income.filter(i => {
          const d = new Date(i.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === idx;
        });
        netProfit = margin - getTotalExpenses(monthExpenses) + getTotalIncome(monthIncome);
      }

      return { revenue, profit: netProfit, qty: monthOrders.reduce((s, o) => s + o.quantity, 0) };
    });
  }, [orders, expenses, income, selectedYear]);

  // Previous year data for comparison
  const prevYearTotal = useMemo(() => {
    const prevOrders = orders.filter(o => new Date(o.created_at).getFullYear() === selectedYear - 1);
    const revenue = prevOrders.reduce((s, o) => s + Number(o.total_price), 0);
    const margin = prevOrders.reduce((s, o) => s + Number(o.margin), 0);
    const qty = prevOrders.reduce((s, o) => s + o.quantity, 0);
    return { revenue, profit: margin, qty };
  }, [orders, selectedYear]);

  const values = monthlyData.map(m =>
    metric === 'profit' ? m.profit : metric === 'omset' ? m.revenue : m.qty
  );
  const maxVal = Math.max(...values, 1);
  const totalValue = values.reduce((s, v) => s + v, 0);

  const prevTotal = metric === 'profit' ? prevYearTotal.profit
    : metric === 'omset' ? prevYearTotal.revenue
      : prevYearTotal.qty;
  const growthPct = prevTotal > 0 ? Math.round(((totalValue - prevTotal) / prevTotal) * 100) : null;

  const top3 = useMemo(() => {
    return [...monthlyData]
      .map((m, idx) => ({ idx, value: metric === 'profit' ? m.profit : metric === 'omset' ? m.revenue : m.qty }))
      .filter(m => m.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [monthlyData, metric]);

  const availableYears = useMemo(() => {
    const years = new Set(orders.map(o => new Date(o.created_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [orders]);

  // Make sure at least 3 years shown
  const displayYears = useMemo(() => {
    const base = Array.from(new Set([...availableYears, now.getFullYear(), now.getFullYear() + 1])).sort((a, b) => a - b);
    return base.slice(0, Math.max(3, base.length));
  }, [availableYears]);

  const metricLabel = metric === 'profit' ? 'Keuntungan' : metric === 'omset' ? 'Omset' : 'Produk Terjual';
  const metricColor = metric === 'profit' ? 'emerald' : metric === 'omset' ? 'blue' : 'indigo';

  const barColorClass = (val: number, idx: number) => {
    const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    const isTop = top3.some(t => t.idx === idx);
    const isHighest = top3[0]?.idx === idx;
    if (metric === 'profit') {
      return isHighest ? 'bg-emerald-700' : isTop ? 'bg-emerald-500' : heightPct > 60 ? 'bg-emerald-400' : 'bg-emerald-200';
    }
    if (metric === 'omset') {
      return isHighest ? 'bg-blue-700' : isTop ? 'bg-blue-500' : heightPct > 60 ? 'bg-blue-400' : 'bg-blue-200';
    }
    return isHighest ? 'bg-indigo-700' : isTop ? 'bg-indigo-500' : heightPct > 60 ? 'bg-indigo-400' : 'bg-indigo-200';
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 bg-card shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Grafik Performa {selectedYear}
          </h1>
        </div>

        {/* Year selector */}
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Tahun</p>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {displayYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "flex-1 py-2 px-1 rounded-lg font-black text-sm transition-all",
                  selectedYear === year
                    ? "bg-blue-700 text-white shadow-md border border-blue-900"
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
          {(['profit', 'omset', 'qty'] as MetricType[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "flex-1 py-2 px-1 rounded-lg font-bold text-xs text-center transition-all leading-tight",
                metric === m
                  ? m === 'profit'
                    ? "bg-white shadow-sm text-emerald-700 font-black border border-slate-200"
                    : m === 'omset'
                      ? "bg-white shadow-sm text-blue-700 font-black border border-slate-200"
                      : "bg-white shadow-sm text-indigo-700 font-black border border-slate-200"
                  : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              {m === 'profit' ? 'Keuntungan' : m === 'omset' ? 'Omset' : 'Terjual (Pcs)'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">

        {/* Summary Card */}
        <section className={cn(
          "bg-white p-5 rounded-2xl shadow-sm border-2 relative overflow-hidden",
          metricColor === 'emerald' ? 'border-emerald-100' : metricColor === 'blue' ? 'border-blue-100' : 'border-indigo-100'
        )}>
          <div className={cn('absolute top-0 left-0 w-full h-1.5 rounded-t-2xl',
            metricColor === 'emerald' ? 'bg-emerald-500' : metricColor === 'blue' ? 'bg-blue-500' : 'bg-indigo-500')} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 mb-1">
            Total {metricLabel} {selectedYear}
          </p>
          <div className="flex items-end justify-between gap-2">
            <p className={cn(
              "text-3xl font-black tracking-tight leading-none",
              metricColor === 'emerald' ? 'text-emerald-600' : metricColor === 'blue' ? 'text-blue-700' : 'text-indigo-700'
            )}>
              {metric === 'qty'
                ? `${totalValue.toLocaleString('id-ID')} Pcs`
                : metric === 'profit' && totalValue > 1_000_000
                  ? `Rp ${(totalValue / 1_000_000).toFixed(1)}jt`
                  : formatCurrency(totalValue)
              }
            </p>
            {growthPct !== null && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black border",
                growthPct >= 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-600 border-red-100"
              )}>
                <TrendingUp className="h-3 w-3" />
                <span>{growthPct >= 0 ? '+' : ''}{growthPct}% vs Tahun {selectedYear - 1}</span>
              </div>
            )}
          </div>
          {totalValue === 0 && (
            <p className="text-slate-400 font-medium text-sm mt-2">Belum ada data untuk tahun ini</p>
          )}
        </section>

        {/* Bar Chart */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-bold text-slate-800">
              Grafik {metric === 'qty' ? 'Unit Terjual' : 'Bulanan'}
            </h2>
            <button className={cn(
              "font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1",
              metricColor === 'emerald' ? "text-emerald-600 bg-emerald-50"
                : metricColor === 'blue' ? "text-blue-600 bg-blue-50"
                  : "text-indigo-600 bg-indigo-50"
            )}>
              <Download className="h-3 w-3" />
              Simpan
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-end justify-between h-44 w-full gap-0.5">
              {values.map((val, idx) => {
                const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className={cn('w-full rounded-t-sm transition-all duration-500 min-h-[3px]', barColorClass(val, idx))}
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
              {top3.length >= 3 ? '3' : top3.length} Bulan Terbaik{metric === 'qty' ? ' (Pcs)' : ''}
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
                        metricColor === 'emerald' ? 'text-emerald-600'
                          : metricColor === 'blue' ? 'text-blue-700'
                            : 'text-indigo-700'
                      )}>
                        {metric === 'qty' ? `${item.value.toLocaleString('id-ID')} Pcs` : formatCurrency(item.value)}
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
