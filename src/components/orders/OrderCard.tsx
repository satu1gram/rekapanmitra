import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

export function OrderCard({
  order,
  expanded,
  onToggleExpand,
  onStatusChange,
  onEdit,
  fetchOrderExpenses,
  addOrderExpense,
  deleteOrderExpense,
  fetchOrderItems,
}: OrderCardProps) {
  const [orderExpenses, setOrderExpenses] = useState<OrderExpense[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded) {
      const loadDetails = async () => {
        setLoadingDetails(true);
        try {
          const [expenses, items] = await Promise.all([
            fetchOrderExpenses(order.id),
            fetchOrderItems(order.id),
          ]);
          setOrderExpenses(expenses);
          setOrderItems(items);
        } catch (error) {
          console.error('Error loading order details:', error);
        } finally {
          setLoadingDetails(false);
        }
      };
      loadDetails();
    } else {
      setOrderExpenses([]);
      setOrderItems([]);
    }
    setExpenseName('');
    setExpenseAmount(0);
  }, [expanded, order.id, fetchOrderExpenses, fetchOrderItems]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName.trim() || expenseAmount <= 0) {
      toast.error('Nama dan jumlah pengeluaran harus diisi');
      return;
    }

    setSubmitting(true);
    try {
      const newExpense = await addOrderExpense(order.id, expenseName.trim(), expenseAmount) as any;
      setOrderExpenses(prev => [...prev, {
        id: newExpense.id,
        orderId: newExpense.order_id,
        name: newExpense.name,
        amount: Number(newExpense.amount),
        createdAt: newExpense.created_at
      }]);
      setExpenseName('');
      setExpenseAmount(0);
      toast.success('Pengeluaran ditambahkan');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Gagal menambah pengeluaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expense: OrderExpense) => {
    try {
      await deleteOrderExpense(expense.id, expense.orderId, expense.amount);
      setOrderExpenses(prev => prev.filter(e => e.id !== expense.id));
      toast.success('Pengeluaran dihapus');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Gagal menghapus pengeluaran');
    }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  order.status === 'selesai' ? 'default' :
                  order.status === 'terkirim' ? 'secondary' : 'outline'
                }
              >
                {order.status}
              </Badge>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">
                {order.quantity} botol • {TIER_PRICING[order.tier as TierType]?.label || order.tier}
              </span>
              <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
            </div>
            <span className="font-semibold">{formatCurrency(Number(order.total_price))}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {loadingDetails ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Order Items Breakdown */}
                {orderItems.length > 0 && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Detail Produk
                    </p>
                    {orderItems.map((item, i) => (
                      <div key={item.id || i} className="flex items-center justify-between text-sm">
                        <span>
                          {item.quantity} {item.productName} @ {formatShortCurrency(item.pricePerBottle)}
                        </span>
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between text-sm font-bold">
                      <span>TOTAL</span>
                      <span>{formatCurrency(Number(order.total_price))}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Margin</p>
                    <p className="font-semibold text-primary">{formatCurrency(Number(order.margin))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal</p>
                    <p>{formatDateTime(order.created_at)}</p>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Pengeluaran Tambahan</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(orderExpenses.reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {orderExpenses.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground italic">
                        Belum ada pengeluaran tambahan
                      </p>
                    ) : (
                      orderExpenses.map(expense => (
                        <div key={expense.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{expense.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(expense.amount)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExpense(expense);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={handleAddExpense}
                    className="flex items-end gap-2 border-t pt-3"
                  >
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="exp-name" className="text-[10px]">Nama</Label>
                      <Input
                        id="exp-name"
                        placeholder="Ongkir, dll"
                        className="h-8 text-xs"
                        value={expenseName}
                        onChange={(e) => setExpenseName(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label htmlFor="exp-amount" className="text-[10px]">Jumlah</Label>
                      <Input
                        id="exp-amount"
                        type="number"
                        className="h-8 text-xs"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(parseInt(e.target.value.replace(/^0+/, '')) || 0)}
                        disabled={submitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="h-8 w-8"
                      disabled={submitting || !expenseName.trim() || expenseAmount <= 0}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                {order.transfer_proof_url && (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Bukti Transfer</p>
                    <img
                      src={order.transfer_proof_url}
                      alt="Bukti transfer"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* Copy Receipt */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const receiptText = generateReceiptText({
                      customerName: order.customer_name,
                      customerPhone: order.customer_phone,
                      customerAddress: (order as any).customer_address || '',
                      orderDate: order.created_at,
                      items: orderItems.length > 0 ? orderItems : [{
                        productName: 'Produk',
                        quantity: order.quantity,
                        pricePerBottle: Number(order.price_per_bottle),
                        subtotal: Number(order.total_price),
                      }],
                      totalQuantity: order.quantity,
                      totalPrice: Number(order.total_price),
                    });
                    try {
                      await navigator.clipboard.writeText(receiptText);
                      toast.success('Struk disalin ke clipboard!');
                    } catch {
                      toast.error('Gagal menyalin struk');
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Salin Struk
                </Button>

                {/* Status Actions */}
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(order.id, 'terkirim');
                        }}
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Tandai Terkirim
                      </Button>
                    </>
                  )}
                  {order.status === 'terkirim' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(order.id, 'selesai');
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Tandai Selesai
                    </Button>
                  )}
                  {order.status === 'selesai' && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Selesai
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
