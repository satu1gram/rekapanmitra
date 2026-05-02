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
import { TierType, OrderItem, MITRA_LEVELS, OrderStatus } from '@/types';
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
  Trophy,
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
  const getLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(
    getLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [endDate, setEndDate] = useState<string>(
    getLocalYYYYMMDD(now)
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
  const [activeTab, setActiveTab] = useState<'orders' | 'leaderboard' | 'performa'>('orders');
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
  const { currentStock } = useStock();
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

  const leaderboardData = useMemo(() => {
    const acc = new Map<string, { total_qty: number, total_price: number, name: string, tier: string, id: string | null }>();
    for (const o of filteredOrders) {
      // Deteksi ID pelanggan, atau cari berdasarkan kecocokan nama jika ID terputus
      let matchedCust = o.customer_id ? customers.find(x => x.id === o.customer_id) : null;
      if (!matchedCust && o.customer_name) {
         const searchName = (o.customer_name || '').toLowerCase().trim();
         matchedCust = customers.find(x => (x.name || '').toLowerCase().trim() === searchName);
      }

      // Kunci grouping prioritas: UUID valid, atau String nama (fallback)
      const key = matchedCust ? matchedCust.id : (o.customer_name || 'anon').toLowerCase().trim();

      let record = acc.get(key);
      if (!record) {
        record = {
          id: matchedCust ? matchedCust.id : null,
          total_qty: 0,
          total_price: 0,
          name: matchedCust ? matchedCust.name : (o.customer_name || 'Tidak diketahui'),
          tier: matchedCust ? matchedCust.tier : (o.tier || 'satuan'),
        };
        acc.set(key, record);
      }
      
      record.total_qty += o.quantity;
      record.total_price += Number(o.total_price);
    }
    return Array.from(acc.values()).sort((a, b) => b.total_price - a.total_price);
  }, [filteredOrders, customers]);

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
  }): Promise<boolean> => {
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    setSubmitting(true);
    const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalBuy = MITRA_LEVELS[mitraLevel].buyPricePerBottle * totalQuantity;
    try {
      await addOrder({ ...data, mitraLevel });
      // Remove setShowAddModal(false) and setOrderResult() here so TambahOrderFlow shows its own success UI
      addOrUpdateCustomer({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        province: data.province,
        city: data.city,
        tier: data.tier,
        totalPrice,
      }).catch(err => console.error('addOrUpdateCustomer failed:', err));
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      setShowAddModal(false); onAddFormClose?.();
      setOrderResult({ success: false, errorMessage: err?.message || 'Gagal menyimpan order ke database.' });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
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
              // Justifikasi: Hack sementara untuk menyimpan ID customer yang baru dibuat agar terpilih otomatis saat kembali ke form order
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
          // Reset status pencarian customer terakhir jika batal
          (window as any)._lastAddedCustomerId = null;
        }}
        onEditCustomer={(c) => { setEditingCustomer(c); }}
        // Justifikasi: Membaca ID customer yang baru dibuat dari window state
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

  if (activeTab === 'performa') {
    return <PerformaPage onBack={() => setActiveTab('orders')} />;
  }

  if (loading) {
    return <LoadingScreen variant="list" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-900">
      {/* Header - Compact & Dynamic */}
      <header className="px-5 pt-4 pb-3 bg-white/95 backdrop-blur-md shadow-sm z-[40] sticky top-0 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-xl font-black tracking-tight text-slate-900 truncate">
            {activeTab === 'orders' ? 'Laporan' : activeTab === 'leaderboard' ? 'Top Mitra' : 'Grafik'}
          </h1>

          {/* Compact Tab Navigation (Right Aligned) */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 shadow-inner shrink-0">
            {[
              { id: 'orders', icon: ShoppingCart, color: 'text-emerald-600' },
              { id: 'leaderboard', icon: Trophy, color: 'text-amber-600' },
              { id: 'performa', icon: BarChart3, color: 'text-blue-600' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300",
                    isActive 
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" 
                      : "text-slate-400 hover:bg-slate-50 active:scale-95"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? tab.color : "text-slate-400")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Date Filter - Ultra Compact */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex bg-white rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 transition-all shadow-sm">
            <button
              onClick={() => setShowMonthPicker(p => !p)}
              className="flex items-center justify-center px-2.5 border-r border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            </button>

            <div className="flex-1 flex items-center divide-x divide-slate-100">
              <div className="flex-1 flex items-center px-2.5 py-1.5 min-w-0">
                <span className="text-[8px] font-black text-slate-400 mr-1.5 shrink-0 uppercase tracking-tighter">Dari</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-slate-900 outline-none min-w-0"
                />
              </div>
              <div className="flex-1 flex items-center px-2.5 py-1.5 min-w-0">
                <span className="text-[8px] font-black text-slate-400 mr-1.5 shrink-0 uppercase tracking-tighter">Sampai</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-slate-900 outline-none min-w-0"
                />
              </div>
            </div>
          </div>
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
        {activeTab === 'leaderboard' ? (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-slate-800">Top Pelanggan Paling Aktif</h2>
            <p className="text-xs text-slate-500 font-medium mb-3">Diurutkan berdasarkan total nilai belanja pada rentang tanggal ini.</p>
            
            {leaderboardData.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-slate-50 border-dashed shadow-sm">
                <p className="text-sm font-medium text-slate-400">Belum ada aktivitas belanja.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {leaderboardData.map((lb, idx) => (
                  <button key={idx} onClick={() => {
                    const cust = lb.id ? customers.find(c => c.id === lb.id) : customers.find(c => c.name === lb.name);
                    if (cust) setEditingCustomer(cust);
                  }} className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 border-2",
                        idx === 0 ? "bg-amber-100 border-amber-200 text-amber-600" :
                        idx === 1 ? "bg-slate-100 border-slate-200 text-slate-500" :
                        idx === 2 ? "bg-orange-100 border-orange-200 text-orange-600" :
                        "bg-blue-50 border-blue-100 text-blue-600"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{lb.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            lb.tier !== 'satuan' ? "text-red-500" : "text-slate-400"
                          )}>
                            {lb.tier !== 'satuan' ? lb.tier.replace('_', ' ') : 'Konsumen'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500 font-medium">{lb.total_qty} botol</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-emerald-600 text-sm leading-tight">{formatCurrency(lb.total_price)}</p>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>

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
        <div className="space-y-2">
          <h2 className="text-sm font-black text-slate-800 px-1 uppercase tracking-wider">Ringkasan</h2>
          <div className="grid grid-cols-1 gap-2">
            {/* Total Omset & Terjual Terpadu */}
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Omset & Terjual</span>
                </div>
                <div className="bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 flex items-center gap-1">
                  <span className="text-xs font-black text-orange-600">{totalQty}</span>
                  <span className="text-[9px] font-bold text-orange-400 uppercase">pcs</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            {/* Keuntungan Bersih */}
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Keuntungan/Profit</span>
                </div>
                {/* Toggle biaya */}
                <button
                  onClick={() => setIncludeCosts(v => !v)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold transition-all",
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
        </>
      )}
      </main>



      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setEditingOrder(null); } }}>
        <DialogContent className="max-h-[95vh] p-0 overflow-hidden flex flex-col sm:max-w-lg rounded-t-3xl sm:rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-4 border-b border-slate-50 bg-white shrink-0">
            <DialogTitle className="text-base font-black text-slate-800">Edit Transaksi</DialogTitle>
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
