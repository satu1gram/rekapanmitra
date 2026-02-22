import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useCustomers } from '@/hooks/useCustomersDb';
import { useProfile } from '@/hooks/useProfile';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { TierType, OrderItem, MITRA_LEVELS } from '@/types';
import {
  Loader2,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Package,
  BarChart3,
  ChevronLeft,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { OrderForm } from './OrderForm';
import { OrderCard } from './OrderCard';
import { PerformaPage } from './PerformaPage';
import { OrderResultPage, OrderResult } from './OrderResultPage';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Order = Tables<'orders'>;

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface DailySummary {
  date: Date;
  dayName: string;
  dayNum: number;
  revenue: number;
  profit: number;
  quantity: number;
  orders: Order[];
}

interface OrdersPageProps { openAddForm?: boolean; onAddFormClose?: () => void; }

export function OrdersPage({ openAddForm = false, onAddFormClose }: OrdersPageProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(openAddForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [showPerforma, setShowPerforma] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  const {
    orders,
    loading,
    addOrder,
    updateOrder,
    updateOrderStatus,
    fetchOrderExpenses,
    addOrderExpense,
    deleteOrderExpense,
    fetchOrderItems,
  } = useOrders();
  const { currentStock, reduceStock } = useStock();
  const { customers, addOrUpdateCustomer } = useCustomers();
  const { mitraLevel } = useProfile();
  const { getTotalExpenses, getMonthExpenses } = useGeneralExpenses();
  const { getTotalIncome, getMonthIncome } = useGeneralIncome();

  // Filter orders for selected month/year
  const monthOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [orders, selectedYear, selectedMonth]);

  // Summary stats
  const totalRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const totalQty = monthOrders.reduce((sum, o) => sum + o.quantity, 0);

  // General expenses & income for selected month (only current month is available from hook)
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const expensesTotal = isCurrentMonth ? getTotalExpenses(getMonthExpenses()) : 0;
  const incomeTotal = isCurrentMonth ? getTotalIncome(getMonthIncome()) : 0;
  const netProfit = totalProfit - expensesTotal + incomeTotal;

  // Group orders by day
  const dailySummaries = useMemo((): DailySummary[] => {
    const map = new Map<string, DailySummary>();
    for (const o of monthOrders) {
      const d = new Date(o.created_at);
      const key = d.toDateString();
      if (!map.has(key)) {
        map.set(key, {
          date: d,
          dayName: DAY_NAMES_ID[d.getDay()],
          dayNum: d.getDate(),
          revenue: 0,
          profit: 0,
          quantity: 0,
          orders: [],
        });
      }
      const entry = map.get(key)!;
      entry.revenue += Number(o.total_price);
      entry.profit += Number(o.margin);
      entry.quantity += o.quantity;
      entry.orders.push(o);
    }
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [monthOrders]);

  const visibleDays = showAllDays ? dailySummaries : dailySummaries.slice(0, 5);

  // Month navigation
  const goPrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const handleSubmit = async (data: {
    customerName: string; customerPhone: string; tier: TierType;
    items: OrderItem[]; transferProofUrl?: string; customerId?: string; createdAt?: string;
  }) => {
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > currentStock) {
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({ success: false, errorMessage: `Stok tidak cukup. Tersisa ${currentStock} pcs.` });
      return;
    }
    setSubmitting(true);
    const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalBuy = MITRA_LEVELS[mitraLevel].buyPricePerBottle * totalQuantity;
    try {
      // ─── OPERASI KRITIS: hanya ini yang menentukan sukses/gagal ───
      const order = await addOrder({ ...data, mitraLevel });

      // Order berhasil disimpan → tampilkan sukses segera
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({
        success: true,
        totalPrice,
        estimatedProfit: totalPrice - totalBuy,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      });

      // ─── OPERASI SEKUNDER: gagal tidak mempengaruhi layar sukses ───
      reduceStock(totalQuantity, order.id).catch(err =>
        console.error('reduceStock failed (order already saved):', err)
      );
      addOrUpdateCustomer({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        tier: data.tier,
        totalPrice,
      }).catch(err => console.error('addOrUpdateCustomer failed:', err));

    } catch (error: any) {
      // Hanya addOrder yang bisa masuk sini
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({ success: false, errorMessage: error?.message || 'Gagal menyimpan order ke database.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Status diubah ke ${newStatus}`);
    } catch { toast.error('Gagal mengubah status'); }
  };

  const openEditDialog = async (order: Order) => {
    setEditingOrder(order);
    const items = await fetchOrderItems(order.id);
    setEditItems(items.length > 0 ? items : [{
      productName: 'Produk', quantity: order.quantity,
      pricePerBottle: Number(order.price_per_bottle), subtotal: Number(order.total_price),
    }]);
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (data: {
    customerName: string; customerPhone: string; tier: TierType;
    items: OrderItem[]; transferProofUrl?: string; customerId?: string; createdAt?: string;
  }) => {
    if (!editingOrder) return;
    setSubmitting(true);
    try {
      await updateOrder(editingOrder.id, { ...data, mitraLevel });
      toast.success('Order berhasil diupdate!');
      setShowEditDialog(false); setEditingOrder(null);
    } catch { toast.error('Gagal mengupdate order'); }
    finally { setSubmitting(false); }
  };

  if (showAddModal) {
    return (
      <OrderForm
        customers={customers}
        currentStock={currentStock}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setShowAddModal(false)}
      />
    );
  }

  if (orderResult) {
    return (
      <OrderResultPage
        result={orderResult}
        onAddNew={() => { setOrderResult(null); setShowAddModal(true); }}
        onGoHome={() => { setOrderResult(null); }}
      />
    );
  }

  if (showPerforma) {
    return <PerformaPage onBack={() => setShowPerforma(false)} />;
  }

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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Riwayat</span>
              <h1 className="text-lg font-black text-slate-900 leading-none">Riwayat Bulanan</h1>
            </div>
            {/* Month Selector pill */}
            <button
              onClick={() => setShowMonthPicker(p => !p)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-sm font-black tracking-tight">{MONTH_NAMES_ID[selectedMonth]} {selectedYear}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMonthPicker && "rotate-180")} />
            </button>
          </div>

          {/* Inline Month Picker */}
          {showMonthPicker && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
              {/* Year nav */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 rounded-xl hover:bg-slate-100">
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <span className="text-base font-black text-slate-900">{selectedYear}</span>
                <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 rounded-xl hover:bg-slate-100">
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-3 gap-2 p-3">
                {MONTH_NAMES_ID.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-bold transition-colors",
                      selectedMonth === idx && selectedYear === selectedYear
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-3">

        {/* Performance Chart Button */}
        <button
          className="w-full bg-white border-2 border-blue-600 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md active:bg-blue-50 transition-all active:scale-[0.98]"
          onClick={() => setShowPerforma(true)}
        >
          <BarChart3 className="h-6 w-6 text-blue-700" />
          <span className="text-base font-black text-blue-800 tracking-tight uppercase">Lihat Grafik Performa</span>
        </button>

        {/* Summary Cards */}
        <div>
          <h2 className="text-base font-black text-slate-800 px-1 mb-3 uppercase tracking-wide">Ringkasan Bulan Ini</h2>
          <div className="space-y-3">
            {/* Omset */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Omset</span>
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalRevenue)}</p>
            </div>

            {/* Keuntungan Bersih */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none" />
              <div className="flex items-center gap-2 mb-1 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-700" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Keuntungan Bersih</span>
              </div>
              <div className="relative z-10">
                <p className={cn("text-4xl font-black tracking-tighter", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatCurrency(netProfit)}
                </p>
                {isCurrentMonth && expensesTotal > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Margin: {formatCurrency(totalProfit)} · Biaya: -{formatCurrency(expensesTotal)}
                    {incomeTotal > 0 && ` · Lain: +${formatCurrency(incomeTotal)}`}
                  </p>
                )}
              </div>
            </div>

            {/* Total Terjual */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Produk Terjual</span>
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">
                {totalQty} <span className="text-xl font-bold text-slate-400">pcs</span>
              </p>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Rincian Harian</h2>
            {dailySummaries.length > 5 && (
              <button
                onClick={() => setShowAllDays(v => !v)}
                className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg"
              >
                {showAllDays ? 'Lebih Sedikit' : 'Lihat Semua'}
              </button>
            )}
          </div>

          {dailySummaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <p className="text-slate-400 font-medium">Belum ada order di bulan ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleDays.map(day => {
                const dayKey = day.date.toDateString();
                const isExpanded = expandedDay === dayKey;
                return (
                  <div key={dayKey} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    {/* Day row */}
                    <button
                      className="w-full bg-white p-4 flex items-center justify-between text-left active:bg-slate-50 transition-colors"
                      onClick={() => setExpandedDay(isExpanded ? null : dayKey)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0",
                          day.date.getDay() === 0
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-slate-100 text-slate-700"
                        )}>
                          <span className="text-xs uppercase">{day.dayName}</span>
                          <span className="text-xl">{day.dayNum}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{formatCurrency(day.revenue)}</p>
                          <p className={cn("text-sm font-semibold", day.profit >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {day.profit >= 0 ? '+' : ''}{formatCurrency(day.profit)} (Untung)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">{day.orders.length} order</span>
                        <ChevronRight className={cn("h-5 w-5 text-slate-300 transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </button>

                    {/* Expanded orders for the day */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-gray-50 p-3 space-y-2">
                        {day.orders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            expanded={expandedOrder === order.id}
                            onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            onStatusChange={handleStatusChange}
                            onEdit={openEditDialog}
                            fetchOrderExpenses={fetchOrderExpenses}
                            addOrderExpense={addOrderExpense}
                            deleteOrderExpense={deleteOrderExpense}
                            fetchOrderItems={fetchOrderItems}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Order Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Order</DialogTitle>
          </DialogHeader>
          <OrderForm
            customers={customers}
            currentStock={currentStock}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setEditingOrder(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              customers={customers}
              currentStock={currentStock + editingOrder.quantity}
              submitting={submitting}
              onSubmit={handleEditSubmit}
              onCancel={() => { setShowEditDialog(false); setEditingOrder(null); }}
              initialData={{
                customerName: editingOrder.customer_name,
                customerPhone: editingOrder.customer_phone,
                tier: editingOrder.tier as TierType,
                items: editItems,
                transferProofUrl: editingOrder.transfer_proof_url,
                orderDate: new Date(editingOrder.created_at).toISOString().split('T')[0],
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
