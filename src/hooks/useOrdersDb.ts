import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType, TIER_PRICING, MitraLevel, MITRA_LEVELS, OrderStatus, OrderItem } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

const MOCK_DEMO_ORDERS: OrderWithItems[] = [
  {
    id: "demo-order-1",
    user_id: "demo-user-id",
    customer_id: "cust-1",
    customer_name: "Budi Santoso",
    customer_phone: "081234567890",
    tier: "agen" as any,
    quantity: 12,
    price_per_bottle: 191666,
    total_price: 2300000,
    buy_price: 1850000,
    margin: 450000,
    status: "lunas" as any,
    created_at: "2026-04-06T10:00:00.000Z",
  },
  {
    id: "demo-order-2",
    user_id: "demo-user-id",
    customer_id: "cust-2",
    customer_name: "Siti Aminah",
    customer_phone: "085678901234",
    tier: "reseller" as any,
    quantity: 5,
    price_per_bottle: 195000,
    total_price: 975000,
    buy_price: 795000,
    margin: 180000,
    status: "lunas" as any,
    created_at: "2026-04-05T14:30:00.000Z",
  },
  {
    id: "demo-order-3",
    user_id: "demo-user-id",
    customer_id: "cust-3",
    customer_name: "Hendra",
    customer_phone: "089012345678",
    tier: "satuan" as any,
    quantity: 1,
    price_per_bottle: 250000,
    total_price: 250000,
    buy_price: 195000,
    margin: 55000,
    status: "lunas" as any,
    created_at: "2026-04-05T09:15:00.000Z",
  },
  {
    id: "demo-order-4",
    user_id: "demo-user-id",
    customer_id: "cust-4",
    customer_name: "Dewi Lestari",
    customer_phone: "087712345678",
    tier: "agen" as any,
    quantity: 10,
    price_per_bottle: 180000,
    total_price: 1800000,
    buy_price: 1450000,
    margin: 350000,
    status: "pending" as any,
    created_at: "2026-04-04T16:45:00.000Z",
  }
];

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');

  const fetchOrders = useCallback(async () => {
    if (isDemo) {
      setOrders(MOCK_DEMO_ORDERS);
      setLoading(false);
      return;
    }

    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }, [user?.id, isDemo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    if (isDemo) {
      if (orderId === 'demo-order-1') {
        return [
          { id: 'item-1', productName: 'Paket Steffi 10 Botol', productId: 'p1', quantity: 1, pricePerBottle: 1800000, subtotal: 1800000 },
          { id: 'item-2', productName: 'BP Satuan', productId: 'p2', quantity: 2, pricePerBottle: 250000, subtotal: 500000 }
        ];
      }
      if (orderId === 'demo-order-2') {
        return [{ id: 'item-3', productName: 'Paket Belgie 5 Botol', productId: 'p3', quantity: 1, pricePerBottle: 975000, subtotal: 975000 }];
      }
      if (orderId === 'demo-order-3') {
        return [{ id: 'item-4', productName: 'BP Satuan', productId: 'p2', quantity: 1, pricePerBottle: 250000, subtotal: 250000 }];
      }
      if (orderId === 'demo-order-4') {
        return [{ id: 'item-5', productName: 'Paket Steffi 10 Botol', productId: 'p1', quantity: 1, pricePerBottle: 1800000, subtotal: 1800000 }];
      }
    }

    const { data, error } = await supabase
      .from('order_items' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching order items:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      productName: item.product_name,
      productId: item.product_id,
      quantity: item.quantity,
      pricePerBottle: Number(item.price_per_bottle),
      subtotal: Number(item.subtotal),
    }));
  }, [isDemo]);

  const addOrder = useCallback(async (orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    expenses?: { name: string, amount: number }[];
    mitraLevel: MitraLevel;
    customBuyPrice?: number | null;
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    const effectiveBuyPricePerBottle = orderData.mitraLevel === 'custom' && orderData.customBuyPrice != null 
        ? orderData.customBuyPrice 
        : mitraInfo.buyPricePerBottle;

    const buyPrice = effectiveBuyPricePerBottle * totalQuantity;
    const totalExpenses = orderData.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const margin = totalPrice - buyPrice - totalExpenses;

    const avgPricePerBottle = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;

    const insertData: any = {
      user_id: user.id,
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      tier: orderData.tier,
      quantity: totalQuantity,
      price_per_bottle: avgPricePerBottle,
      total_price: totalPrice,
      buy_price: buyPrice,
      margin,
      transfer_proof_url: orderData.transferProofUrl || null,
      status: 'selesai'
    };

    if (orderData.createdAt) {
      insertData.created_at = orderData.createdAt;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Insert order items
    if (orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(item => ({
        order_id: data.id,
        user_id: user.id,
        product_name: item.productName,
        product_id: item.productId || null,
        quantity: item.quantity,
        price_per_bottle: item.pricePerBottle,
        subtotal: item.subtotal,
      }));

      await supabase
        .from('order_items' as any)
        .insert(itemsToInsert);
    }

    // Insert expenses if any
    if (orderData.expenses && orderData.expenses.length > 0) {
      const expensesToInsert = orderData.expenses.map(e => ({
        order_id: data.id,
        user_id: user.id,
        name: e.name,
        amount: Number(e.amount)
      }));

      await supabase
        .from('order_expenses' as any)
        .insert(expensesToInsert);
    }

    await fetchOrders();
    return data;
  }, [user, fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchOrders();
  }, [user, fetchOrders]);

  const updateOrder = useCallback(async (orderId: string, orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    expenses?: { name: string, amount: number }[];
    mitraLevel: MitraLevel;
    customBuyPrice?: number | null;
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);

    const effectiveBuyPricePerBottle = orderData.mitraLevel === 'custom' && orderData.customBuyPrice != null 
        ? orderData.customBuyPrice 
        : mitraInfo.buyPricePerBottle;

    const buyPrice = effectiveBuyPricePerBottle * totalQuantity;
    const totalExpenses = orderData.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const margin = totalPrice - buyPrice - totalExpenses;
    const avgPricePerBottle = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;

    const updateData: any = {
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      tier: orderData.tier,
      quantity: totalQuantity,
      price_per_bottle: avgPricePerBottle,
      total_price: totalPrice,
      buy_price: buyPrice,
      margin,
      transfer_proof_url: orderData.transferProofUrl || null
    };

    if (orderData.createdAt) {
      updateData.created_at = orderData.createdAt;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    // Delete and re-insert items
    await supabase.from('order_items' as any).delete().eq('order_id', orderId);
    if (orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(item => ({
        order_id: orderId,
        user_id: user.id,
        product_name: item.productName,
        product_id: item.productId || null,
        quantity: item.quantity,
        price_per_bottle: item.pricePerBottle,
        subtotal: item.subtotal,
      }));
      await supabase.from('order_items' as any).insert(itemsToInsert);
    }

    // Delete and re-insert expenses
    await supabase.from('order_expenses' as any).delete().eq('order_id', orderId);
    if (orderData.expenses && orderData.expenses.length > 0) {
      const expensesToInsert = orderData.expenses.map(e => ({
        order_id: orderId,
        user_id: user.id,
        name: e.name,
        amount: Number(e.amount)
      }));
      await supabase.from('order_expenses' as any).insert(expensesToInsert);
    }

    await fetchOrders();
  }, [user, fetchOrders]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchOrders();
  }, [user, fetchOrders]);

  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getOrdersByDateRange(today, tomorrow);
  };

  const getWeekOrders = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return getOrdersByDateRange(weekAgo, today);
  };

  const getMonthOrders = () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return getOrdersByDateRange(monthAgo, today);
  };

  const fetchOrderExpenses = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_expenses' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      // Silently ignore if table doesn't exist (PGRST205)
      if ((error as any).code !== 'PGRST205') {
        console.error('Error fetching expenses:', error);
      }
      return [];
    }
    return (data || []).map((e: any) => ({
      id: e.id,
      orderId: e.order_id,
      name: e.name,
      amount: Number(e.amount),
      createdAt: e.created_at
    }));
  }, []);

  const addOrderExpense = useCallback(async (orderId: string, name: string, amount: number) => {
    if (!user) throw new Error('User not authenticated');

    const { data: expense, error: expenseError } = await supabase
      .from('order_expenses' as any)
      .insert({
        user_id: user.id,
        order_id: orderId,
        name,
        amount
      })
      .select()
      .single();

    if (expenseError) {
      if ((expenseError as any).code === 'PGRST205') {
        throw new Error('Fitur pengeluaran belum tersedia di database ini.');
      }
      throw expenseError;
    }

    const order = orders.find(o => o.id === orderId);
    if (order) {
      const newMargin = Number(order.margin) - amount;
      const { error: orderError } = await supabase
        .from('orders')
        .update({ margin: newMargin })
        .eq('id', orderId);

      if (orderError) throw orderError;
    }

    await fetchOrders();
    return expense;
  }, [user, orders, fetchOrders]);

  const deleteOrderExpense = useCallback(async (expenseId: string, orderId: string, amount: number) => {
    const { error: expenseError } = await supabase
      .from('order_expenses' as any)
      .delete()
      .eq('id', expenseId);

    if (expenseError) throw expenseError;

    const order = orders.find(o => o.id === orderId);
    if (order) {
      const newMargin = Number(order.margin) + amount;
      const { error: orderError } = await supabase
        .from('orders')
        .update({ margin: newMargin })
        .eq('id', orderId);

      if (orderError) throw orderError;
    }

    await fetchOrders();
  }, [orders, fetchOrders]);

  return {
    orders,
    loading,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrdersByDateRange,
    getTodayOrders,
    getWeekOrders,
    getMonthOrders,
    fetchOrderItems,
    fetchOrderExpenses,
    addOrderExpense,
    deleteOrderExpense,
    refetch: fetchOrders
  };
}
