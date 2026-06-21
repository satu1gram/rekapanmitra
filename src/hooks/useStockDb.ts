import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TierType, LOW_STOCK_THRESHOLD } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type StockEntry = Tables<'stock_entries'>;
type UserStock = Tables<'user_stock'>;

export interface ProductStock {
  productName: string;
  currentStock: number;
}

export function useStock() {
  const { user } = useAuth();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [userStock, setUserStock] = useState<UserStock | null>(null);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');

  const fetchStock = useCallback(async () => {
    if (isDemo) {
      setStockEntries([
        {
          id: "demo-stock-entry-1",
          user_id: "demo-user-id",
          product_name: "STEFFI",
          quantity: 50,
          type: "in",
          notes: "Restok awal April",
          created_at: "2026-04-01T08:00:00.000Z",
          tier: "agen",
          buy_price_per_bottle: 185000,
          total_buy_price: 9250000
        } as any
      ]);
      setUserStock({
        id: "demo-user-stock",
        user_id: "demo-user-id",
        current_stock: 120,
        created_at: "2026-04-01T08:00:00.000Z",
        updated_at: "2026-04-06T10:00:00.000Z"
      } as any);
      setProductStocks([
        { productName: "STEFFI", currentStock: 50 },
        { productName: "BELGIE", currentStock: 30 },
        { productName: "BP", currentStock: 40 },
      ]);
      setLoading(false);
      return;
    }

    if (!user) {
      setStockEntries([]);
      setUserStock(null);
      setProductStocks([]);
      setLoading(false);
      return;
    }

    const [entriesResult, stockResult, productStockResult] = await Promise.all([
      supabase
        .from('stock_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_stock')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('user_product_stock')
        .select('*')
        .eq('user_id', user.id)
        .order('product_name', { ascending: true })
    ]);

    if (entriesResult.error) {
      console.error('Error fetching stock entries:', entriesResult.error);
    } else {
      setStockEntries(entriesResult.data || []);
    }

    if (stockResult.error) {
      console.error('Error fetching user stock:', stockResult.error);
    } else {
      setUserStock(stockResult.data);
    }

    if (productStockResult.error) {
      console.error('Error fetching product stocks:', productStockResult.error);
    } else {
      setProductStocks(
        (productStockResult.data || []).map((ps: any) => ({
          productName: ps.product_name,
          currentStock: ps.current_stock,
        }))
      );
    }

    setLoading(false);
  }, [user?.id, isDemo]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const currentStock = userStock?.current_stock ?? 0;
  const isLowStock = currentStock <= LOW_STOCK_THRESHOLD;

  const getProductStock = (productName: string): number => {
    return productStocks.find(ps => ps.productName === productName)?.currentStock ?? 0;
  };

  const upsertProductStock = async (productName: string, newStock: number) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_product_stock')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_name', productName)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_product_stock')
        .update({ current_stock: Math.max(0, newStock) })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_product_stock')
        .insert({ user_id: user.id, product_name: productName, current_stock: Math.max(0, newStock) });
      if (error) throw error;
    }
  };

  const addStock = async (data: {
    quantity: number;
    tier: TierType;
    buyPricePerBottle?: number;
    transferProofUrl?: string;
    notes?: string;
    createdAt?: string;
    isInitialStock?: boolean;
    productName?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const insertData: any = {
      user_id: user.id,
      type: 'in',
      quantity: data.quantity,
      tier: data.tier,
      buy_price_per_bottle: data.buyPricePerBottle ?? null,
      total_buy_price: data.buyPricePerBottle ? data.quantity * data.buyPricePerBottle : null,
      transfer_proof_url: data.transferProofUrl || null,
      notes: data.notes || (data.isInitialStock ? 'Stok awal' : null),
      product_name: data.productName || null,
    };

    if (data.createdAt) {
      insertData.created_at = data.createdAt;
    }

    // Add stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .insert(insertData);

    if (entryError) throw entryError;

    // Update total stock
    const newTotalStock = currentStock + data.quantity;

    if (userStock) {
      const { error: updateError } = await supabase
        .from('user_stock')
        .update({ current_stock: newTotalStock })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_stock')
        .insert({ user_id: user.id, current_stock: newTotalStock });
      if (insertError) throw insertError;
    }

    // Update per-product stock if product name provided
    if (data.productName) {
      const currentProdStock = getProductStock(data.productName);
      await upsertProductStock(data.productName, currentProdStock + data.quantity);
    }

    await fetchStock();
  };

  const reduceStock = async (quantity: number, orderId?: string, createdAt?: string, productName?: string) => {
    if (!user) throw new Error('User not authenticated');
    if (currentStock < quantity) {
      throw new Error('Stok tidak mencukupi');
    }

    const insertData: any = {
      user_id: user.id,
      type: 'out',
      quantity,
      order_id: orderId || null,
      product_name: productName || null,
    };

    if (createdAt) {
      insertData.created_at = createdAt;
    }

    // Add stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .insert(insertData);

    if (entryError) throw entryError;

    // Update total stock
    const newStock = currentStock - quantity;
    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: newStock })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Update per-product stock if product name provided
    if (productName) {
      const currentProdStock = getProductStock(productName);
      await upsertProductStock(productName, currentProdStock - quantity);
    }

    await fetchStock();
  };

  const updateStockEntry = async (entryId: string, data: {
    quantity: number;
    tier: TierType;
    buyPricePerBottle: number;
    transferProofUrl?: string;
    notes?: string;
    createdAt?: string;
    productName?: string;
  }, oldQuantity: number, oldProductName?: string) => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      quantity: data.quantity,
      tier: data.tier,
      buy_price_per_bottle: data.buyPricePerBottle,
      total_buy_price: data.quantity * data.buyPricePerBottle,
      transfer_proof_url: data.transferProofUrl || null,
      notes: data.notes || null,
      product_name: data.productName || null,
    };

    if (data.createdAt) {
      updateData.created_at = data.createdAt;
    }

    // Update stock entry
    const { error: entryError } = await supabase
      .from('stock_entries')
      .update(updateData)
      .eq('id', entryId);

    if (entryError) throw entryError;

    // Fetch latest user_stock from DB first to avoid stale state
    const { data: latestStock, error: stockFetchError } = await supabase
      .from('user_stock')
      .select('current_stock')
      .eq('user_id', user.id)
      .maybeSingle();

    if (stockFetchError) throw stockFetchError;

    const baseStock = latestStock?.current_stock ?? currentStock;
    const diff = data.quantity - oldQuantity;
    const newStock = baseStock + diff;

    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: newStock })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Update per-product stock
    const effectiveOldProduct = oldProductName || data.productName;
    if (effectiveOldProduct || data.productName) {
      const oldProd = oldProductName;
      const newProd = data.productName;

      // Decrease old product stock
      if (oldProd) {
        const oldProdStock = await fetchSingleProductStock(oldProd);
        await upsertProductStock(oldProd, oldProdStock - (oldProd === newProd ? 0 : oldQuantity));
      }

      // Increase new product stock
      if (newProd) {
        const newProdStock = await fetchSingleProductStock(newProd);
        if (oldProd === newProd) {
          // Same product, just quantity changed
          await upsertProductStock(newProd, newProdStock - oldQuantity + data.quantity);
        } else {
          await upsertProductStock(newProd, newProdStock + data.quantity);
        }
      }
    }

    await fetchStock();
  };

  const fetchSingleProductStock = async (productName: string): Promise<number> => {
    if (!user) return 0;
    const { data } = await supabase
      .from('user_product_stock')
      .select('current_stock')
      .eq('user_id', user.id)
      .eq('product_name', productName)
      .maybeSingle();
    return (data as any)?.current_stock ?? 0;
  };

  const deleteStockEntry = async (entryId: string, entryQuantity: number, entryType: string, productName?: string) => {
    if (!user) throw new Error('User not authenticated');

    // Read the entry first to get product_name if not provided
    const entryProductName = productName;
    if (!entryProductName) {
      const { data: entry } = await supabase
        .from('stock_entries')
        .select('product_name')
        .eq('id', entryId)
        .single();
      if (entry) {
        productName = (entry as any).product_name;
      }
    }

    const { error: deleteError } = await supabase
      .from('stock_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) throw deleteError;

    const adjustment = (entryType === 'in' || entryType === 'initial') ? -entryQuantity : entryQuantity;
    const newStock = currentStock + adjustment;

    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: Math.max(0, newStock) })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Update per-product stock
    if (productName) {
      const currentProdStock = await fetchSingleProductStock(productName);
      await upsertProductStock(productName, currentProdStock + adjustment);
    }

    await fetchStock();
  };

  const restoreStock = async (quantity: number, orderId?: string) => {
    if (!user) throw new Error('User not authenticated');

    const insertData: any = {
      user_id: user.id,
      type: 'in',
      quantity,
      order_id: orderId || null,
      notes: 'Restok otomatis (order dibatalkan)',
    };

    const { error: entryError } = await supabase
      .from('stock_entries')
      .insert(insertData);

    if (entryError) throw entryError;

    const newStock = currentStock + quantity;
    const { error: updateError } = await supabase
      .from('user_stock')
      .update({ current_stock: newStock })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    await fetchStock();
  };

  return {
    currentStock,
    stockEntries,
    productStocks,
    loading,
    addStock,
    reduceStock,
    restoreStock,
    updateStockEntry,
    deleteStockEntry,
    isLowStock,
    getProductStock,
    refetch: fetchStock,
  };
}
