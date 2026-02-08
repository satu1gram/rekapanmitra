import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { TierType, OrderStatus, OrderItem } from '@/types';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { OrderForm } from './OrderForm';
import { OrderCard } from './OrderCard';

type Order = Tables<'orders'>;

export function OrdersPage() {
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

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Edit mode
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleSubmit = async (data: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

    if (totalQuantity > currentStock) {
      toast.error(`Stok tidak cukup. Tersisa ${currentStock} botol`);
      return;
    }

    setSubmitting(true);
    try {
      const order = await addOrder({
        ...data,
        mitraLevel,
      });

      await reduceStock(totalQuantity, order.id);

      const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0);
      await addOrUpdateCustomer({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        tier: data.tier,
        totalPrice,
      });

      toast.success('Order berhasil ditambahkan!');
      setShowForm(false);
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Gagal menambah order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Status diubah ke ${newStatus}`);
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const openEditDialog = async (order: Order) => {
    setEditingOrder(order);
    // Fetch existing items for this order
    const items = await fetchOrderItems(order.id);
    if (items.length > 0) {
      setEditItems(items);
    } else {
      // Backward compatibility: create single item from order data
      setEditItems([{
        productName: 'Produk',
        quantity: order.quantity,
        pricePerBottle: Number(order.price_per_bottle),
        subtotal: Number(order.total_price),
      }]);
    }
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (data: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!editingOrder) return;

    setSubmitting(true);
    try {
      await updateOrder(editingOrder.id, {
        ...data,
        mitraLevel,
      });

      toast.success('Order berhasil diupdate!');
      setShowEditDialog(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Gagal mengupdate order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total order</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          {showForm ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
          {showForm ? 'Batal' : 'Tambah'}
        </Button>
      </div>

      {/* Add Order Form */}
      {showForm && (
        <OrderForm
          customers={customers}
          currentStock={currentStock}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'terkirim', 'selesai'] as const).map(status => (
          <Button
            key={status}
            size="sm"
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'Semua' : status}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada order
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => (
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
          ))
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false);
          setEditingOrder(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              customers={customers}
              currentStock={currentStock + editingOrder.quantity} // Add back the existing quantity
              submitting={submitting}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingOrder(null);
              }}
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
