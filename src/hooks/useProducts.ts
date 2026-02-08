import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  default_sell_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts((data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        default_sell_price: Number(p.default_sell_price),
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (name: string, defaultSellPrice: number) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('products' as any)
      .insert({
        user_id: user.id,
        name: name.trim(),
        default_sell_price: defaultSellPrice,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchProducts();
    return data;
  }, [user, fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: { name?: string; default_sell_price?: number }) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('products' as any)
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  }, [user, fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products' as any)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  }, [user, fetchProducts]);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
