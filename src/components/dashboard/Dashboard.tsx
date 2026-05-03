import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { useTargets } from '@/hooks/useTargets';
import { useCustomers } from '@/hooks/useCustomersDb';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import {
  TrendingUp, Package, ShoppingCart, Plus, PackagePlus,
  Loader2, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown,
  Flag, Lock, ListFilter, Users
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LOW_STOCK_THRESHOLD } from '@/types';
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

  const now = new Date();
  
  // UI State
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  const thisYear = selectedYear;
  const thisMonth = selectedMonth;

  const [view, setView] = useState<'dashboard' | 'form' | 'list' | 'customer-growth'>('dashboard');
  const [includeBiaya, setIncludeBiaya] = useState(false);
  const [formYear, setFormYear] = useState(thisYear);
  const [formMonth, setFormMonth] = useState(thisMonth);

  // Current month data — filter by calendar month
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

  // Restok bulan ini (stock_entries type='in' di bulan berjalan)
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

  // Progress calculations
  const profitPct = currentTarget && currentTarget.targetProfit > 0
    ? Math.min(Math.round((displayedProfit / currentTarget.targetProfit) * 100), 100)
    : 0;
  const qtyPct = currentTarget && currentTarget.targetQty > 0
    ? Math.min(Math.round((monthQty / currentTarget.targetQty) * 100), 100)
    : 0;
  const stockPct = currentTarget && currentTarget.targetStock > 0
    ? Math.min(Math.round((monthRestockQty / currentTarget.targetStock) * 100), 100)
    : 0;
  const omsetPct = currentTarget && currentTarget.targetProfit > 0
    ? Math.min(Math.round((monthRevenue / (currentTarget.targetProfit * 1.5)) * 100), 100)
    : 0;

  const monthName = `${MONTH_NAMES[thisMonth]} ${thisYear}`;

  // Achievements per month for TargetList
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

  // Customer statistics (Option A: Active Customers in selected month)
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

  if (loading) {
    return <LoadingScreen variant="dashboard" />;
  }

  // ── FORM MODE ──
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

  // ── LIST MODE ──
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

  // ── CUSTOMER GROWTH MODE ──
  if (view === 'customer-growth') {
    return <CustomerGrowthPage onBack={() => setView('dashboard')} />;
  }

  // ── DASHBOARD MODE ──
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background">
      {/* Header - Compact */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
                {getGreeting()}
              </span>
              <h1 className="text-sm font-black text-slate-900 leading-none">Beranda</h1>
            </div>
          </div>
          <button 
            onClick={() => {
              setPickerYear(selectedYear);
              setShowMonthPicker(p => !p);
            }}
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
                    onClick={() => {
                      setSelectedYear(pickerYear);
                      setSelectedMonth(idx);
                      setShowMonthPicker(false);
                    }}
                    className={cn(
                      "py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      isSelected
                        ? "bg-slate-900 text-white"
                        : isCurrentMonth
                           ? "bg-emerald-50 text-emerald-700 border-emerald-100 border"
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

      <main className="flex-1 px-3 py-3 space-y-2.5 overflow-hidden">
        {/* ═══════ NO TARGET STATE ═══════ */}
        {!currentTarget ? (
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
          /* ═══════ ACTIVE TARGET STATE (BENTO GRID) ═══════ */
          <div className="flex flex-col gap-2.5">
            {/* Keuntungan Card - Compact */}
            <section className="bg-slate-900 rounded-[1.5rem] p-4 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keuntungan</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIncludeBiaya(false)} className={cn("text-[9px] font-black px-2 py-0.5 rounded", !includeBiaya ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500")}>Bersih</button>
                    <button onClick={() => setIncludeBiaya(true)} className={cn("text-[9px] font-black px-2 py-0.5 rounded", includeBiaya ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-500")}>Kotor</button>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-emerald-400 text-xl font-black">Rp</span>
                  <span className={cn('text-4xl font-black tracking-tighter leading-none', displayedProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(displayedProfit).replace('Rp', '').trim()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${profitPct}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 shrink-0">{profitPct}%</span>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                   <button onClick={() => setView('list')} className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                     <ListFilter className="w-3 h-3" /> Rekap Target
                   </button>
                   <button onClick={() => onNavigate('orders')} className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                     Riwayat <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </section>

            {/* Stats Grid - 2 Columns */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Omset */}
              <div className="bg-white p-3.5 rounded-[1.25rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[90px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Omset</span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 tracking-tighter leading-tight">{formatShortCurrency(monthRevenue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${omsetPct}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{omsetPct}%</span>
                  </div>
                </div>
              </div>

              {/* Terjual */}
              <div className="bg-white p-3.5 rounded-[1.25rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[90px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center">
                    <Package className="h-3 w-3 text-orange-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Terjual</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 tracking-tighter leading-tight">{monthQty}</span>
                    <span className="text-[9px] font-bold text-slate-400">pcs</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: `${qtyPct}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{qtyPct}%</span>
                  </div>
                </div>
              </div>

              {/* Restok */}
              <button onClick={() => onNavigate('stock')} className="bg-white p-3.5 rounded-[1.25rem] border border-slate-100 shadow-sm flex flex-col justify-between active:scale-95 transition-all min-h-[90px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                    <PackagePlus className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Restok</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 tracking-tighter leading-tight">{monthRestockQty}</span>
                    <span className="text-[9px] font-bold text-slate-400">btl</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${stockPct}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{stockPct}%</span>
                  </div>
                </div>
              </button>

              {/* Pelanggan Aktif (FILTERED) */}
              <button onClick={() => setView('customer-growth')} className="bg-white p-3.5 rounded-[1.25rem] border border-slate-100 shadow-sm flex flex-col justify-between active:scale-95 transition-all min-h-[90px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                    <Users className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Aktif</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 tracking-tighter leading-tight">{activeTotal}</span>
                    <span className="text-[9px] font-bold text-slate-400">org</span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <div className="flex items-center justify-between text-[8px] font-bold">
                      <span className="text-emerald-600">{activeMitra} Mitra</span>
                      <span className="text-slate-400">{activeKonsumen} Kons</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Actions - Super Compact */}
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => onNavigate('orders', 'add')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                 <Plus className="w-4 h-4" /> <span className="text-xs font-black uppercase">Order</span>
               </button>
               <button onClick={() => onNavigate('stock')} className="bg-white border-2 border-slate-100 text-slate-900 p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                 <PackagePlus className="w-4 h-4 text-emerald-600" /> <span className="text-xs font-black uppercase tracking-tight">Restok</span>
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
