import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType, TIER_PRICING, MitraLevel, MITRA_LEVELS, OrderStatus } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = useCallback(async (orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    quantity: number;
    pricePerBottle: number;
    mitraLevel: MitraLevel; // Level mitra untuk hitung harga modal
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const tierInfo = TIER_PRICING[orderData.tier];
    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    const totalBottles = orderData.quantity;
    const buyPrice = mitraInfo.buyPricePerBottle * totalBottles; // Harga modal dari level mitra
    const sellPrice = orderData.pricePerBottle;
    const totalPrice = sellPrice * totalBottles;
    const margin = totalPrice - buyPrice;

    const insertData: any = {
      user_id: user.id,
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      tier: orderData.tier,
      quantity: totalBottles,
      price_per_bottle: sellPrice,
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

    await fetchOrders();
    return data;
  }, [user, fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    await fetchOrders();
  }, [fetchOrders]);

  const updateOrder = useCallback(async (orderId: string, orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    quantity: number;
    pricePerBottle: number;
    mitraLevel: MitraLevel;
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const tierInfo = TIER_PRICING[orderData.tier];
    const mitraInfo = MITRA_LEVELS[orderData.mitraLevel];

    const totalBottles = orderData.quantity;
    const buyPrice = mitraInfo.buyPricePerBottle * totalBottles;
    const sellPrice = orderData.pricePerBottle;
    const totalPrice = sellPrice * totalBottles;
    const margin = totalPrice - buyPrice;

    const updateData: any = {
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      tier: orderData.tier,
      quantity: totalBottles,
      price_per_bottle: sellPrice,
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
    await fetchOrders();
  }, [user, fetchOrders]);

  const deleteOrder = useCallback(async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    await fetchOrders();
  }, [fetchOrders]);

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
      .from('order_expenses')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
    return data.map(e => ({
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
      .from('order_expenses')
      .insert({
        user_id: user.id,
        order_id: orderId,
        name,
        amount
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Update order margin
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
      .from('order_expenses')
      .delete()
      .eq('id', expenseId);

    if (expenseError) throw expenseError;

    // Update order margin
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
    fetchOrderExpenses,
    addOrderExpense,
    deleteOrderExpense,
    refetch: fetchOrders
  };
}
