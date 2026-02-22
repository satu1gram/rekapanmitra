import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Plus,
  PackagePlus,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '@/types';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

interface DashboardProps {
  onNavigate: (tab: 'orders' | 'stock', action?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { loading: ordersLoading, getMonthOrders } = useOrders();
  const { currentStock, isLowStock, loading: stockLoading } = useStock();
  const { loading: expensesLoading, getMonthExpenses, getTotalExpenses } = useGeneralExpenses();
  const { loading: incomeLoading, getMonthIncome, getTotalIncome } = useGeneralIncome();

  const loading = ordersLoading || stockLoading || expensesLoading || incomeLoading;

  const monthOrders = getMonthOrders();
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const monthProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const monthExpensesTotal = getTotalExpenses(getMonthExpenses());
  const monthIncomeTotal = getTotalIncome(getMonthIncome());
  const monthNetProfit = monthProfit - monthExpensesTotal + monthIncomeTotal;
  const monthQty = monthOrders.reduce((sum, o) => sum + o.quantity, 0);

  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      {/* Compact sticky header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Halo, {getGreeting()}
            </span>
            <h1 className="text-lg font-black text-slate-900 leading-none">Beranda Anda</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg">
            <span className="text-sm font-black tracking-tight capitalize">{monthName}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Total Keuntungan Card */}
        <section className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col">
            {/* Label row */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Keuntungan</span>
              <div className="bg-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400">Bulan ini</span>
              </div>
            </div>
            {/* Amount */}
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-400 text-2xl font-black">Rp</span>
              <span className={cn(
                'text-5xl font-black tracking-tighter leading-none',
                monthNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {formatCurrency(monthNetProfit).replace('Rp', '').trim()}
              </span>
            </div>
            {/* Lihat Riwayat */}
            <button
              onClick={() => onNavigate('orders')}
              className="mt-5 self-start flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5 hover:bg-white/20 active:scale-95 transition-all"
            >
              <span className="text-sm font-bold text-white">Lihat Riwayat →</span>
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">

          {/* Omset */}
          <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Omset</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatShortCurrency(monthRevenue)}</p>
          </div>

          {/* Terjual */}
          <div className="bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Terjual</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{monthQty}</span>
              <span className="text-xs font-bold text-slate-400">pcs</span>
            </div>
          </div>

          {/* Stok Sisa */}
          <button
            onClick={() => onNavigate('stock')}
            className="col-span-2 bg-white p-5 rounded-[1.75rem] border-2 border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 active:scale-[0.99] transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center',
                isLowStock ? 'bg-red-50' : 'bg-slate-100'
              )}>
                <Package className={cn('h-6 w-6', isLowStock ? 'text-red-600' : 'text-slate-600')} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stok Tersedia</span>
                <p className={cn(
                  'text-4xl font-black tracking-tighter leading-none mt-0.5',
                  isLowStock ? 'text-red-600' : 'text-slate-900'
                )}>
                  {currentStock} <span className="text-2xl">Item</span>
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-slate-300" />
          </button>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-[6.5rem] left-0 right-0 px-4 z-20 pointer-events-none">
        <div className="flex gap-3 pointer-events-auto max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('orders', 'add')}
            className="flex-1 bg-emerald-600 active:scale-95 active:bg-emerald-700 transition-all text-white py-5 px-4 rounded-[1.5rem] shadow-xl shadow-emerald-200/50 flex flex-col items-center justify-center border-b-4 border-emerald-800"
          >
            <Plus className="h-7 w-7 mb-1" />
            <span className="font-black text-sm uppercase tracking-wide">Tambah Order</span>
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="flex-1 bg-slate-900 active:scale-95 active:bg-black transition-all text-white py-5 px-4 rounded-[1.5rem] shadow-xl shadow-slate-300/50 flex flex-col items-center justify-center border-b-4 border-slate-950"
          >
            <PackagePlus className="h-7 w-7 mb-1" />
            <span className="font-black text-sm uppercase tracking-wide">Restok</span>
          </button>
        </div>
      </div>
    </div>
  );
}
