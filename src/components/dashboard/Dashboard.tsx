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
  Loader2, AlertTriangle, ChevronRight, ChevronDown,
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
  const { currentStock, isLowStock, loading: stockLoading } = useStock();
  const { loading: expensesLoading, getMonthExpenses, getTotalExpenses } = useGeneralExpenses();
  const { loading: incomeLoading, getMonthIncome, getTotalIncome } = useGeneralIncome();
  const { targets, getTarget, setTarget } = useTargets();
  const { customers, loading: customersLoading } = useCustomers();

  const loading = ordersLoading || stockLoading || expensesLoading || incomeLoading || customersLoading;

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // UI State
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
    ? Math.min(Math.round((currentStock / currentTarget.targetStock) * 100), 100)
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

  // Customer statistics
  const totalCustomers = customers.length;
  const totalKonsumen = customers.filter(c => c.tier === 'satuan').length;
  const totalMitra = totalCustomers - totalKonsumen;

  const openForm = (year: number, month: number) => {
    setFormYear(year); setFormMonth(month); setView('form');
  };

  if (loading) {
    return <LoadingScreen />;
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Halo, {getGreeting()}
            </span>
            <h1 className="text-lg font-black text-slate-900 leading-none">Beranda Anda</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg cursor-pointer">
            <span className="text-sm font-black tracking-tight capitalize">{monthName}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3 pb-4">

        {/* Low Stock Alert */}
        {isLowStock && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-black text-red-700 uppercase tracking-wide">Stok Rendah!</p>
              <p className="text-xs text-red-500">Stok tersisa {currentStock} (minimal {LOW_STOCK_THRESHOLD})</p>
            </div>
          </div>
        )}

        {/* ═══════ NO TARGET STATE ═══════ */}
        {!currentTarget ? (
          <>
            {/* Warning card */}
            <div className="bg-white rounded-[2rem] p-8 text-center border-2 border-amber-100 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Target Belum Diatur</h2>
              <p className="text-sm text-slate-500 font-medium mb-6 max-w-[220px] mx-auto leading-snug">
                Silakan atur target bulanan Anda sebelum memulai aktivitas penjualan.
              </p>
              <button
                onClick={() => openForm(thisYear, thisMonth)}
                className="w-full bg-emerald-600 active:scale-[0.98] active:bg-emerald-700 transition-all text-white text-lg font-black py-5 px-6 rounded-[1.5rem] shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 border-b-4 border-emerald-800"
              >
                <Flag className="h-6 w-6" />
                ATUR TARGET SEKARANG
              </button>
            </div>

            {/* Blurred/locked stat previews */}
            <div className="grid grid-cols-2 gap-3 opacity-50 pointer-events-none select-none">
              <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Omset</span>
                </div>
                <p className="text-3xl font-black text-slate-200 tracking-tighter">——</p>
              </div>
              <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-300" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Terjual</span>
                </div>
                <p className="text-3xl font-black text-slate-200 tracking-tighter">——</p>
              </div>
              <div className="col-span-2 bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Stok Tersedia</span>
                <p className="text-4xl font-black text-slate-200 tracking-tighter">— Item</p>
              </div>
            </div>

            {/* Locked CTA buttons */}
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-200 py-5 px-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-1">
                <Lock className="h-6 w-6 text-slate-400" />
                <span className="font-black text-xs uppercase tracking-wide text-slate-400">Tambah Order</span>
              </div>
              <div className="flex-1 bg-slate-200 py-5 px-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-1">
                <Lock className="h-6 w-6 text-slate-400" />
                <span className="font-black text-xs uppercase tracking-wide text-slate-400">Restok</span>
              </div>
            </div>
          </>
        ) : (
          /* ═══════ ACTIVE TARGET STATE ═══════ */
          <>
            {/* Total Keuntungan Card */}
            <section className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                {/* Label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Keuntungan</span>
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400">+{profitPct}%</span>
                  </div>
                </div>

                {/* Include/Exclude Biaya Toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setIncludeBiaya(false)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border",
                      !includeBiaya
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-slate-500 border-white/10 hover:bg-white/10"
                    )}
                  >
                    Tanpa Biaya
                  </button>
                  <button
                    onClick={() => setIncludeBiaya(true)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border",
                      includeBiaya
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-slate-500 border-white/10 hover:bg-white/10"
                    )}
                  >
                    Dengan Biaya
                  </button>
                </div>

                {/* Amount */}
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-emerald-400 text-2xl font-black">Rp</span>
                  <span className={cn(
                    'text-5xl font-black tracking-tighter leading-none',
                    displayedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {formatCurrency(displayedProfit).replace('Rp', '').trim()}
                  </span>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${profitPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-400 shrink-0">{profitPct}% tercapai</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-4">
                  Target: {formatShortCurrency(currentTarget.targetProfit)}
                </p>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/5 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <ListFilter className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">Lihat Semua</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigate('orders')}
                    className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/5 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <span className="text-xs font-bold text-white">Riwayat</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </section>

            {/* Omset + Terjual */}
            <div className="grid grid-cols-2 gap-3">
              {/* Omset */}
              <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Omset</span>
                  </div>
                  {/* Mini circle indicator */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 15}`}
                        strokeDashoffset={`${2 * Math.PI * 15 * (1 - Math.min(monthRevenue / (currentTarget.targetProfit * 1.5), 1))}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-700">{omsetPct}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatShortCurrency(monthRevenue)}</p>
              </div>

              {/* Terjual */}
              <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Terjual</span>
                  </div>
                  {/* Mini circle */}
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={qtyPct >= 80 ? '#f97316' : '#fb923c'} strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 15}`}
                        strokeDashoffset={`${2 * Math.PI * 15 * (1 - qtyPct / 100)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-700">{qtyPct}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{monthQty}</span>
                  <span className="text-xs font-bold text-slate-400">pcs</span>
                </div>
                {currentTarget.targetQty > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${qtyPct}%` }}
                    />
                  </div>
                )}
                {currentTarget.targetQty > 0 && (
                  <p className="text-[10px] text-slate-400">Target: {currentTarget.targetQty} pcs</p>
                )}
              </div>

              {/* Stok */}
              <button
                onClick={() => onNavigate('stock')}
                className={cn(
                  'col-span-2 bg-white p-5 rounded-[1.75rem] border-2 shadow-sm flex items-center justify-between active:bg-slate-50 active:scale-[0.99] transition-all text-left',
                  isLowStock ? 'border-red-200' : 'border-slate-100'
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                    isLowStock ? 'bg-red-50' : 'bg-slate-100'
                  )}>
                    <Package className={cn('h-6 w-6', isLowStock ? 'text-red-600' : 'text-slate-600')} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stok Tersedia</span>
                      {isLowStock && (
                        <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">Sisa Sedikit</span>
                      )}
                    </div>
                    <p className={cn('text-4xl font-black tracking-tighter leading-none', isLowStock ? 'text-red-600' : 'text-slate-900')}>
                      {currentStock} <span className="text-2xl">Item</span>
                    </p>
                    {currentTarget.targetStock > 0 && (
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className={cn('h-full rounded-full', stockPct >= 80 ? 'bg-red-400' : 'bg-slate-400')}
                          style={{ width: `${Math.min(stockPct, 100)}%` }}
                        />
                      </div>
                    )}
                    {currentTarget.targetStock > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Target: {currentTarget.targetStock} item</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-300 shrink-0" />
              </button>
            </div>

            {/* Total Pelanggan Card */}
            <button
              onClick={() => setView('customer-growth')}
              className="w-full text-left bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.99] active:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="h-7 w-7 text-blue-600 fill-blue-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Total Pelanggan</span>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{totalCustomers}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-emerald-600">{totalMitra} Mitra</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                  <span className="text-sm font-bold text-slate-500">{totalKonsumen} Konsumen</span>
                </div>
              </div>
            </button>

          </>
        )}
      </main>
    </div>
  );
}
