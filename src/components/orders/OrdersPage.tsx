import { useState, useMemo, useEffect } from 'react';
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
  BarChart3,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { OrderForm } from './OrderForm';
import { TambahOrderFlow } from '../order/TambahOrderFlow';
import { OrderCard } from './OrderCard';
import { PerformaPage } from './PerformaPage';
import { OrderResultPage, OrderResult } from './OrderResultPage';
import { EditCustomerPage } from '../customers/EditCustomerPage';
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
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    now.toISOString().split('T')[0]
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(openAddForm);
  
  // Sync internal state with prop for external triggers (e.g. BottomNav)
  useEffect(() => {
    if (openAddForm) {
      setShowAddModal(true);
    }
  }, [openAddForm]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [showPerforma, setShowPerforma] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Tables<'customers'> | null>(null);

  const {
    orders,
    loading,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    fetchOrderExpenses,
    addOrderExpense,
    deleteOrderExpense,
    fetchOrderItems,
  } = useOrders();
  const { currentStock, reduceStock } = useStock();
  const { customers, addOrUpdateCustomer, refetch: refetchCustomers } = useCustomers();
  const { mitraLevel } = useProfile();
  const { getTotalExpenses, getExpensesByDateRange } = useGeneralExpenses();
  const { getTotalIncome, getIncomeByDateRange } = useGeneralIncome();

  // Orders waiting for payment confirmation from public store link
  const pendingPaymentOrders = useMemo(() => orders.filter(o => o.status === 'menunggu_bayar'), [orders]);

  const filteredOrders = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(o => {
      const d = new Date(o.created_at);
      // Exclude menunggu_bayar from the main date-filtered list (they appear in the banner)
      return d >= start && d <= end && o.status !== 'menunggu_bayar';
    });
  }, [orders, startDate, endDate]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  const totalQty = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);

  const startObj = new Date(startDate); startObj.setHours(0, 0, 0, 0);
  const endObj = new Date(endDate); endObj.setHours(23, 59, 59, 999);
  const expensesTotal = getTotalExpenses(getExpensesByDateRange(startObj, endObj));
  const incomeTotal = getTotalIncome(getIncomeByDateRange(startObj, endObj));
  const netProfit = includeCosts
    ? totalProfit - expensesTotal + incomeTotal
    : totalProfit;

  const dailySummaries = useMemo((): DailySummary[] => {
    const map = new Map<string, DailySummary>();
    for (const o of filteredOrders) {
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
  }, [filteredOrders]);

  const visibleDays = showAllDays ? dailySummaries : dailySummaries.slice(0, 5);

  const handleSubmit = async (data: {
    customerName: string; customerPhone: string; customerAddress?: string; province?: string; city?: string; tier: TierType;
    items: OrderItem[]; transferProofUrl?: string; customerId?: string; createdAt?: string;
  }) => {
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity > currentStock) {
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({ success: false, errorMessage: `Stok tidak cukup. Anda mencoba pesanan sebanyak ${totalQuantity} botol (Tersisa ${currentStock} pcs).` });
      return;
    }
    setSubmitting(true);
    const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalBuy = MITRA_LEVELS[mitraLevel].buyPricePerBottle * totalQuantity;
    try {
      const order = await addOrder({ ...data, mitraLevel });
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({
        success: true,
        totalPrice,
        estimatedProfit: totalPrice - totalBuy,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        orderItems: data.items.map(i => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.pricePerBottle,
          subtotal: i.subtotal,
        })),
      });
      reduceStock(totalQuantity, order.id, data.createdAt).catch(err =>
        console.error('reduceStock failed (order already saved):', err)
      );
      addOrUpdateCustomer({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        province: data.province,
        city: data.city,
        tier: data.tier,
        totalPrice,
      }).catch(err => console.error('addOrUpdateCustomer failed:', err));
    } catch (error: any) {
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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast.success('Pesanan ditolak dan dihapus');
    } catch { toast.error('Gagal menghapus pesanan'); }
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
    customerName: string; customerPhone: string; customerAddress?: string; province?: string; city?: string; tier: TierType;
    items: OrderItem[]; transferProofUrl?: string; customerId?: string; createdAt?: string;
  }) => {
    if (!editingOrder) return;
    setSubmitting(true);
    try {
      // NOTE: order update only updates order details. customer info update is done via EditCustomerPage.
      await updateOrder(editingOrder.id, { ...data, mitraLevel });
      toast.success('Order berhasil diupdate!');
      setShowEditDialog(false); setEditingOrder(null);
    } catch { toast.error('Gagal mengupdate order'); }
    finally { setSubmitting(false); }
  };

  if (editingCustomer) {
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
        <EditCustomerPage
          customer={editingCustomer}
          onBack={() => setEditingCustomer(null)}
          onSaved={async (data) => {
            await refetchCustomers();
            setEditingCustomer(null);
            if (!editingCustomer.id) {
              (window as any)._lastAddedCustomerId = data.id;
            }
          }}
        />
      </div>
    );
  }

  if (showAddModal) {
    return (
      <TambahOrderFlow
        customers={customers}
        currentStock={currentStock}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowAddModal(false);
          (window as any)._lastAddedCustomerId = null;
        }}
        onEditCustomer={(c) => { setEditingCustomer(c); }}
        initialSelectedCustomerId={(window as any)._lastAddedCustomerId}
        onRefetchCustomers={refetchCustomers}
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
    return <LoadingScreen variant="list" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-4 bg-card shadow-sm z-10 sticky top-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Riwayat Order</h1>

        {/* Ultra-Compact Date filter and Grafik button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex bg-slate-100 rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            {/* Quick Month button */}
            <button
              onClick={() => setShowMonthPicker(p => !p)}
              className="flex items-center justify-center px-3 border-r border-slate-200 bg-white hover:bg-slate-50 transition-colors shrink-0"
            >
              <Calendar className="h-4 w-4 text-emerald-600" />
            </button>

            {/* Date Inputs in one row */}
            <div className="flex-1 flex items-center divide-x divide-slate-200">
              <div className="flex-1 flex items-center px-2 py-2">
                <span className="text-[10px] font-bold text-slate-400 mr-2 shrink-0">Dr</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-slate-900 outline-none"
                />
              </div>
              <div className="flex-1 flex items-center px-2 py-2">
                <span className="text-[10px] font-bold text-slate-400 mr-2 shrink-0">Sp</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowPerforma(true)}
            className="flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-600 px-3 py-2 rounded-xl h-[42px] shrink-0 active:bg-blue-100 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
        </div>

        {/* Month Picker dropdown */}
        {showMonthPicker && (
          <div className="mt-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <button onClick={() => setPickerYear(y => y - 1)} className="p-1.5 rounded-xl hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm font-black text-slate-900">{pickerYear}</span>
              <button onClick={() => setPickerYear(y => y + 1)} className="p-1.5 rounded-xl hover:bg-slate-100">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-2.5">
              {MONTH_NAMES_ID.map((name, idx) => {
                const start = new Date(pickerYear, idx, 1);
                const end = new Date(pickerYear, idx + 1, 0);
                const fmt = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${y}-${m}-${day}`;
                };
                const startStr = fmt(start);
                const endStr = fmt(end);
                const isSelected = startDate === startStr && endDate === endStr;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setStartDate(startStr);
                      setEndDate(endStr);
                      setShowMonthPicker(false);
                    }}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
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

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-8">

        {/* Pending Payment Banner + Orders — di main agar tidak overlap saat expanded */}
        {pendingPaymentOrders.length > 0 && (
          <div className="space-y-2">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-orange-800">
                  {pendingPaymentOrders.length} Pesanan Menunggu Konfirmasi
                </p>
                <p className="text-xs text-orange-600 font-medium">Dari link toko publik — klik untuk konfirmasi</p>
              </div>
              <div className="bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-full shrink-0">
                {pendingPaymentOrders.length}
              </div>
            </div>
            {pendingPaymentOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expandedOrder === order.id}
                onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                onStatusChange={handleStatusChange}
                onEdit={openEditDialog}
                onDelete={handleDeleteOrder}
                fetchOrderExpenses={fetchOrderExpenses}
                addOrderExpense={addOrderExpense}
                deleteOrderExpense={deleteOrderExpense}
                fetchOrderItems={fetchOrderItems}
              />
            ))}
          </div>
        )}

        {/* Ringkasan */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2.5">Ringkasan</h2>
          <div className="space-y-2">

            {/* Total Omset */}
            <div className="bg-white px-4 py-3.5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Omset</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRevenue)}</p>
            </div>

            {/* Keuntungan Bersih */}
            <div className="bg-white px-4 py-3.5 rounded-2xl shadow-sm border-2 border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full -mr-6 -mt-6 opacity-60 pointer-events-none" />
              <div className="flex items-center justify-between mb-1.5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Keuntungan/Profit</span>
                </div>
                {/* Toggle biaya */}
                <button
                  onClick={() => setIncludeCosts(v => !v)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all",
                    includeCosts
                      ? "bg-orange-50 border-orange-200 text-orange-600"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  )}
                >
                  <span>{includeCosts ? 'Inkl. Biaya' : 'Eksl. Biaya'}</span>
                </button>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <p className={cn("text-2xl font-black tracking-tight", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {netProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(netProfit))}
                </p>
                {totalRevenue > 0 && netProfit !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-black",
                    netProfit >= 0
                      ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                      : "bg-red-50 border-red-100 text-red-600"
                  )}>
                    <TrendingUp className="h-3 w-3" />
                    <span>{netProfit >= 0 ? '+' : ''}{Math.round((netProfit / totalRevenue) * 100)}%</span>
                  </div>
                )}
              </div>
              {includeCosts && expensesTotal > 0 && (
                <p className="text-[10px] text-slate-400 mt-1 relative z-10">
                  Margin: {formatCurrency(totalProfit)} · Biaya: -{formatCurrency(expensesTotal)}
                  {incomeTotal > 0 && ` · Lain: +${formatCurrency(incomeTotal)}`}
                </p>
              )}
              {!includeCosts && (
                <p className="text-[10px] text-slate-400 mt-1 relative z-10">
                  Hanya margin dari penjualan, tanpa biaya & lainnya.
                </p>
              )}
            </div>

            {/* Total Terjual */}
            <div className="bg-white px-4 py-3.5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Terjual</span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {totalQty} <span className="text-base font-bold text-slate-400">pcs</span>
              </p>
            </div>
          </div>
        </div>

        {/* Rincian Harian */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-base font-bold text-slate-800">Rincian Harian</h2>
            <div className="flex items-center gap-2">
              {dailySummaries.length > 0 && (
                <button
                  onClick={() => {
                    if (expandedDays.size === visibleDays.length) {
                      setExpandedDays(new Set());
                    } else {
                      setExpandedDays(new Set(visibleDays.map(d => d.date.toDateString())));
                    }
                  }}
                  className="text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {expandedDays.size === visibleDays.length ? 'Tutup Semua' : 'Buka Semua'}
                </button>
              )}
              {dailySummaries.length > 5 && (
                <button
                  onClick={() => setShowAllDays(v => !v)}
                  className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg"
                >
                  {showAllDays ? 'Lebih Sedikit' : 'Lihat Semua'}
                </button>
              )}
            </div>
          </div>

          {dailySummaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <p className="text-slate-400 font-medium text-sm">Belum ada order pada rentang tanggal ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleDays.map(day => {
                const dayKey = day.date.toDateString();
                const isExpanded = expandedDays.has(dayKey);
                return (
                  <div key={dayKey} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <button
                      className="w-full bg-white px-4 py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors"
                      onClick={() => setExpandedDays(prev => {
                        const next = new Set(prev);
                        if (next.has(dayKey)) next.delete(dayKey); else next.add(dayKey);
                        return next;
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0",
                          day.date.getDay() === 0
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-slate-100 text-slate-700"
                        )}>
                          <span className="text-[9px] uppercase font-bold leading-none">{day.dayName}</span>
                          <span className="text-base font-black leading-tight">{day.dayNum}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{formatCurrency(day.revenue)}</p>
                          <p className={cn("text-xs font-semibold", day.profit >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {day.profit >= 0 ? '+' : ''}{formatCurrency(day.profit)} (Untung)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">{day.orders.length} order</span>
                        <ChevronRight className={cn("h-4 w-4 text-slate-300 transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-background p-3 space-y-2">
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
              onEditCustomer={(c) => { setEditingCustomer(c); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
