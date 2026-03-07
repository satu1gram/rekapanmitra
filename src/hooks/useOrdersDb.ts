import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType, TIER_PRICING, MitraLevel, MITRA_LEVELS, OrderStatus, OrderItem } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
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
  }, []);

  const addOrder = useCallback(async (orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    mitraLevel: MitraLevel;
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    // Calculate totals from items using actual bottles multiplier
    const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const buyPrice = mitraInfo.buyPricePerBottle * totalQuantity;
    const margin = totalPrice - buyPrice;

    // Average sell price for backward compatibility
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
      status: 'pending'
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

      const { error: itemsError } = await supabase
        .from('order_items' as any)
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
      }
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
    mitraLevel: MitraLevel;
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const buyPrice = mitraInfo.buyPricePerBottle * totalQuantity;
    const margin = totalPrice - buyPrice;
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

    // Delete old items and insert new ones
    await supabase
      .from('order_items' as any)
      .delete()
      .eq('order_id', orderId);

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

      await supabase
        .from('order_items' as any)
        .insert(itemsToInsert);
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
