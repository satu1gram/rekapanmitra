import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TierType, TIER_PRICING, OrderStatus, OrderExpense, OrderItem } from '@/types';
import { formatCurrency, formatDateTime, formatShortCurrency } from '@/lib/formatters';
import {
  ChevronDown,
  ChevronUp,
  Check,
  Truck,
  Edit,
  PlusCircle,
  Trash2,
  Loader2,
  Package,
  Copy,
} from 'lucide-react';
import { generateReceiptText } from '@/lib/receiptGenerator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
  onEdit: (order: Order) => void;
  fetchOrderExpenses: (orderId: string) => Promise<OrderExpense[]>;
  addOrderExpense: (orderId: string, name: string, amount: number) => Promise<any>;
  deleteOrderExpense: (expenseId: string, orderId: string, amount: number) => Promise<void>;
  fetchOrderItems: (orderId: string) => Promise<OrderItem[]>;
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  terkirim: 'bg-blue-50 text-blue-700 border border-blue-200',
  selesai:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending:  'pending',
  terkirim: 'terkirim',
  selesai:  'selesai',
};

export function OrderCard({
  order, expanded, onToggleExpand, onStatusChange, onEdit,
  fetchOrderExpenses, addOrderExpense, deleteOrderExpense, fetchOrderItems,
}: OrderCardProps) {
  const [orderExpenses, setOrderExpenses] = useState<OrderExpense[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded) {
      setLoadingDetails(true);
      Promise.all([fetchOrderExpenses(order.id), fetchOrderItems(order.id)])
        .then(([expenses, items]) => { setOrderExpenses(expenses); setOrderItems(items); })
        .catch(console.error)
        .finally(() => setLoadingDetails(false));
    } else {
      setOrderExpenses([]);
      setOrderItems([]);
    }
    setExpenseName('');
    setExpenseAmount(0);
  }, [expanded, order.id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName.trim() || expenseAmount <= 0) { toast.error('Nama dan jumlah wajib diisi'); return; }
    setSubmitting(true);
    try {
      const newExpense = await addOrderExpense(order.id, expenseName.trim(), expenseAmount) as any;
      setOrderExpenses(prev => [...prev, { id: newExpense.id, orderId: newExpense.order_id, name: newExpense.name, amount: Number(newExpense.amount), createdAt: newExpense.created_at }]);
      setExpenseName(''); setExpenseAmount(0);
      toast.success('Pengeluaran ditambahkan');
    } catch { toast.error('Gagal menambah pengeluaran'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteExpense = async (expense: OrderExpense) => {
    try {
      await deleteOrderExpense(expense.id, expense.orderId, expense.amount);
      setOrderExpenses(prev => prev.filter(e => e.id !== expense.id));
      toast.success('Pengeluaran dihapus');
    } catch { toast.error('Gagal menghapus'); }
  };

  const handleCopyReceipt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const receiptText = generateReceiptText({
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: (order as any).customer_address || '',
      orderDate: order.created_at,
      items: orderItems.length > 0 ? orderItems : [{ productName: 'Produk', quantity: order.quantity, pricePerBottle: Number(order.price_per_bottle), subtotal: Number(order.total_price) }],
      totalQuantity: order.quantity,
      totalPrice: Number(order.total_price),
    });
    try { await navigator.clipboard.writeText(receiptText); toast.success('Struk disalin!'); }
    catch { toast.error('Gagal menyalin struk'); }
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
      {/* ─── COLLAPSED ROW ─── */}
      <div
        className="px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base leading-tight truncate">{order.customer_name}</p>
            <p className="text-slate-500 text-sm mt-0.5">{order.customer_phone}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', STATUS_STYLE[order.status] || STATUS_STYLE.pending)}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
            {expanded
              ? <ChevronUp className="h-5 w-5 text-slate-400" />
              : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </div>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-sm text-slate-500">
              {order.quantity} botol • {TIER_PRICING[order.tier as TierType]?.label || order.tier}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.created_at)}</p>
          </div>
          <p className="font-bold text-slate-900 text-base">{formatCurrency(Number(order.total_price))}</p>
        </div>
      </div>

      {/* ─── EXPANDED DETAIL ─── */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/40">
          {loadingDetails ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Product breakdown */}
              {orderItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2.5">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Detail Produk
                  </p>
                  {orderItems.map((item, i) => (
                    <div key={item.id || i} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.quantity}× {item.productName} <span className="text-slate-400">@ {formatShortCurrency(item.pricePerBottle)}</span></span>
                      <span className="font-semibold text-slate-800">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>TOTAL</span>
                    <span>{formatCurrency(Number(order.total_price))}</span>
                  </div>
                </div>
              )}

              {/* Margin */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3 flex justify-between items-center">
                <span className="text-emerald-700 font-bold text-sm">Margin / Profit</span>
                <span className="text-emerald-700 font-black text-base">{formatCurrency(Number(order.margin))}</span>
              </div>

              {/* Transfer proof */}
              {order.transfer_proof_url && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase px-3 py-2 bg-white">Bukti Transfer</p>
                  <img src={order.transfer_proof_url} alt="Bukti transfer" className="h-36 w-full object-cover" />
                </div>
              )}

              {/* Expenses */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Pengeluaran Tambahan</p>
                  <p className="text-xs text-slate-400">{formatCurrency(orderExpenses.reduce((s, e) => s + e.amount, 0))}</p>
                </div>
                {orderExpenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-1">Belum ada pengeluaran</p>
                ) : (
                  orderExpenses.map(expense => (
                    <div key={expense.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{expense.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{formatCurrency(expense.amount)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense); }}
                          className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <form onSubmit={handleAddExpense} className="flex gap-2 pt-2 border-t border-slate-100">
                  <div className="flex-1">
                    <Input placeholder="Nama (ongkir, dll)" className="h-8 text-xs" value={expenseName}
                      onChange={e => setExpenseName(e.target.value)} disabled={submitting} />
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Rp" className="h-8 text-xs" value={expenseAmount || ''}
                      onChange={e => setExpenseAmount(parseInt(e.target.value) || 0)} disabled={submitting} />
                  </div>
                  <button type="submit" disabled={submitting || !expenseName.trim() || expenseAmount <= 0}
                    className="h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40">
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Copy receipt */}
              <button
                onClick={handleCopyReceipt}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Copy className="h-4 w-4" /> Salin Struk
              </button>

              {/* Status actions */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(order); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onStatusChange(order.id, 'terkirim'); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                    >
                      <Truck className="h-4 w-4" /> Tandai Terkirim
                    </button>
                  </>
                )}
                {order.status === 'terkirim' && (
                  <button
                    onClick={e => { e.stopPropagation(); onStatusChange(order.id, 'selesai'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="h-4 w-4" /> Tandai Selesai
                  </button>
                )}
                {order.status === 'selesai' && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-100">
                    <Check className="h-4 w-4" /> Selesai
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
