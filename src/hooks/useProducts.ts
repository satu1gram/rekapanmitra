import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  name: string;
  category: string;
  package_type: string;
  quantity_per_package: number;
  default_sell_price: number;
  is_active: boolean;
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
      .from('master_products' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        package_type: p.package_type,
        quantity_per_package: p.quantity_per_package,
        default_sell_price: Number(p.price),
        is_active: p.is_active,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // User App tidak boleh melakukan mutasi Master Produk.
  // Method CRUD disesuaikan agar melempar pesan error atau hanya log saja.
  const addProduct = useCallback(async () => {
    throw new Error('Penambahan produk khusus dari Portal Admin.');
  }, []);

  const updateProduct = useCallback(async () => {
    throw new Error('Update produk khusus dari Portal Admin.');
  }, []);

  const deleteProduct = useCallback(async () => {
    throw new Error('Hapus produk khusus dari Portal Admin.');
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
