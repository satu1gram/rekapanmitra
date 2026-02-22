import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrdersDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeft, TrendingUp, Download, Loader2 } from 'lucide-react';
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

  // Build per-month data for selected year
  const monthlyData = useMemo(() => {
    return MONTHS.map((_, idx) => {
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const revenue = monthOrders.reduce((s, o) => s + Number(o.total_price), 0);
      const margin = monthOrders.reduce((s, o) => s + Number(o.margin), 0);

      // For current month only, account for general expenses/income
      const isCurrentMonth = idx === now.getMonth() && selectedYear === now.getFullYear();
      let netProfit = margin;
      if (isCurrentMonth) {
        const monthExpenses = expenses.filter(e => {
          const d = new Date(e.created_at);
          return d.getFullYear() === selectedYear && d.getMonth() === idx;
        });
        const monthIncome = income.filter(i => {
          const d = new Date(i.created_at);
          return d.getFullYear() === selectedYear && d.getMonth() === idx;
        });
        netProfit = margin - getTotalExpenses(monthExpenses) + getTotalIncome(monthIncome);
      }

      return { revenue, profit: netProfit, qty: monthOrders.reduce((s, o) => s + o.quantity, 0) };
    });
  }, [orders, expenses, income, selectedYear]);

  const values = monthlyData.map(m =>
    metric === 'profit' ? m.profit : metric === 'omset' ? m.revenue : m.qty
  );
  const maxVal = Math.max(...values, 1);
  const totalValue = values.reduce((s, v) => s + v, 0);

  // Top 3 months
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-white rounded-b-[2rem] shadow-sm z-10 sticky top-0">
        <div className="flex flex-col gap-4">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-7 w-7 text-slate-900" />
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Grafik Performa {selectedYear}
            </h1>
          </div>

          {/* Year Selector */}
          <div>
            <p className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Pilih Tahun</p>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "flex-1 py-3 px-1 rounded-xl font-black text-lg transition-all",
                    selectedYear === year
                      ? "bg-blue-700 text-white shadow-md scale-105 border border-blue-900"
                      : "text-slate-400 font-bold hover:bg-slate-200 hover:text-slate-600"
                  )}
                >
                  {year}
                </button>
              ))}
              {/* Always show next year as upcoming */}
              {!availableYears.includes(now.getFullYear() + 1) && (
                <button
                  onClick={() => setSelectedYear(now.getFullYear() + 1)}
                  className={cn(
                    "flex-1 py-3 px-1 rounded-xl font-bold text-lg transition-all",
                    selectedYear === now.getFullYear() + 1
                      ? "bg-blue-700 text-white shadow-md scale-105 border border-blue-900"
                      : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  )}
                >
                  {now.getFullYear() + 1}
                </button>
              )}
            </div>
          </div>

          {/* Metric Toggle */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex mt-1">
            <button
              onClick={() => setMetric('profit')}
              className={cn(
                "flex-1 py-3 px-2 rounded-xl font-bold text-base text-center transition-all",
                metric === 'profit'
                  ? "bg-white shadow-sm text-emerald-700 font-black border border-slate-200"
                  : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              Keuntungan
            </button>
            <button
              onClick={() => setMetric('omset')}
              className={cn(
                "flex-1 py-3 px-2 rounded-xl font-bold text-base text-center transition-all",
                metric === 'omset'
                  ? "bg-white shadow-sm text-blue-700 font-black border border-slate-200"
                  : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              Omset
            </button>
            <button
              onClick={() => setMetric('qty')}
              className={cn(
                "flex-1 py-3 px-2 rounded-xl font-bold text-base text-center leading-tight transition-all",
                metric === 'qty'
                  ? "bg-white shadow-sm text-indigo-700 font-black border border-slate-200"
                  : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              Terjual{"\n"}(Pcs)
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 space-y-8 pb-8">
        {/* Total Summary Card */}
        <section className="bg-white p-6 rounded-[2rem] shadow-md border-2 border-emerald-100 relative overflow-hidden text-center">
          <div className={cn('absolute top-0 left-0 w-full h-2',
            metric === 'profit' ? 'bg-emerald-500' : metric === 'omset' ? 'bg-blue-500' : 'bg-indigo-500')} />
          <h2 className="text-slate-500 font-bold text-base uppercase tracking-wider mb-2 mt-1">
            Total {metric === 'profit' ? 'Keuntungan' : metric === 'omset' ? 'Omset' : 'Produk Terjual'} {selectedYear}
          </h2>
          <p className={cn(
            "text-[2.5rem] leading-none font-black tracking-tight my-4",
            metric === 'profit' ? 'text-emerald-600' : metric === 'omset' ? 'text-blue-700' : 'text-indigo-700'
          )}>
            {metric === 'qty' ? `${totalValue.toLocaleString('id-ID')} Pcs` : formatCurrency(totalValue)}
          </p>
          {totalValue > 0 && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-800 font-bold text-sm">
                {metric === 'profit' ? 'Keuntungan bersih' : metric === 'omset' ? 'Total omset' : 'Unit terjual'} tahun ini
              </span>
            </div>
          )}
          {totalValue === 0 && (
            <p className="text-slate-400 font-medium text-sm">Belum ada data untuk tahun ini</p>
          )}
        </section>

        {/* Bar Chart */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-slate-800">Grafik Bulanan</h2>
            <button className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Download className="h-4 w-4" />
              Simpan
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            {/* Bar chart */}
            <div className="flex items-end justify-between h-52 w-full gap-1">
              {values.map((val, idx) => {
                const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const isTop = top3.some(t => t.idx === idx);
                const isHighest = top3[0]?.idx === idx;
                const colorClass =
                  metric === 'profit'
                    ? isHighest ? 'bg-emerald-700' : isTop ? 'bg-emerald-500' : heightPct > 60 ? 'bg-emerald-400' : 'bg-emerald-200'
                    : metric === 'omset'
                      ? isHighest ? 'bg-blue-700' : isTop ? 'bg-blue-500' : heightPct > 60 ? 'bg-blue-400' : 'bg-blue-200'
                      : isHighest ? 'bg-indigo-700' : isTop ? 'bg-indigo-500' : heightPct > 60 ? 'bg-indigo-400' : 'bg-indigo-200';
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className={cn('w-full rounded-t-md transition-all duration-500 min-h-[4px]', colorClass)}
                      style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                    />
                    <span className="text-[9px] font-bold mt-1.5 text-slate-500 uppercase">{MONTHS[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top 3 Months */}
        {top3.length > 0 && (
          <section className="pb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">
              {top3.length >= 3 ? '3' : top3.length} Bulan Terbaik
            </h2>
            <div className="space-y-4">
              {top3.map((item, rank) => {
                const borderColors = ['border-yellow-400', 'border-slate-300', 'border-orange-300'];
                const bgColors = ['bg-yellow-50 border-yellow-100', 'bg-slate-50 border-slate-200', 'bg-orange-50 border-orange-100'];
                return (
                  <div key={item.idx} className={cn("bg-white p-5 rounded-2xl shadow-sm border-l-8 flex items-center gap-4", borderColors[rank])}>
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2", bgColors[rank])}>
                      <span className="text-3xl">{TROPHIES[rank]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-xl text-slate-900">{MONTHS_FULL[item.idx]}</h3>
                        {rank === 0 && (
                          <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">TERTINGGI</span>
                        )}
                      </div>
                      <p className={cn("font-bold text-2xl mt-1",
                        metric === 'profit' ? 'text-emerald-600' : metric === 'omset' ? 'text-blue-700' : 'text-indigo-700')}>
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
