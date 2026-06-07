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

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');

  const fetchCustomers = useCallback(async () => {
    if (isDemo) {
      setCustomers([
        // 2025 (9 Customers)
        { id: 'c13', name: 'Old Customer 1', phone: '', tier: 'satuan', total_orders: 1, total_spent: 250000, user_id: 'demo-user-id', created_at: '2025-06-15T00:00:00.000Z', updated_at: '2025-06-15T00:00:00.000Z' },
        { id: 'c14', name: 'Old Customer 2', phone: '', tier: 'reseller', total_orders: 1, total_spent: 975000, user_id: 'demo-user-id', created_at: '2025-07-20T00:00:00.000Z', updated_at: '2025-07-20T00:00:00.000Z' },
        { id: 'c15', name: 'Old Customer 3', phone: '', tier: 'agen', total_orders: 1, total_spent: 1800000, user_id: 'demo-user-id', created_at: '2025-08-25T00:00:00.000Z', updated_at: '2025-08-25T00:00:00.000Z' },
        { id: 'c16', name: 'Old Customer 4', phone: '', tier: 'satuan', total_orders: 1, total_spent: 250000, user_id: 'demo-user-id', created_at: '2025-09-15T00:00:00.000Z', updated_at: '2025-09-15T00:00:00.000Z' },
        { id: 'c17', name: 'Old Customer 5', phone: '', tier: 'reseller', total_orders: 1, total_spent: 975000, user_id: 'demo-user-id', created_at: '2025-10-20T00:00:00.000Z', updated_at: '2025-10-20T00:00:00.000Z' },
        { id: 'c18', name: 'Old Customer 6', phone: '', tier: 'agen', total_orders: 1, total_spent: 1800000, user_id: 'demo-user-id', created_at: '2025-11-25T00:00:00.000Z', updated_at: '2025-11-25T00:00:00.000Z' },
        { id: 'c19', name: 'Old Customer 7', phone: '', tier: 'satuan', total_orders: 1, total_spent: 250000, user_id: 'demo-user-id', created_at: '2025-12-15T00:00:00.000Z', updated_at: '2025-12-15T00:00:00.000Z' },
        { id: 'c20', name: 'Old Customer 8', phone: '', tier: 'reseller', total_orders: 1, total_spent: 975000, user_id: 'demo-user-id', created_at: '2025-12-20T00:00:00.000Z', updated_at: '2025-12-20T00:00:00.000Z' },
        { id: 'c21', name: 'Old Customer 9', phone: '', tier: 'agen', total_orders: 1, total_spent: 1800000, user_id: 'demo-user-id', created_at: '2025-12-25T00:00:00.000Z', updated_at: '2025-12-25T00:00:00.000Z' },

        // 2026 (12 Customers)
        // Januari
        { id: 'cust-1', name: 'Budi Santoso', phone: '081234567890', tier: 'agen', total_orders: 5, total_spent: 8500000, user_id: 'demo-user-id', created_at: '2026-01-15T00:00:00.000Z', updated_at: '2026-04-06T10:00:00.000Z' },
        { id: 'cust-2', name: 'Siti Aminah', phone: '085678901234', tier: 'reseller', total_orders: 3, total_spent: 2925000, user_id: 'demo-user-id', created_at: '2026-01-20T00:00:00.000Z', updated_at: '2026-04-05T14:30:00.000Z' },
        { id: 'cust-3', name: 'Hendra', phone: '089012345678', tier: 'satuan', total_orders: 1, total_spent: 250000, user_id: 'demo-user-id', created_at: '2026-01-25T00:00:00.000Z', updated_at: '2026-04-05T09:15:00.000Z' },
        // Februari
        { id: 'cust-4', name: 'Dewi Lestari', phone: '087712345678', tier: 'agen', total_orders: 2, total_spent: 3600000, user_id: 'demo-user-id', created_at: '2026-02-10T00:00:00.000Z', updated_at: '2026-04-04T16:45:00.000Z' },
        { id: 'c5', name: 'Ahmad Fauzi', phone: '081398765432', tier: 'reseller', total_orders: 2, total_spent: 1950000, user_id: 'demo-user-id', created_at: '2026-02-18T00:00:00.000Z', updated_at: '2026-02-18T00:00:00.000Z' },
        // Maret
        { id: 'c6', name: 'Rina Wijaya', phone: '085211223344', tier: 'satuan', total_orders: 1, total_spent: 195000, user_id: 'demo-user-id', created_at: '2026-03-05T00:00:00.000Z', updated_at: '2026-03-05T00:00:00.000Z' },
        { id: 'c7', name: 'Joko Susilo', phone: '081122334455', tier: 'reseller', total_orders: 4, total_spent: 3900000, user_id: 'demo-user-id', created_at: '2026-03-12T00:00:00.000Z', updated_at: '2026-03-12T00:00:00.000Z' },
        // April
        { id: 'c8', name: 'Aditya Pratama', phone: '081223344556', tier: 'agen', total_orders: 6, total_spent: 10800000, user_id: 'demo-user-id', created_at: '2026-04-02T00:00:00.000Z', updated_at: '2026-04-02T00:00:00.000Z' },
        { id: 'c9', name: 'Santi Rahayu', phone: '087888777666', tier: 'reseller', total_orders: 3, total_spent: 2925000, user_id: 'demo-user-id', created_at: '2026-04-04T00:00:00.000Z', updated_at: '2026-04-04T00:00:00.000Z' },
        { id: 'c10', name: 'Lutfi Hakim', phone: '089666555444', tier: 'satuan', total_orders: 2, total_spent: 500000, user_id: 'demo-user-id', created_at: '2026-04-08T00:00:00.000Z', updated_at: '2026-04-08T00:00:00.000Z' },
        { id: 'c11', name: 'Megawati', phone: '081333444555', tier: 'agen', total_orders: 1, total_spent: 1800000, user_id: 'demo-user-id', created_at: '2026-04-12T00:00:00.000Z', updated_at: '2026-04-12T00:00:00.000Z' },
        { id: 'c12', name: 'Yusuf', phone: '085777888999', tier: 'reseller', total_orders: 1, total_spent: 975000, user_id: 'demo-user-id', created_at: '2026-04-15T00:00:00.000Z', updated_at: '2026-04-15T00:00:00.000Z' }
      ] as any);
      setLoading(false);
      return;
    }

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
  }, [user?.id]);

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
    customerAddress?: string;
    province?: string;
    city?: string;
    tier: TierType;
    totalPrice: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Check if customer exists (only if phone is provided)
    const existing = orderData.customerPhone 
      ? customers.find(c => c.phone === orderData.customerPhone)
      : null;

    if (existing) {
      const newTier = getUpgradedTier(existing.tier as TierType, orderData.tier);
      const { error } = await supabase
        .from('customers')
        .update({
          name: orderData.customerName,
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + orderData.totalPrice,
          tier: newTier,
          ...(orderData.customerAddress !== undefined && { address: orderData.customerAddress }),
          ...(orderData.province !== undefined && { province: orderData.province }),
          ...(orderData.city !== undefined && { city: orderData.city })
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
          phone: orderData.customerPhone || null,
          address: orderData.customerAddress || null,
          province: orderData.province || null,
          city: orderData.city || null,
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

  // Normalisasi nama: hapus prefix sapaan, lowercase, trim
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/^(bu|pak|bpk|ibu|mbak|mas|kak|si|om|tante)\s+/i, '')
      .trim();
  };

  // Cari customer by nama (exact case-insensitive)
  const getCustomerByName = (name: string) => {
    const normalized = normalizeName(name);
    return customers.find(c => normalizeName(c.name) === normalized);
  };

  // Cari customer by nama (fuzzy - salah satu mengandung yang lain)
  const findCustomerFuzzy = (name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) return undefined;
    // Harus minimal 3 karakter untuk fuzzy match (cegah false positive)
    if (normalized.length < 3) return undefined;
    return customers.find(c => {
      const cNorm = normalizeName(c.name);
      return cNorm.includes(normalized) || normalized.includes(cNorm);
    });
  };

  const updateCustomer = async (id: string, updates: { name?: string; phone?: string | null; address?: string | null; created_at?: string }) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('customers')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetchCustomers();
  };

  return {
    customers,
    loading,
    addOrUpdateCustomer,
    updateCustomer,
    getCustomerByPhone,
    getCustomerByName,
    findCustomerFuzzy,
    refetch: fetchCustomers
  };
}
