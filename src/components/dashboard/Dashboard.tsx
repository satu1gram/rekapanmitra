import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { EarningsHistory } from './EarningsHistory';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Plus,
  PackagePlus,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '@/types';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi!';
  if (hour >= 11 && hour < 15) return 'Selamat Siang!';
  if (hour >= 15 && hour < 18) return 'Selamat Sore!';
  return 'Selamat Malam!';
}

interface DashboardProps {
  onNavigate: (tab: 'orders' | 'stock', action?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { orders, loading: ordersLoading, getTodayOrders, getMonthOrders } = useOrders();
  const { currentStock, isLowStock, loading: stockLoading } = useStock();
  const { expenses, loading: expensesLoading, getTodayExpenses, getMonthExpenses, getTotalExpenses } = useGeneralExpenses();
  const { income, loading: incomeLoading, getTodayIncome, getMonthIncome, getTotalIncome } = useGeneralIncome();

  const loading = ordersLoading || stockLoading || expensesLoading || incomeLoading;

  const monthOrders = getMonthOrders();
  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const monthProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const monthExpensesTotal = getTotalExpenses(getMonthExpenses());
  const monthIncomeTotal = getTotalIncome(getMonthIncome());
  const monthNetProfit = monthProfit - monthExpensesTotal + monthIncomeTotal;

  // Get current month name
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10 sticky top-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Halo,<br />{getGreeting()}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 space-y-6 pb-4">

        {/* Low Stock Alert */}
        {isLowStock && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">Stok Rendah!</p>
              <p className="text-xs text-red-500">Stok tersisa {currentStock} (minimal {LOW_STOCK_THRESHOLD})</p>
            </div>
          </div>
        )}

        {/* Total Keuntungan Card */}
        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden ring-4 ring-slate-100">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-600 rounded-full blur-3xl opacity-25 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 opacity-90">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-bold text-lg tracking-wide text-slate-100">Total Keuntungan</span>
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-emerald-400 text-3xl font-bold">Rp</span>
              <span className={cn(
                "text-[3rem] leading-none font-black tracking-tight drop-shadow-lg",
                monthNetProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatShortCurrency(monthNetProfit).replace('Rp', '').trim()}
              </span>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="mt-8 flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition-colors"
            >
              <span className="font-bold text-base text-white">Lihat Riwayat →</span>
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-5">
          {/* Omset */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100 flex flex-col justify-between h-48">
            <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl w-fit">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Omset</p>
              <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {formatShortCurrency(monthRevenue)}
              </p>
            </div>
          </div>

          {/* Terjual */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100 flex flex-col justify-between h-48">
            <div className="p-3.5 bg-orange-50 text-orange-700 rounded-2xl w-fit">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Terjual</p>
              <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {monthOrders.reduce((sum, o) => sum + o.quantity, 0)} pcs
              </p>
            </div>
          </div>

          {/* Stok Sisa */}
          <button
            onClick={() => onNavigate('stock')}
            className="col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100 flex items-center justify-between w-full active:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-5">
              <div className={cn(
                "p-4 rounded-2xl group-active:scale-95 transition-transform",
                isLowStock ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
              )}>
                <Package className="h-9 w-9" />
              </div>
              <div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Stok Sisa</p>
                <p className={cn(
                  "text-[2.5rem] font-black mt-1 leading-none",
                  isLowStock ? "text-red-600" : "text-slate-900"
                )}>
                  {currentStock} <span className="text-2xl">Item</span>
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-full group-active:bg-slate-200 transition-colors">
              <ChevronRight className="h-8 w-8 text-slate-400 group-active:text-slate-600" />
            </div>
          </button>
        </section>

        {/* Monthly Summary (collapsible detail) */}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-[6.5rem] left-0 right-0 px-6 z-20 pointer-events-none">
        <div className="flex gap-4 pointer-events-auto max-w-lg mx-auto">
          <button
            onClick={() => onNavigate('orders', 'add')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:bg-emerald-800 transition-all text-white py-5 px-6 rounded-[1.75rem] shadow-xl shadow-emerald-200 flex flex-col items-center justify-center gap-1 border-b-4 border-emerald-800"
          >
            <Plus className="h-8 w-8" />
            <span className="font-extrabold text-lg tracking-wide">Tambah Order</span>
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="flex-1 bg-slate-800 hover:bg-slate-900 active:scale-95 active:bg-black transition-all text-white py-5 px-6 rounded-[1.75rem] shadow-xl shadow-slate-300 flex flex-col items-center justify-center gap-1 border-b-4 border-slate-950"
          >
            <PackagePlus className="h-8 w-8" />
            <span className="font-extrabold text-lg tracking-wide">Restok</span>
          </button>
        </div>
      </div>
    </div>
  );
}
