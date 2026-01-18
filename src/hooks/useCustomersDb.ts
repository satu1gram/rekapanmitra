import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const getUpgradedTier = (currentTier: TierType, newTier: TierType): TierType => {
    const tierOrder: TierType[] = ['satuan', 'reseller', 'agen', 'agen_plus', 'sap'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const newIndex = tierOrder.indexOf(newTier);
    return newIndex > currentIndex ? newTier : currentTier;
  };

  const addOrUpdateCustomer = async (orderData: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    totalPrice: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Check if customer exists
    const existing = customers.find(c => c.phone === orderData.customerPhone);

    if (existing) {
      const newTier = getUpgradedTier(existing.tier as TierType, orderData.tier);
      const { error } = await supabase
        .from('customers')
        .update({
          name: orderData.customerName,
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + orderData.totalPrice,
          tier: newTier
        })
        .eq('id', existing.id);

      if (error) throw error;
      await fetchCustomers();
      return existing.id;
    } else {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          tier: orderData.tier,
          total_orders: 1,
          total_spent: orderData.totalPrice
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCustomers();
      return data.id;
    }
  };

  const getCustomerByPhone = (phone: string) => {
    return customers.find(c => c.phone === phone);
  };

  return {
    customers,
    loading,
    addOrUpdateCustomer,
    getCustomerByPhone,
    refetch: fetchCustomers
  };
}
