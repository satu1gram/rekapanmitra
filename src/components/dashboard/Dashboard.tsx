import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { useTargets } from '@/hooks/useTargets';
import { useCustomers } from '@/hooks/useCustomersDb';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import {
  Package, ShoppingCart, PackagePlus,
  AlertTriangle, ChevronRight, ChevronLeft, ChevronDown,
  Flag, ListFilter, Users, CheckCircle2, Hourglass, Medal
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { cn } from '@/lib/utils';
import { TargetForm } from './TargetForm';
import { TargetList } from './TargetList';
import { CustomerGrowthPage } from './CustomerGrowthPage';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface DashboardProps {
  onNavigate: (tab: 'orders' | 'stock', action?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { loading: ordersLoading, orders } = useOrders();
  const { stockEntries, loading: stockLoading } = useStock();
  const { loading: expensesLoading, getMonthExpenses, getTotalExpenses } = useGeneralExpenses();
  const { loading: incomeLoading, getMonthIncome, getTotalIncome } = useGeneralIncome();
  const { targets, getTarget, setTarget } = useTargets();
  const { customers, loading: customersLoading } = useCustomers();

  const loading = ordersLoading || stockLoading || expensesLoading || incomeLoading || customersLoading;

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
  const now = new Date();

  // UI State
  const [selectedYear, setSelectedYear] = useState(isDemo ? 2026 : now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(isDemo ? 3 : now.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(isDemo ? 2026 : now.getFullYear());

  const thisYear = selectedYear;
  const thisMonth = selectedMonth;

  const [view, setView] = useState<'dashboard' | 'form' | 'list' | 'customer-growth'>(
    isDemo && typeof window !== 'undefined' && window.location.search.includes('view=growth')
      ? 'customer-growth'
      : 'dashboard'
  );
  const [includeBiaya, setIncludeBiaya] = useState(false);
  const [formYear, setFormYear] = useState(thisYear);
  const [formMonth, setFormMonth] = useState(thisMonth);

  // Current month data
  const monthOrders = useMemo(() => orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  }), [orders, thisYear, thisMonth]);

  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const monthProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const monthExpensesTotal = getTotalExpenses(getMonthExpenses());
  const monthIncomeTotal = getTotalIncome(getMonthIncome());
  const monthNetProfit = monthProfit - monthExpensesTotal + monthIncomeTotal;
  const displayedProfit = includeBiaya ? monthNetProfit : monthProfit;
  const monthQty = monthOrders.reduce((sum, o) => sum + o.quantity, 0);

  const monthRestockQty = useMemo(() => stockEntries
    .filter(e => {
      if (e.type !== 'in') return false;
      const d = new Date((e as any).created_at || (e as any).createdAt);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    })
    .reduce((sum, e) => sum + e.quantity, 0),
  [stockEntries, thisYear, thisMonth]);

  const currentTarget = getTarget(thisYear, thisMonth);
  const prevTarget = getTarget(
    thisMonth === 0 ? thisYear - 1 : thisYear,
    thisMonth === 0 ? 11 : thisMonth - 1
  );

  const profitPct = currentTarget && currentTarget.targetProfit > 0
    ? Math.min(Math.round((displayedProfit / currentTarget.targetProfit) * 100), 100) : 0;
  const qtyPct = currentTarget && currentTarget.targetQty > 0
    ? Math.min(Math.round((monthQty / currentTarget.targetQty) * 100), 100) : 0;
  const stockPct = currentTarget && currentTarget.targetStock > 0
    ? Math.min(Math.round((monthRestockQty / currentTarget.targetStock) * 100), 100) : 0;
  const omsetPct = currentTarget && currentTarget.targetProfit > 0
    ? Math.min(Math.round((monthRevenue / (currentTarget.targetProfit * 1.5)) * 100), 100) : 0;

  const monthName = `${MONTH_NAMES[thisMonth]} ${thisYear}`;

  const achievements = useMemo(() => {
    const map: Record<string, { profit: number; qty: number }> = {};
    for (const o of orders) {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { profit: 0, qty: 0 };
      map[key].profit += Number(o.margin);
      map[key].qty += o.quantity;
    }
    return map;
  }, [orders]);

  const monthActiveCustomers = useMemo(() => {
    const activeCustomerIds = new Set(monthOrders.map(o => o.customer_id).filter(Boolean));
    return customers.filter(c => activeCustomerIds.has(c.id));
  }, [monthOrders, customers]);

  const activeTotal = monthActiveCustomers.length;
  const activeKonsumen = monthActiveCustomers.filter(c => c.tier === 'satuan').length;
  const activeMitra = activeTotal - activeKonsumen;

  const openForm = (year: number, month: number) => {
    setFormYear(year); setFormMonth(month); setView('form');
  };

  if (loading) return <LoadingScreen variant="dashboard" />;

  if (view === 'form') {
    return (
      <TargetForm
        year={formYear}
        month={formMonth}
        previousTarget={prevTarget}
        onBack={() => setView(formYear === thisYear && formMonth === thisMonth ? 'dashboard' : 'list')}
        onSave={data => {
          setTarget(formYear, formMonth, data);
          setView(formYear === thisYear && formMonth === thisMonth ? 'dashboard' : 'list');
        }}
      />
    );
  }

  if (view === 'list') {
    return (
      <TargetList
        year={thisYear}
        targets={targets}
        achievements={achievements}
        onBack={() => setView('dashboard')}
        onCreate={(y, m) => openForm(y, m)}
      />
    );
  }

  if (view === 'customer-growth') {
    return <CustomerGrowthPage onBack={() => setView('dashboard')} />;
  }

  // ── DASHBOARD MODE ──
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
              {getGreeting()}
            </span>
            <h1 className="text-sm font-black text-slate-900 leading-none">Beranda</h1>
          </div>
          <button
            onClick={() => { setPickerYear(selectedYear); setShowMonthPicker(p => !p); }}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <span className="text-xs font-bold tracking-tight capitalize">{monthName}</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", showMonthPicker && "rotate-180")} />
          </button>
        </div>

        {/* Month Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute right-4 top-[50px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 w-60 origin-top-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <button onClick={() => setPickerYear(y => y - 1)} className="p-1 rounded-xl hover:bg-slate-200">
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-xs font-black text-slate-900">{pickerYear}</span>
              <button onClick={() => setPickerYear(y => y + 1)} className="p-1 rounded-xl hover:bg-slate-200">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-2">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = selectedYear === pickerYear && selectedMonth === idx;
                const isCurrentMonth = now.getFullYear() === pickerYear && now.getMonth() === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedYear(pickerYear); setSelectedMonth(idx); setShowMonthPicker(false); }}
                    className={cn(
                      "py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      isSelected ? "bg-slate-900 text-white"
                        : isCurrentMonth ? "bg-emerald-50 text-emerald-700 border-emerald-100 border"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="px-3 py-3 space-y-2">
        {!currentTarget ? (
          /* ── No Target ── */
          <div className="bg-white rounded-[1.5rem] p-6 text-center border-2 border-amber-50 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Target Kosong</h2>
            <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">
              Atur target bulanan agar performa bisnis terpantau.
            </p>
            <button
              onClick={() => openForm(thisYear, thisMonth)}
              className="w-full bg-emerald-600 text-white text-sm font-black py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Flag className="h-5 w-5" />
              ATUR SEKARANG
            </button>
          </div>
        ) : (
          /* ── Active Dashboard ── */
          <div className="flex flex-col gap-2">
            {/* Keuntungan Card */}
            <section className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keuntungan</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setIncludeBiaya(false)} className={cn("text-[9px] font-black px-2 py-0.5 rounded-md transition-colors", !includeBiaya ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500")}>Bersih</button>
                    <button onClick={() => setIncludeBiaya(true)} className={cn("text-[9px] font-black px-2 py-0.5 rounded-md transition-colors", includeBiaya ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500")}>Kotor</button>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-emerald-400 text-lg font-black">Rp</span>
                  <span className={cn('text-3xl font-black tracking-tighter leading-none', displayedProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(displayedProfit).replace('Rp', '').trim()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${profitPct}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 shrink-0">{profitPct}%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button onClick={() => setView('list')} className="text-[10px] font-bold text-slate-400 flex items-center gap-1 active:text-slate-200">
                    <ListFilter className="w-3 h-3" /> Rekap Target
                  </button>
                  <button onClick={() => onNavigate('orders')} className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 active:text-emerald-300">
                    Riwayat <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </section>

            {/* Omset + Terjual — 2 column grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Omset</span>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatShortCurrency(monthRevenue)}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${omsetPct}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400">{omsetPct}%</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
                    <Package className="h-2.5 w-2.5 text-orange-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Terjual</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{monthQty}</span>
                  <span className="text-[10px] font-bold text-slate-400">pcs</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full transition-all duration-700" style={{ width: `${qtyPct}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400">{qtyPct}%</span>
                </div>
              </div>
            </div>

            {/* Restok + Aktif — single card, 2 rows */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => onNavigate('stock')}
                className="w-full flex items-center justify-between px-3 py-3 active:bg-slate-50 transition-colors border-b border-slate-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <PackagePlus className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Restok Bulan Ini</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{monthRestockQty}</span>
                      <span className="text-[10px] font-bold text-slate-400">btl</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black text-emerald-600">{stockPct}%</span>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${stockPct}%` }} />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
              </button>

              <button
                onClick={() => setView('customer-growth')}
                className="w-full flex items-center justify-between px-3 py-3 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Pelanggan Aktif</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{activeTotal}</span>
                      <span className="text-[10px] font-bold text-slate-400">org</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="text-emerald-600">{activeMitra} Mitra</span>
                    <span className="text-slate-400">{activeKonsumen} Kons</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
              </button>
            </div>

            {/* ── Top 5 Mitra ── */}
            {(() => {
              // Hitung total botol per pelanggan dari monthOrders
              const mitraMap = new Map<string, { name: string; qty: number; revenue: number }>();
              for (const o of monthOrders) {
                const key = o.customer_id || o.customer_name || 'unknown';
                const existing = mitraMap.get(key);
                if (existing) {
                  existing.qty += o.quantity;
                  existing.revenue += Number(o.total_price);
                } else {
                  mitraMap.set(key, {
                    name: o.customer_name || 'Tanpa Nama',
                    qty: o.quantity,
                    revenue: Number(o.total_price),
                  });
                }
              }
              const topMitra = Array.from(mitraMap.values())
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5);

              if (topMitra.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center flex flex-col items-center justify-center min-h-[160px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                      <Medal className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-black text-slate-800 mb-1">Belum Ada Transaksi</p>
                    <p className="text-[10px] font-medium text-slate-400 max-w-[200px]">Top 5 mitra dengan pemesanan terbanyak akan muncul di sini.</p>
                  </div>
                );
              }

              const medals = ['🥇', '🥈', '🥉', '4', '5'];
              const medalColors = [
                'text-amber-500 bg-amber-50',
                'text-slate-400 bg-slate-50',
                'text-orange-400 bg-orange-50',
                'text-slate-400 bg-slate-50',
                'text-slate-400 bg-slate-50',
              ];

              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Medal className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Mitra Bulan Ini</span>
                    </div>
                    <button onClick={() => onNavigate('orders')} className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                      Riwayat <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {topMitra.map((mitra, i) => {
                    const isLast = i === topMitra.length - 1;
                    const isTop3 = i < 3;
                    return (
                      <div
                        key={mitra.name + i}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2',
                          !isLast && 'border-b border-slate-50'
                        )}
                      >
                        {/* Rank badge */}
                        <span className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0',
                          medalColors[i]
                        )}>
                          {isTop3 ? medals[i] : medals[i]}
                        </span>
                        {/* Name + qty */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{mitra.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium leading-tight">{mitra.qty} botol</p>
                        </div>
                        {/* Revenue */}
                        <span className="text-xs font-black text-slate-700 shrink-0">
                          {formatShortCurrency(mitra.revenue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
